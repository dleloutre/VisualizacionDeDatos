from graph_reduction.graph_reducer import GraphReducer

class TransitiveGraphReducer(GraphReducer):
  def reduce(self, G):
    G = self.remove_leaf_nodes(G)
    return self.transitivity(G)
  
  def remove_leaf_nodes(self, G):
    nodes = G.nodes()
    nodes_to_remove = set()
    for node in nodes:
      if G.degree(node) == 1:
        nodes_to_remove.add(node)
    G.remove_nodes_from(nodes_to_remove)
    return G
  
  def transitivity(self, G):
    for node in list(G.nodes()):
      if node in G.nodes():
        for neighbor in list(G.neighbors(node)):
          for neighbor_neighbor in list(G.neighbors(neighbor)):
            if neighbor_neighbor != node and G.has_edge(node, neighbor) and G.has_edge(neighbor, neighbor_neighbor) and G.has_edge(node, neighbor_neighbor):
              G.remove_edge(node, neighbor)
              G.remove_edge(neighbor, neighbor_neighbor)
              if G.degree(neighbor) == 0:
                G.remove_node(neighbor)
              if G.number_of_nodes() <= self.limit:
                return G
    return G