import math
import pandas as pd
from base_file_processor import BaseFileProcessor
from constants import *
from utils import *

class BipartiteFileProcessor(BaseFileProcessor):
    def __init__(self, reduce='mcgs', animate=None):
        super().__init__(reduce, animate)
        self.total_nodes = 0
        self.all_edges = {}
        self.all_nodes = {}

    def set_datasets(self, dfs):
        self.nodes_A = dfs['categories_A']
        self.nodes_B = dfs['categories_B']
        self.edges_A = dfs['edges_A']
        self.edges_B = dfs['edges_B']

    def _get_node_ids(self, bKey):
        self.logger.debug(f"Nodes dict at {bKey}: {self.all_nodes}")
        df = self.all_nodes[bKey]
        self.logger.debug(f"Getting node ids from dataframe: {df.head()}")
        self.logger.debug(f"Getting node ids from dataframe: {df['id_node'].head()}")
        return df['id_node'].drop_duplicates().tolist()

    def create_crossing_edges_files(self):
        self._ensure_directory_exists(ROUTE_EDGES)
        node_ids_A = self._get_node_ids('A')
        node_ids_B = self._get_node_ids('B')

        df_edges_fromA_toB = self.edges_A[self.edges_A['source'].isin(node_ids_A) & self.edges_A['target'].isin(node_ids_B)][['source', 'target', 'weight']]
        df_edges_fromA_toB = df_edges_fromA_toB.nlargest(math.ceil(self.limit/2), 'weight')
        self.logger.debug("Edges from A to B")
        self.logger.debug(df_edges_fromA_toB.head())
        df_edges_fromB_toA = self.edges_B[self.edges_B['source'].isin(node_ids_B) & self.edges_B['target'].isin(node_ids_A)][['source', 'target', 'weight']]
        df_merge = df_edges_fromA_toB.merge(df_edges_fromB_toA, left_on=['source', 'target'], right_on=['target', 'source'])
        self.logger.debug("Edges from B to A")
        self.logger.debug(df_edges_fromB_toA.head())

        df_merge = df_merge.drop(['source_x', 'target_x', 'weight_x'], axis=1).rename(columns={'source_y': 'source', 'target_y': 'target', 'weight_y': 'weight'})
        df_merge = df_merge.drop_duplicates()
        self.logger.debug("Merge")
        self.logger.debug(df_merge.head())

        df_edges_fromB_toA = pd.concat([df_edges_fromB_toA.compute(), df_merge.compute()]).drop_duplicates(keep=False)
        df_edges_fromB_toA = df_edges_fromB_toA.nlargest(math.ceil(self.limit/2), 'weight')
        self.logger.debug("Edges from B to A after dropping duplicates")
        self.logger.debug(df_edges_fromB_toA.head())

        write_dask_df_to_csv_file(df_edges_fromA_toB, ROUTE_BIPARTITE_EDGES_A)
        write_df_to_csv_file(df_edges_fromB_toA, ROUTE_BIPARTITE_EDGES_B)

    def _process_graph(self, G):
        self.logger.debug(f"G nodes: {G.number_of_nodes()}")
        self.logger.debug(f"G edges: {G.number_of_edges()}")
        df_nodes_position = self.apply_force_algorithm(G)
        df_nodes_position_constrained = self.apply_sphere_constraint(df_nodes_position)
        df_nodes_position_constrained.columns = ['id_node', 'x', 'y', 'z']
        if self.animate:
            df_nodes_position_constrained = df_nodes_position_constrained.merge(self.df_animation, on='id_node', how='left').fillna(0)
        return df_nodes_position_constrained
    
    def _generate_metadata(self, category):
        return {'label': category, 'color': generate_color()}
    
    def _apply_reduction_if_needed(self, edges, output_edges):
        G = get_graph_from_df(edges, 'source', 'target', 'weight')
        if self.reduce:
            G_reduced = self.apply_reduction_algorithm(G)
            write_graph_to_csv_file(G_reduced, output_edges)
            return nx.to_pandas_edgelist(G_reduced)
        return edges

    def create_nodes_files(self, category_values, bKey):
        nodes = []
        self._ensure_directory_exists(f"../visualization/public/nodes_{bKey}")
        data = {}
        for category in category_values:
            edges = self.all_edges[category]
            G = get_graph_from_df(edges, 'source', 'target', 'weight')
            output_nodes = f"../visualization/public/nodes_{bKey}/dataset_{category}.csv"
            df_nodes_position = self._process_graph(G)
            self.logger.debug(f"Nodes position:\n{df_nodes_position.head()}")
            self.logger.info("Writing node files")
            write_df_to_csv_file(df_nodes_position, output_nodes)
            nodes.append(df_nodes_position)
            data[category] = self._generate_metadata(category)
            self.logger.info("End processing " + category)
        write_json(data, f"{ROUTE_JSONS}/data_{bKey}.json")
        self.all_nodes[bKey] = pd.concat(nodes)

    def process_edges(self, df, bKey, category_values, category_name):
        self._ensure_directory_exists(f"../visualization/public/edges_{bKey}")
        category_source = f"{category_name}_source"
        category_target = f"{category_name}_target"
        for category_value in category_values:
            self.logger.info("Preprocessing " + category_value)
            self.logger.debug(f"Original dataframe:\n{df.head()}")
            df_filtered = df.loc[(df[[category_source, category_target]] == category_value).any(axis=1)]
            df_filtered = df_filtered.drop([category_source, category_target], axis=1)
            self.logger.debug(f"Filtered dataframe:\n{df_filtered.head()}")
            output_edges = f"../visualization/public/edges_{bKey}/dataset_{category_value}.csv"
            df_filtered = self._apply_reduction_if_needed(df_filtered, output_edges)
            if not self.reduce:
                write_dask_df_to_csv_file(df_filtered, output_edges)
            self.logger.debug(f"Reduced dataframe:\n{df_filtered.head()}")
            self.all_edges[category_value] = df_filtered
            self.total_nodes += len(df_filtered)
        self.logger.debug(f"Total number of nodes: {self.total_nodes}")

    def get_merge_df(self, df_nodes, df_edges):
        category_name = df_nodes.columns[1]
        category_source = f"{category_name}_source"
        category_target = f"{category_name}_target"
        self.logger.debug(f"Nodes:\n{df_nodes.head()}")
        self.logger.debug(f"Edges:\n{df_edges.head()}")
        df = dd.merge(df_nodes[['node_id', category_name]], df_edges, left_on='node_id', right_on='source')
        self.logger.debug(f"First merge:\n{df.head()}")
        df = dd.merge(df_nodes[['node_id', category_name]], df, left_on='node_id', right_on='target')
        self.logger.debug(f"Second merge:\n{df.head()}")
        df = df.rename(columns={f"{category_name}_x": category_source, f"{category_name}_y": category_target})
        df = df.drop(['node_id_x','node_id_y'], axis=1)
        self.logger.debug(f"Final dataframe:\n{df.head()}")

        return df

    def process_files(self):
        self.logger.info("Starting bipartite file process")
        self.all_edges = {}
        category_values_A = self.nodes_A[self.nodes_A.columns[1]].drop_duplicates().compute()
        category_values_B = self.nodes_B[self.nodes_B.columns[1]].drop_duplicates().compute()
        self.logger.debug(f"Category keys for graph A: {category_values_A}")
        self.logger.debug(f"Category keys for graph B: {category_values_B}")
        df_merge_A = self.get_merge_df(self.nodes_A, self.edges_A)
        df_merge_B = self.get_merge_df(self.nodes_B, self.edges_B)
        self.logger.info("Starting edges process")
        self.process_edges(df_merge_A, 'A', category_values_A, self.nodes_A.columns[1])
        self.process_edges(df_merge_B, 'B', category_values_B, self.nodes_B.columns[1])
        self.logger.info("Creating node files")
        self.create_nodes_files(category_values_A, 'A')
        self.create_nodes_files(category_values_B, 'B')
        self.logger.info("Creating crossing edges file")
        self.create_crossing_edges_files()
