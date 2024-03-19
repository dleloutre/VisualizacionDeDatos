import sys
import time
import pandas as pd
from graph_reducer import *

def directed_diameter(G):
    shortest_path_lengths = dict(nx.all_pairs_shortest_path_length(G))
    diameter = 0

    for _source, lengths in shortest_path_lengths.items():
        max_length = max(lengths.values())
        diameter = max(diameter, max_length)
    
    return diameter

def show_properties(G):
    print("Cantidad de nodos: ", len(G.nodes()))
    print("Cantidad de aristas: ", len(G.edges()))
    print("Coeficiente de clustering: ", nx.average_clustering(G))
    print("Diametro: ", directed_diameter(G))
    print("Grado promedio: ", sum(d[1] for d in nx.degree(G))/nx.number_of_nodes(G))
    print("Densidad: ", nx.density(G))

def get_reducer(reducerType):
    if reducerType == 'transitive':
        return TransitiveGraphReducer()
    if reducerType == 'mcgs':
        return MCGSReducer()
    if reducerType == 'degree':
        return ByDegreeGraphReducer()
    return None

def get_graph(fileName):
    df = pd.read_csv(fileName, sep=';', header=0, names=["v1", "v2", "weight"])
    return nx.from_pandas_edgelist(df, source='v1', target='v2', edge_attr=['weight'], create_using=nx.DiGraph())

def main():
    G = get_graph(sys.argv[1])
    reducer = get_reducer(sys.argv[2])
    outputDir = sys.argv[3]
    # show_properties(G)
    # reduce connected components separately and then join again
    subgraphs = []
    connected_components = nx.weakly_connected_components(G)
    for connected_component in connected_components:
        subgraph = G.subgraph(connected_component).copy()
        subgraphs.append(reducer.reduce(subgraph))
    Gs = nx.compose_all(subgraphs)
    # show_properties(Gs)
    nx.write_weighted_edgelist(Gs, outputDir, delimiter=';', encoding='utf-8')

if __name__=="__main__":
    start_time = time.time()
    main()
    print("--- %s seconds ---" % (time.time() - start_time))
