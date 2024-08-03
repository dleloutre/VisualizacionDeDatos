import os
import numpy as np
import networkx as nx
import json
import pandas as pd
from graph_reduction.degree_reducer import ByDegreeGraphReducer
from graph_reduction.mcgs_reducer import MCGSReducer
from graph_reduction.transitive_reducer import TransitiveGraphReducer
import argparse
import dask.dataframe as dd
from constants import NUMBER_COLUMNS, ROUTE_UPLOADED_FILES
import random

def validate_file(fileName, isEdgesFile = False):
    fileName = ROUTE_UPLOADED_FILES + fileName
    if not os.path.isfile(fileName):
        print("File not found")
        exit()
    df = get_df_from_file(fileName)
    if df is None:
        print("File extension not supported only csv and parquet files are supported")
        exit()
    validated = check_amount_columns(df, isEdgesFile) and check_names_columns(df, isEdgesFile) and check_types_columns(df, isEdgesFile)
    if not validated:
        print("Invalid file format")
        exit()
    return df

def check_names_columns(df, isEdgesFile):
    if isEdgesFile and 'source' in df.columns and 'target' in df.columns and 'weight' in df.columns:
        return True
    elif not isEdgesFile and 'node_id' in df.columns:
        return True
    return False

def check_amount_columns(df, isEdgesFile):
    if isEdgesFile and (len(df.columns) == NUMBER_COLUMNS):
        return True
    elif not isEdgesFile and len(df.columns) == 2:
        return True
    return False

def check_types_columns(df, isEdgesFile):
    result = True
    if isEdgesFile:
        for i in range(len(df.columns)):
            column = str(df.columns[i])
            result = result and (all(type(item) is int for item in df[column].drop_duplicates().compute().to_list()))
        return result
    else:
        column = str(df.columns[0])
        result = result and (all(type(item) is int for item in df[column].drop_duplicates().compute().to_list()))
        column = str(df.columns[1])
        result = result and (all(type(item) is str for item in df[column].drop_duplicates().compute().to_list()))
        return result

def get_df_from_file(fileName):
    if fileName.endswith('.csv'):
        df = dd.read_csv(fileName, sep=',')
    elif fileName.endswith('.parquet'):
        df = dd.read_parquet(fileName)
    else:
        return None
    return df

def set_arguments():
    ap = argparse.ArgumentParser()
    ap.add_argument("-e", "--edges", required=True,
    help="filename containing all the edges")
    ap.add_argument("-c", "--categories", required=True,
    help="filename containing all the nodes and their categories")
    ap.add_argument("-e2", "--edges2", required=False,
    help="filename containing all the edges for a bipartite visualization")
    ap.add_argument("-c2", "--categories2", required=False,
    help="filename containing all the nodes and their categories for a bipartite visualization")
    ap.add_argument("-a", "--animation", required=False,
    help="filename containing animation flow")
    ap.add_argument("-r", "--reduction", required=False, choices=['mcgs', 'degree', 'transitive'],
    help="type of reduction algorithm")
    ap.add_argument("-rad", "--radius", required=False,
    help="radius of the sphere constraint")
    ap.add_argument("-l", "--limit", required=False,
    help="filter number of edges crossing inside each category")
    ap.add_argument("-rr", "--rate", required=False,
    help="sampling rate, namely, the proportion of the nodes preserved in the sample")
    return ap

def generate_color():
    r = random.randint(128, 255)
    g = random.randint(128, 255)
    b = random.randint(128, 255)
    hex_color = "#{:02x}{:02x}{:02x}".format(r, g, b)
    return hex_color

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

def get_reducer(reducerType):
    if reducerType == 'transitive':
        return TransitiveGraphReducer()
    if reducerType == 'degree':
        return ByDegreeGraphReducer()
    if reducerType == 'mcgs':
        return MCGSReducer()
    return None

def get_graph_from_file(fileName):
    df = pd.read_csv(fileName, sep=';', header=0, names=['source', 'target', 'weight'])
    print(df.head())
    return nx.from_pandas_edgelist(df, source='source', target='target', edge_attr=['weight'], create_using=nx.DiGraph())

def get_graph_from_df(df, src='v1', tgt='v2', weight='v3'):
    df = df.rename(columns={weight: 'weight'})
    return nx.from_pandas_edgelist(df, source=src, target=tgt, edge_attr=['weight'], create_using=nx.DiGraph())

def write_graph_to_binary_file(G, fileName):
    df = nx.to_pandas_edgelist(G)
    data_format = [('source', 'int32'), ('target', 'int32'), ('weight', 'int16')]
    data = np.array(df.to_records(index=False), dtype=data_format)
    data.tofile(fileName)

def write_graph_to_csv_file(G, route):
    df = nx.to_pandas_edgelist(G)
    df.to_csv(route, sep = ';', index=False, header=False)

def write_dask_df_to_csv_file(df, route):
    df.to_csv(route, single_file=True, sep = ';', index=False, header=False)

def write_df_to_csv_file(df, route):
    df.to_csv(route, sep = ';', index=False, header=False)

def write_df_to_binary_file(df, route):
    data_format = [('node_id', 'int64'), ('x', 'float64'), ('y', 'float64'), ('z', 'float64')]
    print("df", df)
    data = np.array(df.to_records(index=False), dtype=data_format)
    print("data", data)
    data.tofile(route)

def write_dfs_to_csv(dfs, dfs_name, route):
    for i in range(len(dfs)):
        print("Candidate: " + dfs_name[i] + " started")
        dfs[i].to_csv(route + dfs_name[i] +'.csv', single_file=True, sep = ';', index=False, header=False)
        print("Candidate: " + dfs_name[i] + " done")

def write_dfs_to_binary(dfs, dfs_name, df_type):
    for i in range(len(dfs)):
        print("Candidate: " + dfs_name[i] + " started")
        fileName = './datasets/binary/dataset_' + dfs_name[i] + '.bin'
        array = np.array(dfs[i].compute(), dtype=df_type)
        array.tofile(fileName)
        print("Candidate: " + dfs_name[i] + " done")

def write_json(data, fileName):
    with open(fileName, 'w') as jsonfile:
        json.dump(data, jsonfile)