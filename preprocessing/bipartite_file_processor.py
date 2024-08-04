import math
import pandas as pd
from base_file_processor import BaseFileProcessor
from constants import *
from utils import *

class BipartiteFileProcessor(BaseFileProcessor):
    def __init__(self, reduce='mcgs', animate=None, logger=False):
        super().__init__(reduce, animate, logger)
        self.processed_edges = {}
        self.all_nodes = {}

    def set_datasets(self, dfs):
        self.nodes_A = dfs['categories_A']
        self.nodes_B = dfs['categories_B']
        self.edges_A = dfs['edges_A']
        self.edges_B = dfs['edges_B']

    def _get_node_ids(self, bKey):
        self.logger.debug("Starts _get_node_ids()")
        self.logger.debug(f"Nodes dict at {bKey}: {self.all_nodes}")
        df = self.all_nodes[bKey]
        self.logger.debug(f"Getting node ids from dataframe:\n{df.head()}")
        self.logger.debug(f"Getting node ids from dataframe:\n{df['id_node'].head()}")
        self.logger.debug("Ends _get_node_ids()")
        return df['id_node'].drop_duplicates().tolist()

    def create_crossing_edges_files(self):
        self.logger.info("Starts create_crossing_edges_files()")
        self._ensure_directory_exists(ROUTE_EDGES)
        node_ids_A = self._get_node_ids('A')
        node_ids_B = self._get_node_ids('B')

        df_edges_fromA_toB = self.edges_A[self.edges_A['source'].isin(node_ids_A) & self.edges_A['target'].isin(node_ids_B)][['source', 'target', 'weight']]
        df_edges_fromA_toB = df_edges_fromA_toB.nlargest(math.ceil(self.limit/2), 'weight')
        self.logger.debug(f"Edges from A to B:\n {df_edges_fromA_toB.head()}\n{df_edges_fromA_toB.describe()}")
        df_edges_fromB_toA = self.edges_B[self.edges_B['source'].isin(node_ids_B) & self.edges_B['target'].isin(node_ids_A)][['source', 'target', 'weight']]
        df_merge = df_edges_fromA_toB.merge(df_edges_fromB_toA, left_on=['source', 'target'], right_on=['target', 'source'])
        self.logger.debug(f"Edges from B to A:\n{df_edges_fromB_toA.head()}\n{df_edges_fromB_toA.describe()}")

        df_merge = df_merge.drop(['source_x', 'target_x', 'weight_x'], axis=1).rename(columns={'source_y': 'source', 'target_y': 'target', 'weight_y': 'weight'})
        df_merge = df_merge.drop_duplicates()
        self.logger.debug(f"Result of merge:\n{df_merge.head()}")

        df_edges_fromB_toA = pd.concat([df_edges_fromB_toA.compute(), df_merge.compute()]).drop_duplicates(keep=False)
        df_edges_fromB_toA = df_edges_fromB_toA.nlargest(math.ceil(self.limit/2), 'weight')
        self.logger.debug(f"Edges from B to A after dropping duplicates:\n{df_edges_fromB_toA.head()})\n{df_edges_fromB_toA.describe()}")
        
        self.logger.debug(f"Writing edges from A to B file..")
        write_dask_df_to_csv_file(df_edges_fromA_toB, ROUTE_BIPARTITE_EDGES_A)
        self.logger.debug(f"Writing edges from B to A file..")
        write_df_to_csv_file(df_edges_fromB_toA, ROUTE_BIPARTITE_EDGES_B)
        self.logger.info("Ends create_crossing_edges_files()")

    def _process_graph(self, G):
        self.logger.debug("Starts _process_graph()")
        self.logger.debug(f"G nodes: {G.number_of_nodes()}")
        self.logger.debug(f"G edges: {G.number_of_edges()}")
        total_nodes = G.number_of_nodes()
        df_nodes_position = self.apply_force_algorithm(G)
        df_nodes_position_constrained = self.apply_sphere_constraint(df_nodes_position, total_nodes)
        df_nodes_position_constrained.columns = ['id_node', 'x', 'y', 'z']
        self.logger.debug(f"Nodes positions:\n{df_nodes_position_constrained.head()}\n{df_nodes_position_constrained.describe()}")
        if self.animate:
            df_nodes_position_constrained = df_nodes_position_constrained.merge(self.df_animation, on='id_node', how='left').fillna(0)
            self.logger.debug(f"Nodes positions with animation:\n{df_nodes_position_constrained.head()}\n{df_nodes_position_constrained.describe()}")
        self.logger.debug("Ends _process_graph()")
        return df_nodes_position_constrained
    
    def _generate_metadata(self, category):
        return {'label': category, 'color': generate_color()}
    
    def _apply_reduction_if_needed(self, edges):
        if self.reduce:
            self.logger.debug("Starts _apply_reduction_if_needed()")
            self.logger.debug(f"Number of internal edges before reduction: {len(edges)}")
            G = get_graph_from_df(edges, 'source', 'target', 'weight')
            G_reduced = self.apply_reduction_algorithm(G)
            self.logger.debug(f"Number of internal edges after reduction: {len(nx.to_pandas_edgelist(G_reduced))}")
            df = nx.to_pandas_edgelist(G_reduced)
            self.logger.debug(f"Reduced dataframe:\n{df.head()}")
            self.logger.debug("Ends _apply_reduction_if_needed()")
            return df
        return edges
    
    def _get_all_nodes(self, category, key):
        self.logger.debug("Starts _get_all_nodes()")
        if self.reduce:
            return self.processed_edges[category]
        nodes = self.nodes_A if key == 'A' else self.nodes_B
        category_name = nodes.columns[1]
        df_nodes = nodes.loc[nodes[category_name] == category]
        self.logger.debug(f"Nodes in category {category}:\n{df_nodes.head()}")
        df_processed_edges = self.processed_edges[category]
        list_source = list(df_processed_edges['source'])
        list_target = list(df_processed_edges['target'])
        df_nodes = df_nodes.loc[~df_nodes['node_id'].isin(set(list_source + list_target))]
        self.logger.debug(f"Nodes without internal edges:\n{df_nodes.head()}")
        df_nodes = df_nodes.drop([category_name], axis=1)
        df_nodes = df_nodes.rename(columns={'node_id': 'source'})
        df_nodes['target'] = df_nodes['source']
        df_nodes['weight'] = 1
        self.logger.debug(f"Final dataframe for nodes without internal edges:\n{df_nodes.head()}")
        df_edges = dd.concat([df_nodes, self.processed_edges[category]])
        self.logger.debug(f"All nodes in category {category}:\n{df_edges.head()}")
        self.logger.debug("Ends _get_all_nodes()")
        return df_edges

    def create_nodes_files(self, category_values, bKey):
        self.logger.info("Starts create_nodes_files()")
        nodes = []
        self._ensure_directory_exists(f"../visualization/public/nodes_{bKey}")
        data = {}
        for category_value in category_values:
            self.logger.info("Preprocessing " + category_value)
            df_edges = self._get_all_nodes(category_value, bKey) 
            G = get_graph_from_df(df_edges, 'source', 'target', 'weight')
            output_nodes = f"../visualization/public/nodes_{bKey}/dataset_{category_value}.csv"
            df_nodes_position = self._process_graph(G)
            self.logger.debug(f"Nodes position:\n{df_nodes_position.head()}")
            self.logger.debug(f"Writing nodes positions file..")
            write_df_to_csv_file(df_nodes_position, output_nodes)
            nodes.append(df_nodes_position)
            data[category_value] = self._generate_metadata(category_value)
            self.logger.debug(f"Generating metadata:\n{data[category_value]}")
            self.logger.info("End processing " + category_value)
        self.logger.debug(f"Writing data file..")
        write_json(data, f"{ROUTE_JSONS}/data_{bKey}.json")
        self.all_nodes[bKey] = pd.concat(nodes)
        self.logger.info("Ends create_nodes_files()")

    def process_edges(self, df, bKey, category_values, category_name):
        self.logger.info("Starts process_edges()")
        self._ensure_directory_exists(f"../visualization/public/edges_{bKey}")
        category_source = f"{category_name}_source"
        category_target = f"{category_name}_target"
        for category_value in category_values:
            self.logger.info("Preprocessing " + category_value)
            self.logger.debug(f"Merged dataframe:\n{df.head()}")
            df_filtered = df.loc[(df[[category_source, category_target]] == category_value).all(axis=1)]
            self.logger.debug(f"Filtered edges dataframe:\n{df_filtered.head()}")
            df_filtered = df_filtered.drop([category_source, category_target], axis=1)
            self.logger.debug(f"Internal edges dataframe:\n{df_filtered.head()}\n{df_filtered.describe()}")
            df_filtered = self._apply_reduction_if_needed(df_filtered)
            self.processed_edges[category_value] = df_filtered
            self.logger.info("End processing " + category_value)
        self.logger.info("Ends process_edges()")

    def get_merge_df(self, df_nodes, df_edges):
        self.logger.info("Starts get_merge_df()")
        category_name = df_nodes.columns[1]
        category_source = f"{category_name}_source"
        category_target = f"{category_name}_target"
        self.logger.debug(f"Nodes raw:\n{df_nodes.head()}")
        self.logger.debug(f"Edges raw:\n{df_edges.head()}")
        df = dd.merge(df_nodes[['node_id', category_name]], df_edges, left_on='node_id', right_on='source')
        self.logger.debug(f"First merge:\n{df.head()}")
        df = dd.merge(df_nodes[['node_id', category_name]], df, left_on='node_id', right_on='target')
        self.logger.debug(f"Second merge:\n{df.head()}")
        df = df.rename(columns={f"{category_name}_x": category_source, f"{category_name}_y": category_target})
        df = df.drop(['node_id_x','node_id_y'], axis=1)
        self.logger.debug(f"Final dataframe:\n{df.head()}\n{df.describe()}")
        self.logger.info("Ends get_merge_df()")
        return df

    def process_files(self):
        self.logger.info("Starting bipartite file process")
        self.processed_edges = {}
        category_values_A = self.nodes_A[self.nodes_A.columns[1]].drop_duplicates().compute()
        category_values_B = self.nodes_B[self.nodes_B.columns[1]].drop_duplicates().compute()
        self.logger.debug(f"Category keys for graph A: {category_values_A}")
        self.logger.debug(f"Category keys for graph B: {category_values_B}")
        df_merge_A = self.get_merge_df(self.nodes_A, self.edges_A)
        df_merge_B = self.get_merge_df(self.nodes_B, self.edges_B)
        self.logger.info("Processing edges")
        self.process_edges(df_merge_A, 'A', category_values_A, self.nodes_A.columns[1])
        self.process_edges(df_merge_B, 'B', category_values_B, self.nodes_B.columns[1])
        self.logger.info("Creating node files")
        self.create_nodes_files(category_values_A, 'A')
        self.create_nodes_files(category_values_B, 'B')
        self.logger.info("Creating crossing edges file")
        self.create_crossing_edges_files()
