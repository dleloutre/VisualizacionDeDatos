import pytest
import networkx as nx
from preprocessing_cpu.graph_reducer import *

def test_simple_reduction():
    G = nx.DiGraph()
    G.add_edges_from([(1, 2), (2, 3), (3, 4)])
    reducer = IterativeGraphReducer()
    reduced_G = reducer.reduce(G)
    
    #assert list(reduced_G.edges()) == [(1, 4)]
    assert len(reduced_G.nodes()) == 2 ##Chequear cual es el grafo que queda
    assert len(reduced_G.edges()) == 1

def test_cyclic_graph(): ##Habria que ver bien este caso, que hacemos con los ciclos?
    G = nx.DiGraph()
    G.add_edges_from([(1, 2), (2, 3), (1, 3)])
    reducer = IterativeGraphReducer()
    reduced_G = reducer.reduce(G)
    
    assert list(reduced_G.edges()) == [(1, 2), (2, 3), (1, 3)]

def test_empty_graph():
    G = nx.DiGraph()
    reducer = IterativeGraphReducer()
    reduced_G = reducer.reduce(G)
    
    assert len(reduced_G.nodes()) == 0
    assert list(reduced_G.nodes()) == []
    assert len(reduced_G.edges()) == 0
    assert list(reduced_G.edges()) == []

def test_single_node():
    G = nx.DiGraph()
    G.add_node(1)
    reducer = IterativeGraphReducer()
    reduced_G = reducer.reduce(G)
    
    assert len(reduced_G.nodes()) == 1
    assert list(reduced_G.nodes()) == [1]
    assert len(reduced_G.edges()) == 0
    assert list(reduced_G.edges()) == []
    

def test_edges_in():
    G = nx.DiGraph()
    G.add_edges_from([(1, 2), (1, 3), (1, 4), (4, 5)])
    reducer = IterativeGraphReducer()
    reduced_graph = reducer.reduce(G)
    
    assert len(reduced_graph.nodes()) == 2
    assert list(reduced_graph.nodes()) == [1, 5]
    assert len(reduced_graph.edges()) == 1
    assert list(reduced_graph.edges()) == [(1, 5)]

def test_edges_out():
    G = nx.DiGraph()
    G.add_edges_from([(2, 1), (3, 1), (4, 1), (5, 4)])
    reducer = IterativeGraphReducer()
    reduced_graph = reducer.reduce(G)
    
    assert len(reduced_graph.nodes()) == 2
    assert list(reduced_graph.nodes()) == [1, 5]
    assert len(reduced_graph.edges()) == 1
    assert list(reduced_graph.edges()) == [(5, 1)]

if __name__ == "__main__":
    pytest.main()