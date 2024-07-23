import time
import argparse
import pandas as pd
from graph_reduction.degree_reducer import ByDegreeGraphReducer
from graph_reduction.mcgs_reducer import MCGSReducer
from graph_reduction.transitive_reducer import TransitiveGraphReducer
import networkx as nx 

def set_arguments():
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--input", required=True,
    help="filepath containing the edgelist to reduce.")
    ap.add_argument("-o", "--output", required=True,
    help="filepath where to save the reduced graph.")
    ap.add_argument("-m", "--method", required=True,
    help="desired reducer method. Options are: mgcs, transitive, degree.")
    ap.add_argument("-s", "--showProperties", action='store_true', required=False,
    help="prints graph properties before and after reducing the graph.")
    ap.add_argument("-l", "--limit", required=False,
    help="sets a minimum number of nodes for the reduced graph. Use only for degree or transitive methods.")
    ap.add_argument("-r", "--rate", required=False,
    help="sampling rate, namely, the proportion of the nodes preserved in the sample. Use only for MCGS method")
    return ap

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

def get_reducer(reducerType, limit, rate):
    if reducerType == 'transitive':
        reducer = TransitiveGraphReducer()
    elif reducerType == 'mcgs':
        reducer = MCGSReducer()
    elif reducerType == 'degree':
        reducer = ByDegreeGraphReducer()
    else:
        return None
    if limit:
        reducer.set_limit(int(limit))
    if rate:
        reducer.set_rate(float(rate))
    return reducer

def get_graph(fileName):
    df = pd.read_csv(fileName, sep=';', header=0, names=["v1", "v2", "weight"])
    return nx.from_pandas_edgelist(df, source='v1', target='v2', edge_attr=['weight'], create_using=nx.DiGraph())

def main():
    ap = set_arguments()
    args = vars(ap.parse_args())
    G = get_graph(args['input'])
    reducer = get_reducer(args['method'], args['limit'], args['rate'])
    if args['showProperties']:
        print("Graph properties before reducing:")
        show_properties(G)
    # reduce connected components separately and then join again
    subgraphs = []
    connected_components = nx.weakly_connected_components(G)
    for connected_component in connected_components:
        subgraph = G.subgraph(connected_component).copy()
        subgraphs.append(reducer.reduce(subgraph))
    Gs = nx.compose_all(subgraphs)
    if args['showProperties']:
        print("Graph properties after reducing:")
        show_properties(Gs)
    nx.write_weighted_edgelist(Gs, args['output'], delimiter=';', encoding='utf-8')

start_time = time.time()
main()
print("--- %s seconds ---" % (time.time() - start_time))
