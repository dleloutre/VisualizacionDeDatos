### Command

```python3 main.py [-h] -i INPUT -o OUTPUT [-r RADIUS]```

```
options:
  -h, --help            show this help message and exit
  -i INPUT, --input INPUT
                        filepath containing the edgelist to reduce
  -o OUTPUT, --output OUTPUT
                        filepath where to save the reduced graph
  -r RADIUS, --radius RADIUS
                        radius parameter to scale the sphere raiuds
```

### Example

```python3 main.py mcgs_hidalgo.csv dataset_hidalgo.csv```

## Files

### Input file

The input file contains the graph edgelist. This file must include the following columns:

- `source`: Source node identifier
- `target`: Target node identifier
- `weight`: Edge weight

**Important**: The file must not have any header. The file separator must be ";".

### Output file

It returns a CSV file containing the following information:

- `node_id`: Node identifier
- `x`: X coordinate position in a 3D space
- `y`: Y coordinate position in a 3D space
- `z`: Z coordinate position in a 3D space