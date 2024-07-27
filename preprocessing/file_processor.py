from base_file_processor import BaseFileProcessor
from constants import *
import dask.dataframe as dd
from utils import *


class FileProcessor(BaseFileProcessor):
    def __init__(self, reduce="mcgs", animate=None):
        super().__init__(reduce, animate)
        self.total_nodes = 0
        self.graph = None
        self.processed_edges = pd.DataFrame({})

    def set_datasets(self, dfs):
        self.nodes = dfs['categories']
        self.edges = dfs['edges']

    def _get_category_name(self):
        return self.nodes.columns[1]

    def prepare_data(self):
        category_name = self._get_category_name()
        category_source = f"{category_name}_source"
        category_target = f"{category_name}_target"
        self.logger.debug(f"Nodes:\n{self.nodes.head()}")
        self.logger.debug(f"Edges:\n{self.edges.head()}")
        df_w_category = dd.merge(self.nodes[['node_id', category_name]], self.edges, left_on='node_id', right_on='source')
        self.logger.debug(f"First merge:\n{df_w_category.head()}")
        df_w_category = dd.merge(self.nodes[['node_id', category_name]], df_w_category, left_on='node_id', right_on='target')
        self.logger.debug(f"Second merge:\n{df_w_category.head()}")
        df_w_category = df_w_category.rename(columns={f"{category_name}_x": category_source, f"{category_name}_y": category_target})
        df_w_category = df_w_category.drop(['node_id_x','node_id_y'], axis=1)
        self.logger.debug(f"Final dataframe:\n{df_w_category.head()}")

        self.category_values = self.nodes[category_name].drop_duplicates().compute()
        ##self.category_values = ["n_arthaud", "jeanlassalle"]
        self.logger.debug(f"Category keys: {self.category_values}")

        return df_w_category

    def create_edges_files(self, df):
        all_edges = []
        self.logger.debug(f"Original dataframe: {df}")
        self._ensure_directory_exists(ROUTE_EDGES)
        category_name = self._get_category_name()
        category_source = f"{category_name}_source"
        category_target = f"{category_name}_target"
        for category_value in self.category_values:
            self.logger.info("Preprocessing " + category_value)
            df_filtered = df.loc[(df[[category_source, category_target]] == category_value).any(axis=1)]
            df_filtered = df_filtered.drop([category_source, category_target], axis=1)
            self.logger.debug(f"Filtered dataframe:\n{df_filtered.head()}")
            output_edges = f"{ROUTE_EDGES}/dataset_{category_value}.csv"
            df_filtered = self._apply_reduction_if_needed(df_filtered, output_edges)
            self.logger.debug(f"Reduced dataframe:\n{df_filtered.head()}")
            all_edges.append(df_filtered)
            self.total_nodes += len(df_filtered)
        self.processed_edges = dd.concat(all_edges)
        self.logger.debug(f"Total number of nodes: {self.total_nodes}")
        self.logger.debug(f"Total edges: {self.processed_edges.head()}")

    def _apply_reduction_if_needed(self, edges, output_edges):
        G = get_graph_from_df(edges, 'source', 'target', 'weight')
        if self.reduce:
            G_reduced = self.apply_reduction_algorithm(G)
            write_graph_to_csv_file(G_reduced, output_edges)
            return nx.to_pandas_edgelist(G_reduced)
        return edges
    
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

    def create_nodes_files(self):
        self._ensure_directory_exists(ROUTE_NODES)
        data = {}
        for category in self.category_values:
            G = get_graph_from_df(self.processed_edges, 'source', 'target', 'weight')
            output_nodes = f"{ROUTE_NODES}/dataset_{category}.csv"
            df_nodes_position = self._process_graph(G)
            self.logger.debug(f"Nodes position:\n{df_nodes_position.head()}")
            self.logger.info("Writing files")
            write_df_to_csv_file(df_nodes_position, output_nodes)
            data[category] = self._generate_metadata(category)
            self.logger.info("End processing " + category)
        write_json(data, f"{ROUTE_JSONS}/data.json")

    def create_crossing_edges_files(self, df):
        category_name = self._get_category_name()
        category_source = f"{category_name}_source"
        category_target = f"{category_name}_target"
        df_edges = df.merge(self.processed_edges, on=['source', 'target', 'weight'], suffixes=[None,"_y"])
        df_crossing_edges = df_edges.loc[(df[category_source] != df[category_target])]
        self.logger.debug(f"All crossing edges:\n{df_crossing_edges.head()}")
        df_crossing_edges = df_crossing_edges.drop([f"{category_name}_source", f"{category_name}_target"], axis=1)
        df_crossing_edges = df_crossing_edges.nlargest(self.limit, 'weight')
        self.logger.debug(f"Filtered crossing edges ordered by weight:\n{df_crossing_edges.head()}")
        write_dask_df_to_csv_file(df_crossing_edges, ROUTE_EDGES + '/dataset_crossing.csv')

    def process_files(self):
        self.logger.info("Starting file process")
        data = self.prepare_data()
        self.logger.info("Creating edges files")
        self.create_edges_files(data)
        self.logger.info("Creating nodes files")
        self.create_nodes_files()
        self.logger.info("Creating crossing edges files")
        self.create_crossing_edges_files(data)
