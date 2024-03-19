import pandas as pd
import networkx as nx

class ForceAlgorithm:
    def apply_force_algorithm_2D(self, G):
        #df = pd.read_csv('mcgs_reduced_hidalgo.csv', usecols=['node_1', 'node_2'])
        # df = pd.read_csv('mcgs_reduced_hidalgo.csv', sep=";", header=0, names=['node_1', 'node_2', 'ignore'])
        # G = nx.from_pandas_edgelist(df, source='node_1', target='node_2')

        pos = nx.spring_layout(G, seed=42) 
        pos_df = pd.DataFrame(pos).T
        pos_df.columns = ['x', 'y']
        pos_df.reset_index(inplace=True)
        pos_df.rename(columns={'index': 'node_id'}, inplace=True)

        return pos_df
        # pos_df.to_csv('node_positions.csv', index=False)


    def apply_force_algorithm_3D(self, G):
        #df = pd.read_csv('mcgs_reduced_hidalgo.csv', usecols=['node_1', 'node_2'])
        # df = pd.read_csv('mcgs_reduced_hidalgo.csv', sep=";", header=0, names=['node_1', 'node_2', 'ignore'])
        # G = nx.from_pandas_edgelist(df, source='node_1', target='node_2')

        pos = nx.spring_layout(G, dim=3, seed=42)
        pos_df = pd.DataFrame(pos).T
        pos_df.columns = ['x', 'y', 'z'] 
        pos_df.reset_index(inplace=True)
        pos_df.rename(columns={'index': 'node_id'}, inplace=True)

        return pos_df
        # pos_df.to_csv('mcgs_reduced_hidalgo_node_positions.csv', index=False)

