## Data Preprocessing

## Graph Visualization

### Technologies

* Three.js

### Run Single Visualization

Install dependencies

```npm install```

Run the code

```npm run dev```

### Run Bipartite Visualization

Install dependencies

```npm install```

Run the code

```npm run dev:joint```

### How it Works
The visualization generates a graph with subgraphs differentiated by color. The goal is to recognize connections between groups of different categories and understand which ones are more influential. Edges that cross different subgraphs will have a gradient color, making it easy to identify the origins of the connections.
The visualization includes several parameters to suit different needs:

* Antialias: Improves the definition of the visualization when the view is static.
* Drone View: Changes the camera mode to a "drone" type. To control this camera, use the keys "A, W, S, D, Q, E" to change the viewing angle and "U, H, J, K, O, L" to move around. You can also adjust the movement speed by pressing keys 1, 2, 3, or 4. By default, the assigned camera is an orbital camera, which is manipulated using the mouse and allows you to rotate, zoom in and out relative to a fixed point.
* Spiral Steps: Allows you to increase or decrease the step between subgraphs distributed in a spiral shape.
* Spiral Rounds: Allows you to increase or decrease the number of turns in the spiral where the subgraphs are distributed.
* Separation: Allows you to increase or decrease the distance between subgraphs.

### Required Files for Single Visualization
You must provide a file of nodes and a file of edges for each subgraph to be visualized.
These files should be located within the /public/nodes and /public/edges folders, respectively.
The files must be named "dataset_${key}.csv", where ${key} is a unique identifier for the subgraph.

The node files must have the following columns:

node_id;x_coordinate;y_coordinate;z_coordinate

Where (x_coordinate, y_coordinate, z_coordinate) are the spatial coordinates where the node should be located, relative to the origin.

The edge files must have the following columns:

origin_node_id;target_node_id;weight

In addition to the edge files for each subgraph, there must be a file named "dataset_crossing.csv" that contains the edges crossing all subgraphs.

The aforementioned files can be obtained by running the [preprocessing step](#user-content-data-preprocessing).

Within the /data folder, there must be a file named data.json. This file must be a JSON where the keys match the ${key} of the datasets. 

Each key can contain the following information:

 * label: Name or label you want to assign to the subgraph.
 * color: Color you want to assign to the subgraph.

Both fields are optional; if not provided, labels will take the value of ${key}, and colors will be generated automatically.

### Required Files for Bipartite Visualization

You must provide a file of nodes for each subgraph to be visualized.
These files should be located within the /public/nodes_A, /public/nodes_B, where A and B represents each graph in the bipartite graph.
The files must be named "dataset_${key}.csv", where ${key} is a unique identifier for the subgraph.

The node files must have the following columns:

node_id;x_coordinate;y_coordinate;z_coordinate

Where (x_coordinate, y_coordinate, z_coordinate) are the spatial coordinates where the node should be located, relative to the origin.

Also, you must provide a file of crossing edges from graph A to graph B, and crossing edges from graph B to graph A. These files must be located within /public/edges_A and /public/edges_B, respectively. Both files must be named "dataset_crossing.csv".

The edge files must have the following columns:

origin_node_id;target_node_id;weight

The aforementioned files can be obtained by running the [preprocessing step](#user-content-data-preprocessing).

Within the /data folder, there must be two files named "data_A.json" and "data_B.json". These files must be a JSON where the keys match the ${key} of the datasets.

Each key can contain the following information:

 * label: Name or label you want to assign to the subgraph.
 * color: Color you want to assign to the subgraph.

Both fields are optional; if not provided, labels will take the value of ${key}, and colors will be generated automatically.