import pandas as pd
import networkx as nx
from force_algorithm import ForceAlgorithm
from scalate import Scalator


def main():
    df = pd.read_csv('mcgs_reduced_hidalgo.csv', sep=";", header=0, names=['node_1', 'node_2', 'ignore'])
    G = nx.from_pandas_edgelist(df, source='node_1', target='node_2')
    force_alg = ForceAlgorithm()
    df_nodes_position = force_alg.apply_force_algorithm_3D(G)
    scalator = Scalator()
    df_nodes_position_scalated = scalator.scalate_3D(df_nodes_position) 
    df_nodes_position_scalated.to_csv('mcgs_reduced_hidalgo_FR.csv', index=False)


if __name__=='__main__':
    main()