import pytest
import networkx as nx
from preprocessing_cpu.graph_reducer import *

@pytest.fixture
def test_graph_in():
    G = nx.DiGraph()
    G.add_edges_from([(1, 2), (1, 3), (1, 4), (4, 5)])
    return G

@pytest.fixture
def test_graph_out():
    G = nx.DiGraph()
    G.add_edges_from([(2, 1), (3, 1), (4, 1), (5, 4)])
    return G

def test_iterative_graph_reducer_in(test_graph_in):
    reducer = IterativeGraphReducer()
    reduced_graph = reducer.reduce(test_graph_in)
    
    assert len(reduced_graph.nodes()) == 2
    assert len(reduced_graph.edges()) == 1
    assert reduced_graph.has_edge(1, 5)

    # Assert the expected result
    #assert nx.is_isomorphic(reduced_graph, nx.DiGraph([(1, 5)]))

def test_iterative_graph_reducer_out(test_graph_out):
    reducer = IterativeGraphReducer()
    reduced_graph = reducer.reduce(test_graph_out)
    
    assert len(reduced_graph.nodes()) == 2
    assert len(reduced_graph.edges()) == 1
    assert reduced_graph.has_edge(5, 1)

    # Assert the expected result
    #assert nx.is_isomorphic(reduced_graph, nx.DiGraph([(1, 5)]))

if __name__ == "__main__":
    pytest.main()