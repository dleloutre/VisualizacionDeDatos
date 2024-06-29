## Data Preprocessing

## Graph Visualization

### Technologies

* Three.js

### How it Works
The visualization generates a graph with visible subgraphs differentiated by color. The goal is to recognize connections between groups of different categories or preferences and understand which ones are more influential. Edges that cross different subgraphs will have a gradient color, making it easy to identify the origins of the connections.
The visualization includes several adjustable parameters to suit different needs:

* Antialias: Improves the definition of the visualization when the view is static.
* Drone View: Changes the camera mode to a "drone" type. To control this camera, use the keys "A, W, S, D" to change the viewing angle and "U, H, J, K" to move around. You can also adjust the movement speed by pressing keys 1, 2, 3, or 4. By default, the assigned camera is an orbital camera, which is manipulated using the mouse and allows you to rotate, zoom in, and out relative to a fixed point, the origin of coordinates.
* Spiral Steps: Allows you to increase or decrease the step between subgraphs distributed in a spiral shape.
* Spiral Rounds: Allows you to increase or decrease the number of turns in the spiral where the subgraphs are distributed.
* Separation: Allows you to increase or decrease the distance between subgraphs.

### Required Files
You must provide a file of nodes and a file of edges for each subgraph to be visualized.
These files should be located within the /public/nodes and /public/edges folders, respectively.
The files must be named "dataset_${key}.csv", where ${key} is a unique identifier for the subgraph.

The node file should have the following columns:

node_id;x_coordinate;y_coordinate;z_coordinate

Where (x_coordinate, y_coordinate, z_coordinate) are the spatial coordinates where the node should be located, relative to the origin.

The edge file should have the following columns:

origin_node_id;target_node_id;weight

In addition to the edge files for each subgraph, there must be a file named "dataset_crossing.csv" that contains the edges crossing all subgraphs.

The aforementioned files can be obtained by running the [preprocessing step](#user-content-data-preprocessing).

Within the /data folder, there should be a file named data.json. This file should be a JSON where the keys match the ${key} of the datasets. 

Each key can contain the following information:

 * label: Name or label you want to assign to the subgraph.
 * color: Color you want to assign to the subgraph.

Both fields are optional; if not provided, labels will take the value of ${key}, and colors will be generated automatically.

### To Run Locally

Install dependencies

```npm install```

Run the code

```npm run dev```