import sys
import pandas as pd
from graph_reducer import *

# chequear
def directed_diameter(G):
    shortest_path_lengths = dict(nx.all_pairs_shortest_path_length(G))
    diameter = 0
    
    for source, lengths in shortest_path_lengths.items():
        max_length = max(lengths.values())
        diameter = max(diameter, max_length)
    
    return diameter

def main():
    reduceFile = sys.argv[1]
    df = pd.read_csv(reduceFile, sep=';', header=0, names=["v1", "v2", "_ignore"])
    G = nx.from_pandas_edgelist(df, source='v1', target='v2', create_using=nx.DiGraph())
    print("Cantidad inicial de nodos: ", len(G.nodes()))
    print("Cantidad inicial de aristas: ", len(G.edges()))
    print("Coeficiente de clustering: ", nx.average_clustering(G))
    print("Diametro: ", directed_diameter(G))
    print("Grado promedio: ", sum(d[1] for d in nx.degree(G))/nx.number_of_nodes(G))
    print("Densidad: ", nx.density(G))
    # IterativeGraphReducer | MCGSReducer | TransitiveGraphReducer
    reducer =  TransitiveGraphReducer()
    # reduce connected components separately and then join again
    subgraphs = []
    connected_components = nx.weakly_connected_components(G)
    for connected_component in connected_components:
        subgraph = G.subgraph(connected_component).copy()
        subgraphs.append(reducer.reduce(subgraph))
    Gs = nx.compose_all(subgraphs)
    print("Cantidad final de nodos: ", len(Gs.nodes()))
    print("Cantidad final de aristas: ", len(Gs.edges()))
    print("Coeficiente de clustering: ", nx.average_clustering(Gs))
    print("Diametro: ", directed_diameter(Gs))
    print("Grado promedio: ", sum(d[1] for d in nx.degree(Gs))/nx.number_of_nodes(Gs))
    print("Densidad: ", nx.density(Gs))
    #nx.write_edgelist(Gs, '/Users/danileloutre/Downloads/reduced_lasalle.csv', delimiter=';', data=True, encoding='utf-8')

if __name__=="__main__":
    main()
