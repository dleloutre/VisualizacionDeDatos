import sys
import pandas as pd
import networkx as nx
from force_algorithm import ForceAlgorithm
from sphere_constraint import SphereConstraint
#from scalate import Scalator

TOTAL_NODES = 1242243
RADIUS = 300

def main():
    inputFile = sys.argv[1]
    outputFile = sys.argv[2]
    df = pd.read_csv(inputFile, sep=";", header=0, names=['source', 'target', 'weight'])
    G = nx.from_pandas_edgelist(df, source='source', target='target', edge_attr=['weight'], create_using=nx.DiGraph())
    force_alg = ForceAlgorithm()
    df_nodes_position = force_alg.apply_force_algorithm_3D(G)
    ## check
    sphere_radius = len(df_nodes_position)/TOTAL_NODES*100*RADIUS
    ##
    sphere_constraint = SphereConstraint(sphere_radius=sphere_radius)
    df_nodes_position_constrained = sphere_constraint.constrain_to_sphere(df_nodes_position)
    df_nodes_position_constrained.to_csv(outputFile, index=False, sep=";", header=False)
    #scalator = Scalator()
    #df_nodes_position_scalated = scalator.scalate_3D(df_nodes_position) 
    #df_nodes_position_scalated.to_csv(outputFile, index=False, sep=";", header=False)


if __name__=='__main__':
    main()