import sys
import pandas as pd
from graph_reducer import *

def main():
    reduceFile = sys.argv[1]
    nex = NetworkXAdapter()
    df = pd.read_csv(reduceFile, sep=';', header=None, names=["v1", "v2", "_ignore"])
    G = nex.directed_graph_from_pandas(df)
    iterative_reducer = IterativeGraphReducer() # recursive_reducer = RecursiveGraphReducer()
    Gs = iterative_reducer.reduce(G)
    print("Cantidad de nodos: ", len(Gs.nodes()))
    print("Cantidad de aristas: ", len(Gs.edges()))
    nx.write_edgelist(Gs, './reduced_philippot.csv', delimiter=';', data=True, encoding='utf-8')

if __name__=="__main__":
    main()

# Agregar tests unitarios
# Comparar tiempos de ejecución
# (opcional) Intentar implementarlo con Networkit

# Observaciones
# casi 20M de aristas cruzadas (pensar cómo manejarlo)
# la mayoria de supported candidate esta en None