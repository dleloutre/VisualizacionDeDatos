import math
import numpy as np
import pandas as pd
import pytest
from force_directed.force_algorithm import ForceAlgorithm
import networkx as nx
from force_directed.sphere_constraint import SphereConstraint

def test_apply_force_algorithm_2D_format():
    processor = ForceAlgorithm()
    G = nx.path_graph(4)
    pos_df = processor.apply_force_algorithm_2D(G)
    assert list(pos_df.columns) == ['node_id', 'x', 'y']
    assert len(pos_df) == len(G.nodes)

def test_apply_force_algorithm_3D_format():
    processor = ForceAlgorithm()
    G = nx.path_graph(4)
    pos_df = processor.apply_force_algorithm_3D(G)
    assert list(pos_df.columns) == ['node_id', 'x', 'y', 'z']
    assert len(pos_df) == len(G.nodes)

def test_constrain_to_sphere():
    constraint = SphereConstraint(sphere_radius=1, radius_scalator=1)
    pos_df = pd.DataFrame({
        'node_id': [0, 1, 2, 3],
        'x': [1.5, 0.5, 0.0, 0.0],
        'y': [0.0, 1.5, 0.5, 0.0],
        'z': [0.0, 0.0, 1.5, 0.5]
    })

    constrained_df = constraint.constrain_to_sphere(pos_df)
    
    assert list(constrained_df.columns) == ['node_id', 'x', 'y', 'z']
    for i, row in constrained_df.iterrows():
        distance_to_center = np.sqrt(row['x']**2 + row['y']**2 + row['z']**2)
        assert distance_to_center <= constraint.sphere_radius

def test_constrain_to_sphere_with_large_radius():
    constraint = SphereConstraint(sphere_radius=5, radius_scalator=1)
    pos_df = pd.DataFrame({
        'node_id': [0, 1, 2, 3],
        'x': [3.0, 4.0, 5.0, 6.0],
        'y': [3.0, 4.0, 5.0, 6.0],
        'z': [3.0, 4.0, 5.0, 6.0]
    })

    constrained_df = constraint.constrain_to_sphere(pos_df)
    print(f"constrained: {constrained_df}")
    
    assert list(constrained_df.columns) == ['node_id', 'x', 'y', 'z']
    for i, row in constrained_df.iterrows():
        distance_to_center = np.sqrt(row['x']**2 + row['y']**2 + row['z']**2)
        assert math.floor(distance_to_center) <= constraint.sphere_radius

def test_constrain_to_sphere_min_radius():
    constraint = SphereConstraint(sphere_radius=0.1, radius_scalator=1)
    pos_df = pd.DataFrame({
        'node_id': [0, 1, 2, 3],
        'x': [0.01, 0.01, 0.01, 0.01],
        'y': [0.01, 0.01, 0.01, 0.01],
        'z': [0.01, 0.01, 0.01, 0.01]
    })

    constrained_df = constraint.constrain_to_sphere(pos_df)
    
    assert list(constrained_df.columns) == ['node_id', 'x', 'y', 'z']
    for i, row in constrained_df.iterrows():
        distance_to_center = np.sqrt(row['x']**2 + row['y']**2 + row['z']**2)
        assert distance_to_center <= constraint.sphere_radius

def test_constrain_to_sphere_scale_factor():
    constraint = SphereConstraint(sphere_radius=1, radius_scalator=2)
    pos_df = pd.DataFrame({
        'node_id': [0, 1, 2, 3],
        'x': [1.5, 0.5, 0.0, 0.0],
        'y': [0.0, 1.5, 0.5, 0.0],
        'z': [0.0, 0.0, 1.5, 0.5]
    })

    constrained_df = constraint.constrain_to_sphere(pos_df)
    
    assert list(constrained_df.columns) == ['node_id', 'x', 'y', 'z']
    for i, row in constrained_df.iterrows():
        distance_to_center = np.sqrt(row['x']**2 + row['y']**2 + row['z']**2)
        assert distance_to_center <= constraint.sphere_radius

def test_constrain_to_sphere_no_adjustment_needed():
    constraint = SphereConstraint(sphere_radius=10, radius_scalator=1)
    pos_df = pd.DataFrame({
        'node_id': [0, 1, 2, 3],
        'x': [1.0, 2.0, 3.0, 4.0],
        'y': [1.0, 2.0, 3.0, 4.0],
        'z': [1.0, 2.0, 3.0, 4.0]
    })

    constrained_df = constraint.constrain_to_sphere(pos_df)
    
    assert list(constrained_df.columns) == ['node_id', 'x', 'y', 'z']
    for i, row in constrained_df.iterrows():
        distance_to_center = np.sqrt(row['x']**2 + row['y']**2 + row['z']**2)
        assert math.floor(distance_to_center) <= constraint.sphere_radius
        assert row['x'] == pos_df.at[i, 'x']
        assert row['y'] == pos_df.at[i, 'y']
        assert row['z'] == pos_df.at[i, 'z']

if __name__ == "__main__":
    pytest.main()