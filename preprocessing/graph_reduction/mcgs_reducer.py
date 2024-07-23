from graph_reduction.mcgs import MCGS
from graph_reduction.graph_reducer import GraphReducer

class MCGSReducer(GraphReducer):
  def __init__(self):
    super().__init__()
    self.mcgs = MCGS()
    self.rate = 0.5

  def set_rate(self, new_rate):
    self.rate = new_rate
  
  def reduce(self, G):
    return self.mcgs.run_sampling(G, self.rate)