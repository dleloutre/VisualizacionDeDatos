import networkx as nx
from mcgs import MCGS

class GraphReducer():
  def find_node_to_contract(self, G):
    for node in list(G.nodes()):
      if G.in_degree(node) == 1 and G.out_degree(node) == 1:
        return node
    return None

  def contract_edge_from_node(self, G, node):
    in_edge = list(G.in_edges(node))
    out_edge = list(G.out_edges(node))
    G.add_edge(in_edge[0][0], out_edge[0][1])
    G.remove_node(node)
    return G

  def edge_contraction(self, G):
    node = self.find_node_to_contract(G)
    if node is None:
      return G
    G = self.contract_edge_from_node(G, node)
    return self.edge_contraction(G)

  def reduce(self, G):
    G = self.edge_contraction(G)
    G = nx.transitive_reduction(G)
    return G

class ByDegreeGraphReducer(GraphReducer):
  def reduce(self, G):
    G = G.copy()
    reduced_nodes = set()
    nodes = sorted(G, key=G.degree, reverse=True)
    for node in nodes:
      if node not in reduced_nodes:
        neighbors = list(G.predecessors(node)) + list(G.successors(node))
        for neighbor in neighbors:
          if neighbor not in reduced_nodes:
            # Apropiarse de las aristas de los vecinos
            neighbors_of_neighbor = list(G.predecessors(neighbor)) + list(G.successors(neighbor))
            for n in neighbors_of_neighbor:
              if n != node:
                # Agregar la arista en la dirección correcta
                if G.has_edge(neighbor, n):
                  G.add_edge(node, n)
                else:
                  G.add_edge(n, node)
            reduced_nodes.add(neighbor)
            G.remove_node(neighbor)
        reduced_nodes.add(node)
    return G

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
            if neighbor_neighbor != node and G.has_edge(node, neighbor) and G.has_edge(neighbor, neighbor_neighbor):
              G.remove_edge(node, neighbor)
              G.remove_edge(neighbor, neighbor_neighbor)
              if G.degree(neighbor) == 0:
                G.remove_node(neighbor)
    return G
  
class MCGSReducer():
  def __init__(self):
    self.mcgs = MCGS()
  
  def reduce(self, G):
    return self.mcgs.run_sampling(G, rate=0.5)

