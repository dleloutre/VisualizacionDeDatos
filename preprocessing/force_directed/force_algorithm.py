import pandas as pd
import networkx as nx

class ForceAlgorithm:
    def apply_force_algorithm_2D(self, G):
        pos = nx.spring_layout(G, seed=42)
        pos_df = pd.DataFrame(pos).T
        pos_df.columns = ['x', 'y']
        pos_df.reset_index(inplace=True)
        pos_df.rename(columns={'index': 'node_id'}, inplace=True)
        return pos_df

    def apply_force_algorithm_3D(self, G):
        pos = nx.spring_layout(G, dim=3, seed=42, k=0.4)
        pos_df = pd.DataFrame(pos).T
        pos_df.columns = ['x', 'y', 'z'] 
        pos_df.reset_index(inplace=True)
        pos_df.rename(columns={'index': 'node_id'}, inplace=True)
        return pos_df
