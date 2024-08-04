import networkx as nx

class GraphReducer():
  def __init__(self):
    self.rate = 10

  def set_rate(self, new_rate):
    self.rate = new_rate

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
