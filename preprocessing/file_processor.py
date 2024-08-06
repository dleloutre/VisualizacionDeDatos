from base_file_processor import BaseFileProcessor
from constants import *
import dask.dataframe as dd
from utils import *


class FileProcessor(BaseFileProcessor):
    def __init__(self, reduce="mcgs", animate=None, logger=False):
        super().__init__(reduce, animate, logger)
        self.processed_edges = {}
        self.processed_nodes = {}
        self.all_graphs_sizes = []

    def set_datasets(self, dfs):
        self.nodes = dfs['categories']
        self.edges = dfs['edges']
        self.total_nodes = self.nodes.shape[0].compute()
    
    def _get_category_name(self):
        return self.nodes.columns[1]
    
    def _get_category_names(self):
        category_name = self.nodes.columns[1]
        category_source = f"{category_name}_source"
        category_target = f"{category_name}_target"
        return category_source, category_target, category_name

    def prepare_data(self):
        self.logger.info("Starts prepare_data()")
        category_name = self._get_category_name()
        category_source, category_target, category_name = self._get_category_names()
        self.logger.debug(f"Nodes raw:\n{self.nodes.head()}")
        self.logger.debug(f"Edges raw:\n{self.edges.head()}")
        df_w_category = dd.merge(self.nodes[['node_id', category_name]], self.edges, left_on='node_id', right_on='source')
        self.logger.debug(f"First merge:\n{df_w_category.head()}")
        df_w_category = dd.merge(self.nodes[['node_id', category_name]], df_w_category, left_on='node_id', right_on='target')
        self.logger.debug(f"Second merge:\n{df_w_category.head()}")
        df_w_category = df_w_category.rename(columns={f"{category_name}_x": category_source, f"{category_name}_y": category_target})
        df_w_category = df_w_category.drop(['node_id_x','node_id_y'], axis=1)
        self.logger.debug(f"Final dataframe:\n{df_w_category.head()}\n{df_w_category.describe()}")
        self.category_values = self.nodes[category_name].drop_duplicates().compute()
        self.logger.debug(f"Category keys: {self.category_values}")
        self.logger.info("Ends prepare_data()")
        return df_w_category

    def create_edges_files(self, df):
        self.logger.info("Starts create_edges_files()")
        self._ensure_directory_exists(ROUTE_EDGES)
        category_source, category_target, category_name = self._get_category_names()
        for category_value in self.category_values:
            self.logger.info("Preprocessing " + category_value)
            df_filtered = df.loc[(df[[category_source, category_target]] == category_value).all(axis=1)]
            self.logger.debug(f"Filtered edges dataframe:\n{df_filtered.head()}")
            df_filtered = df_filtered.drop([category_source, category_target], axis=1)
            self.logger.debug(f"Internal edges dataframe:\n{df_filtered.head()}\n{df_filtered.describe()}")
            output_edges = f"{ROUTE_EDGES}/dataset_{category_value}.csv"
            df_filtered = self._apply_reduction_if_needed(df_filtered, output_edges)
            if not self.reduce:
                self.logger.debug(f"Writing internal edges file..")
                write_dask_df_to_csv_file(df_filtered, output_edges)
            self.processed_edges[category_value] = df_filtered
            self.logger.info("End processing " + category_value)
        self.logger.info("Ends create_edges_files()")

    def _apply_reduction_if_needed(self, edges, output_edges):
        if self.reduce:
            self.logger.debug("Starts _apply_reduction_if_needed()")
            self.logger.debug(f"Number of internal edges before reduction: {len(edges)}")
            G = get_graph_from_df(edges, 'source', 'target', 'weight')
            G_reduced = self.apply_reduction_algorithm(G)
            self.logger.debug(f"Number of internal edges after reduction: {len(nx.to_pandas_edgelist(G_reduced))}")
            self.logger.debug(f"Writing internal edges file..")
            write_graph_to_csv_file(G_reduced, output_edges)
            self.logger.debug("Ends _apply_reduction_if_needed()")
            df = nx.to_pandas_edgelist(G_reduced)
            self.logger.debug(f"Reduced dataframe:\n{df.head()}")
            return df
        return edges
    
    def _process_graph(self, G):
        self.logger.debug("Starts _process_graph()")
        self.logger.debug(f"G nodes: {G.number_of_nodes()}")
        self.logger.debug(f"G edges: {G.number_of_edges()}")
        df_nodes_position = self.apply_force_algorithm(G)
        df_nodes_position_constrained = self.apply_sphere_constraint(df_nodes_position, int(self.total_nodes), self.all_graphs_sizes)
        df_nodes_position_constrained.columns = ['id_node', 'x', 'y', 'z']
        self.logger.debug(f"Nodes positions:\n{df_nodes_position_constrained.head()}\n{df_nodes_position_constrained.describe()}")
        if self.animate:
            df_nodes_position_constrained = df_nodes_position_constrained.merge(self.df_animation, on='id_node', how='left').fillna(-1)
            self.logger.debug(f"Nodes positions with animation:\n{df_nodes_position_constrained.head()}\n{df_nodes_position_constrained.describe()}")
        self.logger.debug("Ends _process_graph()")
        return df_nodes_position_constrained
    
    def _generate_metadata(self, category):
        return {'label': category, 'color': generate_color()}
    
    def _get_all_nodes(self, category):
        self.logger.debug("Starts _get_all_nodes()")
        if self.reduce:
            return self.processed_edges[category]
        category_name = self._get_category_name()
        df_nodes = self.nodes.loc[self.nodes[category_name] == category]
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
    
    def _get_all_graph_sizes(self):
        category_name = self._get_category_name()
        for category_value in self.category_values:
            df_nodes = self.nodes.loc[self.nodes[category_name] == category_value]
            self.all_graphs_sizes.append(df_nodes.shape[0].compute())

    def create_nodes_files(self):
        self.logger.info("Starts create_nodes_files()")
        self._ensure_directory_exists(ROUTE_NODES)
        data = {}
        all_nodes = []
        self._get_all_graph_sizes()
        for category_value in self.category_values:
            self.logger.info("Preprocessing " + category_value)
            df_edges = self._get_all_nodes(category_value) 
            G = get_graph_from_df(df_edges, 'source', 'target', 'weight')
            output_nodes = f"{ROUTE_NODES}/dataset_{category_value}.csv"
            df_nodes_position = self._process_graph(G)
            self.logger.debug(f"Nodes position:\n{df_nodes_position.head()}")
            self.logger.debug(f"Writing nodes positions file..")
            write_df_to_csv_file(df_nodes_position, output_nodes)
            all_nodes.append(df_nodes_position)
            data[category_value] = self._generate_metadata(category_value)
            self.logger.debug(f"Generating metadata:\n{data[category_value]}")
            self.logger.info("End processing " + category_value)
        self.logger.debug(f"Total number of nodes: {len(all_nodes)}")
        self.processed_nodes = all_nodes
        self.logger.debug(f"Writing data file..")
        write_json(data, f"{ROUTE_JSONS}/data.json")
        self.logger.info("Ends create_nodes_files()")


    def create_crossing_edges_files(self, df):
        self.logger.info("Starts create_crossing_edges_files()")
        category_source, category_target, category_name = self._get_category_names()
        self.logger.debug(f"Merged dataframe:\n{df.head()}")
        all_nodes = pd.concat(self.processed_nodes)
        self.logger.debug(f"All processed nodes:\n{all_nodes.head()}")
        self.logger.debug(f"Amount of nodes: {len(all_nodes)}")
        df_edges = df[(df['source'].isin(all_nodes['id_node'])) & (df['target'].isin(all_nodes['id_node']))]
        self.logger.debug(f"Edges with nodes in processed nodes:\n{df_edges.head()}")
        df_crossing_edges = df_edges.loc[(df[category_source] != df[category_target])]
        self.logger.debug(f"All crossing edges:\n{df_crossing_edges.head()}")
        df_crossing_edges = df_crossing_edges.drop([f"{category_source}", f"{category_target}"], axis=1)
        df_crossing_edges = df_crossing_edges.nlargest(self.limit, 'weight')
        self.logger.debug(f"Crossing edges filtered by weight:\n{df_crossing_edges.head()}")
        self.logger.debug(f"Writing crossing edges file..")
        write_dask_df_to_csv_file(df_crossing_edges, ROUTE_EDGES + '/dataset_crossing.csv')
        self.logger.info("Ends create_crossing_edges_files()")

    def process_files(self):
        self.logger.info("Starting file process")
        data = self.prepare_data()
        self.logger.info("Creating edges files")
        self.create_edges_files(data)
        self.logger.info("Creating nodes files")
        self.create_nodes_files()
        self.logger.info("Creating crossing edges files")
        self.create_crossing_edges_files(data)
