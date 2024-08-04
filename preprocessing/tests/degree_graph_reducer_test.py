import pytest
import networkx as nx
from graph_reduction.degree_reducer import ByDegreeGraphReducer

def test_simple_reduction():
    G = nx.DiGraph()
    G.add_edges_from([(1, 2), (2, 3), (3, 4)])
    reducer = ByDegreeGraphReducer()
    reducer.set_rate(0.5)
    reduced_G = reducer.reduce(G)
    
    assert list(reduced_G.edges()) == [(2, 4)]
    assert len(reduced_G.nodes()) == 2
    assert len(reduced_G.edges()) == 1

def test_cyclic_graph():
    G = nx.DiGraph()
    G.add_edges_from([(1, 2), (2, 3), (1, 3)])
    reducer = ByDegreeGraphReducer()
    reducer.set_rate(0.33)
    reduced_G = reducer.reduce(G)
    
    assert list(reduced_G.edges()) == []
    assert list(reduced_G.nodes()) == [1]

def test_empty_graph():
    G = nx.DiGraph()
    reducer = ByDegreeGraphReducer()
    reduced_G = reducer.reduce(G)
    
    assert len(reduced_G.nodes()) == 0
    assert list(reduced_G.nodes()) == []
    assert len(reduced_G.edges()) == 0
    assert list(reduced_G.edges()) == []

def test_single_node():
    G = nx.DiGraph()
    G.add_node(1)
    reducer = ByDegreeGraphReducer()
    reduced_G = reducer.reduce(G)
    
    assert len(reduced_G.nodes()) == 1
    assert list(reduced_G.nodes()) == [1]
    assert len(reduced_G.edges()) == 0
    assert list(reduced_G.edges()) == []

def test_edges_in():
    G = nx.DiGraph()
    G.add_edges_from([(1, 2), (1, 3), (1, 4), (4, 5)])
    reducer = ByDegreeGraphReducer()
    reducer.set_rate(0.4)
    reduced_graph = reducer.reduce(G)
    
    assert len(reduced_graph.nodes()) == 2
    assert list(reduced_graph.nodes()) == [1, 5]
    assert len(reduced_graph.edges()) == 1
    assert list(reduced_graph.edges()) == [(1, 5)]

def test_edges_out():
    G = nx.DiGraph()
    G.add_edges_from([(2, 1), (3, 1), (4, 1), (5, 4)])
    reducer = ByDegreeGraphReducer()
    reducer.set_rate(0.4)
    reduced_graph = reducer.reduce(G)
    
    assert len(reduced_graph.nodes()) == 2
    assert list(reduced_graph.nodes()) == [1, 5]
    assert len(reduced_graph.edges()) == 1
    assert list(reduced_graph.edges()) == [(5, 1)]

if __name__ == "__main__":
    pytest.main()