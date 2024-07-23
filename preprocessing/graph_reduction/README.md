### Command
```cd ..```

```python3 -m graph_reduction.reduce [-h] -i INPUT -o OUTPUT -m METHOD [-s] [-l LIMIT] [-r RATE]```

```
options:
  -h, --help            show this help message and exit
  -i INPUT, --input INPUT
                        filepath containing the edgelist to reduce
  -o OUTPUT, --output OUTPUT
                        filepath where to save the reduced graph
  -s, --showProperties       prints graph properties before and after reducing the graph
  -m METHOD, --method METHOD
                        desired reducer method. Options are: mgcs, transitive, degree.
  -l LIMIT, --limit LIMIT
                        sets a minimum number of nodes for the reduced graph. Use only for degree or transitive methods
  -r RATE, --rate RATE
                        sampling rate, namely, the proportion of the nodes preserved in the sample. Use only for MCGS method
```

### Example

```python3 -m reduce -i dataset_lasalle.csv -o transitive_dataset_lasalle.csv -m transitive -s```

## Files

### Input file

The input file contains the graph edgelist. This file must include the following columns:

- `source`: Source node identifier
- `target`: Target node identifier
- `weight`: Edge weight

**Important**: The file must not have any header. The file separator must be ";".