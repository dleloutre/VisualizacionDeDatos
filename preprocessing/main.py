import sys
import pandas as pd
from graph_reducer import *

def main():
    reduceFile = sys.argv[1]
    nex = NetworkXAdapter()
    sample_montebourg = pd.read_csv(reduceFile, sep=';', header=None, names=["v1", "v2", "_ignore"])
    G_montebourg = nex.directed_graph_from_pandas(sample_montebourg)
    iterative_reducer = IterativeGraphReducer() # recursive_reducer = RecursiveGraphReducer()
    Gs_montebourg = iterative_reducer.reduce(G_montebourg)
    print("Cantidad de nodos: ", len(Gs_montebourg.nodes()))
    print("Cantidad de aristas: ", len(Gs_montebourg.edges()))

if __name__=="__main__":
    main()