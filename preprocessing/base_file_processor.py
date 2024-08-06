from abc import ABC, abstractmethod
from collections import deque
import logging
import networkx as nx
from constants import *
from force_directed.force_algorithm import ForceAlgorithm
from force_directed.sphere_constraint import SphereConstraint
from utils import *

class BaseFileProcessor(ABC):
    def __init__(self, reduction_type, process_animation, logger):
        self.reduce = reduction_type
        self.animate = process_animation
        self.df_animation = None
        self.limit = EDGES_LIMIT
        self.reducer_rate = None
        self.radius = None
        self.logger = logging.getLogger(self.__class__.__name__)
        if not logger:
            self.logger.setLevel(logging.CRITICAL + 1)
        else:
            self.logger.setLevel(logging.DEBUG)

    @abstractmethod
    def process_files(self):
        pass

    @abstractmethod
    def set_datasets(self, dfs):
        pass

    def set_reducer_rate(self, new_rate):
        self.reducer_rate = new_rate

    def set_edges_limit(self, new_limit):
        self.limit = new_limit

    def set_radius(self, new_radius):
        self.radius = new_radius

    def process_animation_files(self):
        self.logger.info("Starting animation file process")
        df_animation = pd.read_csv(ROUTE_UPLOADED_FILES + self.animate)
        G = nx.DiGraph()
        for index, row in df_animation.iterrows():
            G.add_edge(row.iloc[0], row.iloc[1], timestamp=row.iloc[2])
        self.logger.info("Searching for the largest tree...")
        tree, root = self.get_max_directed_tree(G)
        self.logger.debug(f"Largest tree: {tree}")
        self.logger.debug(f"Root of the largest tree: {root}")
        
        self.logger.info("Searching tree depths...")
        depths = self.calculate_depth(tree, root)
        self.logger.info("Saving nodes and depths info...")
        df_animation_processed = pd.DataFrame(list(depths.items()))
        df_animation_processed.columns = ['id_node', 'depth']
        self.df_animation = df_animation_processed
        self.logger.debug(self.df_animation.head())
        self.logger.info("Depths dataframe created successfully.")

    def _ensure_directory_exists(self, path):
        if not os.path.isdir(path):
            os.mkdir(path)

    def apply_reduction_algorithm(self, G):
        self.logger.info("Applying reduction algorithm")
        reducer = get_reducer(self.reduce)
        if self.reducer_rate:
            reducer.set_rate(float(self.reducer_rate))
        subgraphs = []
        connected_components = nx.weakly_connected_components(G)
        for connected_component in connected_components:
            subgraph = G.subgraph(connected_component).copy()
            subgraphs.append(reducer.reduce(subgraph))
        G_reduced = nx.compose_all(subgraphs)
        return G_reduced

    def apply_force_algorithm(self, G):
        self.logger.info("Applying force algorithm")
        force_alg = ForceAlgorithm()
        df_nodes_position = force_alg.apply_force_algorithm_3D(G)
        return df_nodes_position

    def apply_sphere_constraint(self, df_nodes_position, total_nodes, all_graphs_sizes):
        self.logger.info("Applying sphere constraint")
        sphere_radius = len(df_nodes_position)/total_nodes
        self.logger.debug(f"Sphere radius: {sphere_radius}")
        self.logger.debug(f"Sphere radius scalator: {self.radius}")
        sphere_constraint = SphereConstraint(sphere_radius, total_nodes, all_graphs_sizes, self.radius)
        df_nodes_position_constrained = sphere_constraint.constrain_to_sphere(df_nodes_position)
        return df_nodes_position_constrained

    def get_max_directed_tree(self, subgraph):
        root_candidates = [n for n in subgraph.nodes if subgraph.in_degree(n) == 0]
        self.logger.debug(f"Root candidates: {root_candidates}")
        max_tree = nx.DiGraph()
        for root in root_candidates:
            tree = nx.DiGraph()
            queue = deque([(root, None, None)])
            visited = set()
            while queue:
                node, parent, parent_timestamp = queue.popleft()
                if node in visited:
                    continue
                visited.add(node)
                if parent is not None:
                    tree.add_edge(parent, node, timestamp=parent_timestamp)
                for successor, data in sorted(subgraph[node].items(), key=lambda x: x[1]['timestamp']):
                    if parent_timestamp is None or data['timestamp'] > parent_timestamp:
                        queue.append((successor, node, data['timestamp']))
            if tree.number_of_nodes() > max_tree.number_of_nodes():
                max_tree = tree
                max_root = root

        return max_tree, max_root
    
    def calculate_depth(self, tree, root):
        depths = {root: 0}
        queue = deque([root])

        while queue:
            node = queue.popleft()
            for neighbor in tree.successors(node):
                if neighbor not in depths:
                    depths[neighbor] = depths[node] + 1
                    queue.append(neighbor)

        return depths