import pytest
import networkx as nx
from main import *

G1 = nx.DiGraph()
G1.add_edge(1, 2, timestamp="2024-01-01 10:00:00")
G1.add_edge(1, 3, timestamp="2024-01-01 11:00:00")
G1.add_edge(3, 4, timestamp="2024-01-01 12:00:00")
process_1 = FileProcessor(False, True)
process_1.df_animation = nx.to_pandas_edgelist(G1)

G2 = nx.DiGraph()
G2.add_edge(1, 2, timestamp="2024-01-01 10:00:00")
G2.add_edge(2, 6, timestamp="2024-01-01 00:00:00")
G2.add_edge(1, 3, timestamp="2024-01-01 11:00:00")
G2.add_edge(3, 4, timestamp="2024-01-01 12:00:00")
G2.add_edge(4, 5, timestamp="2024-01-01 13:00:00")
G2.add_edge(4, 10, timestamp="2024-01-01 14:00:00")
G2.add_edge(7, 8, timestamp="2024-01-01 10:00:00")
G2.add_edge(7, 9, timestamp="2024-01-01 11:00:00")
process_2 = FileProcessor(False, True)
process_2.df_animation = nx.to_pandas_edgelist(G2)

def test_01_get_max_directed_ordered_tree():
    max_tree, root = process_1.get_max_directed_tree(G1)
    assert nx.is_arborescence(max_tree)
    assert len(max_tree.nodes) == 4
    assert len(max_tree.edges) == 3
    assert root == 1

def test_02_get_max_directed_unordered_tree():
    max_tree,root = process_2.get_max_directed_tree(G2)
    assert nx.is_arborescence(max_tree)
    assert len(max_tree.nodes) == 6
    assert len(max_tree.edges) == 5
    assert root == 1

def test_03_calculate_depth_simple_graph():
    tree = nx.DiGraph()
    tree.add_edge(1, 2)
    tree.add_edge(1, 3)
    tree.add_edge(2, 4)
    tree.add_edge(2, 5)
    process = FileProcessor(False, True)
    process.df_animation = nx.to_pandas_edgelist(tree)
    depths = process.calculate_depth(tree, 1)
    expected_depths = {1: 0, 2: 1, 3: 1, 4: 2, 5: 2}
    assert depths == expected_depths

def test_04_calculate_depth_tree_graph():
    G = nx.DiGraph()
    G.add_edge(1, 2, timestamp="2024-01-01 10:00:00")
    G.add_edge(1, 3, timestamp="2024-01-01 11:00:00")
    G.add_edge(3, 4, timestamp="2024-01-01 12:00:00")
    G.add_edge(4, 5, timestamp="2024-01-01 13:00:00")
    G.add_edge(4, 10, timestamp="2024-01-01 14:00:00")
    process = FileProcessor(False, True)
    process.df_animation = nx.to_pandas_edgelist(G)
    depths = process.calculate_depth(G, 1)
    expected_depths = {1: 0, 2: 1, 3: 1, 4: 2, 5: 3, 10: 3}
    assert depths == expected_depths

def test_05_process_tree_simple():
    G = nx.DiGraph()
    G.add_edge(1, 2, timestamp=1)
    G.add_edge(2, 3, timestamp=2)
    G.add_edge(3, 4, timestamp=3)
    G.add_edge(5, 6, timestamp=4)
    G.add_edge(6, 7, timestamp=5)
    process = FileProcessor(False, True)
    process.df_animation = nx.to_pandas_edgelist(G)
    depths = process.calculate_depth(G, 1)
    expected_depths = {1: 0, 2: 1, 3: 2, 4: 3}
    assert depths == expected_depths

def test_06_process_tree_unordered_graph():
    depths = process_2.calculate_depth(G2, 1)
    expected_depths = {1: 0, 2: 1, 3: 1, 4: 2, 6:2, 5: 3, 10: 3}
    assert depths == expected_depths

if __name__ == "__main__":
    pytest.main()