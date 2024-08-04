from graph_reduction.graph_reducer import GraphReducer

class ByDegreeGraphReducer(GraphReducer):
    def reduce(self, G):
        G = G.copy()
        reduced_nodes = set()
        nodes = sorted(G, key=G.degree, reverse=True)
        initial_nodes = len(nodes)
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
                                    if not G.has_edge(node, n):
                                        G.add_edge(node, n)
                                else:
                                    if not G.has_edge(n, node):
                                        G.add_edge(n, node)
                        reduced_nodes.add(neighbor)
                        G.remove_node(neighbor)
                        if (G.number_of_nodes()/initial_nodes) <= self.rate:
                            return G
                reduced_nodes.add(node)
        return G