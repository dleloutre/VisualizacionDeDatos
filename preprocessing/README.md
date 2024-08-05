Data Visualization
==============

# Data Preprocessing

## Technologies

* Python3
* Pandas
* NetworkX

## Install dependencies

```pip install -r requirements.txt```

## Run

```main.py [-h] -e EDGES -c CATEGORIES [-e2 EDGES2] [-c2 CATEGORIES2] [-a ANIMATION] [-r {mcgs,degree,transitive}] [-rad RADIUS] [-l LIMIT] [-rr RATE] [-log LOG]```
```
options:
  -h, --help            show this help message and exit
  -e EDGES, --edges EDGES
                        filename containing all the edges
  -c CATEGORIES, --categories CATEGORIES
                        filename containing all the nodes and their categories
  -e2 EDGES2, --edges2 EDGES2
                        filename containing all the edges for a bipartite visualization
  -c2 CATEGORIES2, --categories2 CATEGORIES2
                        filename containing all the nodes and their categories for a bipartite visualization
  -a ANIMATION, --animation ANIMATION
                        filename containing animation flow
  -r {mcgs,degree,transitive}, --reduction {mcgs,degree,transitive}
                        type of reduction algorithm
  -rad RADIUS, --radius RADIUS
                        radius of the sphere constraint
  -l LIMIT, --limit LIMIT
                        filter number of edges crossing inside each category
  -rr RATE, --rate RATE
                        sampling rate, namely, the proportion of the nodes preserved in the sample
  -log LOG
                        enables logger on execution
```
### Example

```python3 main.py -e edges.csv -c nodes.csv```

### Example for a bipartite visualization

```python3 main.py -e edges_graph_A.csv -c nodes_graph_A.csv -e2 edges_graph_B.csv -c2 nodes_graph_B.csv```

## Files
### Edges file

The edges file contains the network edges, it must be located in the visualization/public/uploaded_files folder. This file must include the following columns:

- `source`: Source node identifier
- `target`: Target node identifier
- `weight`: Edge weight

**Important**: The file must have the previously mentioned column names as the header.

### Categories file

The categories file contains the node categories, it must be located in the visualization/public/uploaded_files folder. This file must include the following columns:

- `node_id`: Node identifier
- `category`: Node category

**Important**: The file must have the previously mentioned column names as the header. Additionally, the file must not have any null or empty values in the category column.

### Animation file (optional)

The animation file contains the edges and timestamps for any desired animation. It must be located in the visualization/public/uploaded_files folder. This file must include the following columns:

- `source`: Source node identifier
- `target`: Target node identifier
- `timestamp`: Timestamp of the event in the format "YYYY-MM-DD HH:mm:ss"

**Important**: The file must have the previously mentioned column names as the header. Additionally, the file must not have any null or empty values in the category column.
