import networkx as nx

class NetworkXAdapter(object):
    def __init__(self):
        pass

    def directed_graph_from_pandas(self, df):
        graph = nx.from_pandas_edgelist(df, source='v1', target='v2', create_using=nx.DiGraph())
        return graph
    
    def in_degree(G, node):
      return G.in_degree(node) 
    
    def out_degree(G, node):
      return G.out_degree(node)
    
    def get_node_list(G):
      return list(G.nodes())
    
    def get_in_edges(G, node):
      return list(G.in_edges(node))
    
    def get_out_edges(G, node):
      return list(G.out_edges(node))

    def transitive_reduction(self, G):
      return nx.transitive_reduction(G)

class GraphReducer():
  def __init__(self):
    self.adapter = NetworkXAdapter()

  def find_node_to_contract(self, G):
    for node in list(G.nodes()):
      if G.in_degree(node) == 1 and G.out_degree(node) == 1:
        return node
    return None

  def contract_edge_from_node(self, G, node):
    # ver si es necesario sumar los pesos
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
    G = self.adapter.transitive_reduction(G)
    return G

class IterativeGraphReducer(GraphReducer):
  def out_reduce(self, G):
    limit = len(G.nodes())/2
    sorted_out_degrees = sorted(G.out_degree, key=lambda x: x[1], reverse=True)
    edges_to_add = set()
    nodes_to_remove = set()
    reduced = set()
    while len(G.nodes()) >= limit and sorted_out_degrees[0][1] > 2:
      sd = sorted_out_degrees[0]
      succesors = list(G.out_edges([sd[0]]))
      supernode = sd[0]
      for s in succesors:
        if s[1] in reduced:
          continue
        in_edges = [(e[0], supernode) for e in G.in_edges(s[1])]
        in_edges.pop(0)
        out_edges = [(supernode, e[1]) for e in G.out_edges(s[1])]
        edges_to_add.update(in_edges)
        edges_to_add.update(out_edges)
        #if s[1] != supernode:
        nodes_to_remove.add(s[1])
        reduced.add(s[1])
      sorted_out_degrees = sorted(G.out_degree, key=lambda x: x[1], reverse=True)
      G.add_edges_from(edges_to_add)
      G.remove_nodes_from(nodes_to_remove)
    return G

  def in_reduce(self, G):
    limit = len(G.nodes())/2
    sorted_in_degrees = sorted(G.in_degree, key=lambda x: x[1], reverse=True)
    edges_to_add = set()
    nodes_to_remove = set()
    reduced = set()

    while len(G.nodes()) >= limit and sorted_in_degrees[0][1] > 2:
      sd = sorted_in_degrees[0] 
      predecessors = list(G.in_edges([sd[0]]))
      supernode = sd[0]
      for p in predecessors:
        if p[0] in reduced:
          continue
        in_edges = [(e[0], supernode) for e in G.in_edges(p[0])]
        out_edges = [(supernode, e[1]) for e in G.out_edges(p[0])]
        out_edges.pop(0)
        edges_to_add.update(in_edges)
        edges_to_add.update(out_edges)
        #if p[0] != supernode:
        nodes_to_remove.add(p[0])
        reduced.add(p[0])
      sorted_in_degrees = sorted(G.in_degree, key=lambda x: x[1], reverse=True)
      G.add_edges_from(edges_to_add)
      G.remove_nodes_from(nodes_to_remove)
    return G

  def reduce(self, G):
    # G = super().reduce(G)
    G = self.out_reduce(G)
    G = self.in_reduce(G)
    return G


class RecursiveGraphReducer(GraphReducer):
  def out_reduce(self, G):
    sorted_out_degrees = sorted(G.out_degree, key=lambda x: x[1], reverse=True)
    if len(G.nodes()) < 180 or sorted_out_degrees[0][1] <= 2:
        return G

    sd = sorted_out_degrees[0]
    successors = list(G.out_edges(sd[0]))
    supernode = successors[0][1]
    edges_to_add = set()
    nodes_to_remove = set()
    reduced = set()

    for s in successors:
      if s[1] in reduced:
        continue
      in_edges = [(e[0], supernode) for e in G.in_edges(s[1])]
      out_edges = [(supernode, e[1]) for e in G.out_edges(s[1])]
      edges_to_add.update(in_edges)
      edges_to_add.update(out_edges)
      if s[1] != supernode:
        nodes_to_remove.add(s[1])
      reduced.add(s[1])

    G.add_edges_from(edges_to_add)
    G.remove_nodes_from(nodes_to_remove)
    return self.out_reduce(G)

  def in_reduce(self, G):
      sorted_in_degrees = sorted(G.in_degree, key=lambda x: x[1], reverse=True)
      if len(G.nodes()) < 180 or sorted_in_degrees[0][1] <= 2:
          return G

      sd = sorted_in_degrees[0]
      predecessors = list(G.in_edges(sd[0]))
      supernode = predecessors[0][1]
      edges_to_add = set()
      nodes_to_remove = set()
      reduced = set()

      for p in predecessors:
        if p[0] in reduced:
          continue
        in_edges = [(e[0], supernode) for e in G.in_edges(p[0])]
        out_edges = [(supernode, e[1]) for e in G.out_edges(p[0])]
        edges_to_add.update(in_edges)
        edges_to_add.update(out_edges)
        if p[0] != supernode:
            nodes_to_remove.add(p[0])
        reduced.add(p[0])

      G.add_edges_from(edges_to_add)
      G.remove_nodes_from(nodes_to_remove)
      return self.in_reduce(G)

  def reduce(self, G):
      # G = super().reduce(G)
      G = self.out_reduce(G)
      G = self.in_reduce(G)
      return G