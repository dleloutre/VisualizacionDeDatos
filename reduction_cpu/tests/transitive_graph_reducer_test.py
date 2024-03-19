import pytest
import networkx as nx
from graph_reducer import *

def test_simple_reduction():
    G = nx.DiGraph()
    G.add_edges_from([(1, 2), (2, 3), (3, 4)])
    reducer = TransitiveGraphReducer()
    reduced_G = reducer.reduce(G)
    
    assert list(reduced_G.edges()) == [(2, 3)]
    assert len(reduced_G.nodes()) == 2
    assert len(reduced_G.edges()) == 1

def test_cyclic_graph():
    G = nx.DiGraph()
    G.add_edges_from([(1, 2), (2, 3), (1, 3)])
    reducer = TransitiveGraphReducer()
    reduced_G = reducer.reduce(G)
    
    assert list(reduced_G.edges()) == [(1, 3)]
    assert list(reduced_G.nodes()) == [1, 3]

def test_empty_graph():
    G = nx.DiGraph()
    reducer = TransitiveGraphReducer()
    reduced_G = reducer.reduce(G)
    
    assert len(reduced_G.nodes()) == 0
    assert list(reduced_G.nodes()) == []
    assert len(reduced_G.edges()) == 0
    assert list(reduced_G.edges()) == []

def test_single_node():
    G = nx.DiGraph()
    G.add_node(1)
    reducer = TransitiveGraphReducer()
    reduced_G = reducer.reduce(G)
    
    assert len(reduced_G.nodes()) == 1
    assert list(reduced_G.nodes()) == [1]
    assert len(reduced_G.edges()) == 0
    assert list(reduced_G.edges()) == []
    

def test_edges_in():
    G = nx.DiGraph()
    G.add_edges_from([(1, 2), (1, 3), (1, 4), (4, 5)])
    reducer = TransitiveGraphReducer()
    reduced_graph = reducer.reduce(G)
    
    assert len(reduced_graph.nodes()) == 2
    assert list(reduced_graph.nodes()) == [1, 4]
    assert len(reduced_graph.edges()) == 1
    assert list(reduced_graph.edges()) == [(1, 4)]

def test_edges_out():
    G = nx.DiGraph()
    G.add_edges_from([(2, 1), (3, 1), (4, 1), (5, 4)])
    reducer = TransitiveGraphReducer()
    reduced_graph = reducer.reduce(G)
    
    assert len(reduced_graph.nodes()) == 2
    assert list(reduced_graph.nodes()) == [1, 4]
    assert len(reduced_graph.edges()) == 1
    assert list(reduced_graph.edges()) == [(4, 1)]

if __name__ == "__main__":
    pytest.main()