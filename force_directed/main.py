import sys
import pandas as pd
import networkx as nx
from force_algorithm import ForceAlgorithm
from scalate import Scalator

def main():
    inputFile = sys.argv[1]
    outputFile = sys.argv[2]
    df = pd.read_csv(inputFile, sep=";", header=0, names=['source', 'target', 'weight'])
    G = nx.from_pandas_edgelist(df, source='source', target='target', edge_attr=['weight'], create_using=nx.DiGraph())
    force_alg = ForceAlgorithm()
    df_nodes_position = force_alg.apply_force_algorithm_3D(G)
    scalator = Scalator()
    df_nodes_position_scalated = scalator.scalate_3D(df_nodes_position) 
    df_nodes_position_scalated.to_csv(outputFile, index=False, sep=";", header=False)


if __name__=='__main__':
    main()