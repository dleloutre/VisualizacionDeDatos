import argparse
import pandas as pd
import networkx as nx
from force_algorithm import ForceAlgorithm
from sphere_constraint import *

def set_arguments():
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--input", required=True,
    help="filepath containing the edgelist to process.")
    ap.add_argument("-o", "--output", required=True,
    help="filepath where to save the result.")
    ap.add_argument("-r", "--radius", required=False,
    help="sphere radius.")

    return ap

def main():
    ap = set_arguments()
    args = vars(ap.parse_args())
    inputFile = args['input']
    outputFile = args['output']
    df = pd.read_csv(inputFile, sep=";", header=0, names=['source', 'target', 'weight'])
    G = nx.from_pandas_edgelist(df, source='source', target='target', edge_attr=['weight'], create_using=nx.DiGraph())
    force_alg = ForceAlgorithm()
    df_nodes_position = force_alg.apply_force_algorithm_3D(G)
    sphere_radius = len(df_nodes_position)/G.number_of_nodes()
    sphere_constraint = SphereConstraint(sphere_radius, args['radius'])
    df_nodes_position_constrained = sphere_constraint.constrain_to_sphere(df_nodes_position)
    df_nodes_position_constrained.to_csv(outputFile, index=False, sep=";", header=False)

if __name__=='__main__':
    main()