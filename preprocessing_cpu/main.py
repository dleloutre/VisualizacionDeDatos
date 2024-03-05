import sys
import pandas as pd
from graph_reducer import *

def directed_bridges(G):
    undirected_edges = [(min(u, v), max(u, v)) for u, v in G.edges()]
    undirected_graph = nx.Graph(undirected_edges)
    bridges = []
    
    for u, v in G.edges():
        G.remove_edge(u, v)
        if not nx.is_connected(undirected_graph):
            bridges.append((u, v))
        G.add_edge(u, v)
    
    return bridges

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
    df = pd.read_csv(reduceFile, sep=';', header=None, names=["v1", "v2", "_ignore"])
    G = nx.from_pandas_edgelist(df, source='v1', target='v2', create_using=nx.DiGraph())
    print("Cantidad inicial de nodos: ", len(G.nodes()))
    print("Cantidad inicial de aristas: ", len(G.edges()))
    print("Coeficiente de clustering: ", nx.average_clustering(G))
    print("Diametro: ", directed_diameter(G))
    print("Grado promedio: ", sum(d[1] for d in nx.degree(G))/nx.number_of_nodes(G))
     #print("Cantidad de puentes: ", len(list(directed_bridges(G))))
    print("Densidad: ", nx.density(G))
    reducer =  IterativeGraphReducer()
    Gs = reducer.reduce(G)
    print("Cantidad final de nodos: ", len(Gs.nodes()))
    print("Cantidad final de aristas: ", len(Gs.edges()))
    print("Coeficiente de clustering: ", nx.average_clustering(Gs))
    print("Diametro: ", directed_diameter(Gs))
    print("Grado promedio: ", sum(d[1] for d in nx.degree(Gs))/nx.number_of_nodes(Gs))
    #print("Cantidad de puentes: ", len(list(directed_bridges(Gs))))
    print("Densidad: ", nx.density(Gs))
    nx.write_edgelist(Gs, '/Users/danileloutre/Downloads/reduced_lasalle.csv', delimiter=';', data=True, encoding='utf-8')

if __name__=="__main__":
    main()

# Agregar tests unitarios
# Comparar tiempos de ejecución
# (opcional) Intentar implementarlo con Networkit

# Observaciones
# casi 20M de aristas cruzadas (pensar cómo manejarlo)
# la mayoria de supported candidate esta en None