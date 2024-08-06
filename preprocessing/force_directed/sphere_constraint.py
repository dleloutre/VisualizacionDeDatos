import math
import numpy as np

DEFAULT_RADIUS = 1
MIN_RADIUS = 90

class SphereConstraint:
    def __init__(self, sphere_radius, total_nodes, graph_sizes, radius_scalator):
      if radius_scalator is None:
        radius_scalator = DEFAULT_RADIUS
      mean_size = sum(graph_sizes) / len(graph_sizes)
      base_radius = mean_size
      log_scaled_radius = base_radius * math.log(1 + sphere_radius) * radius_scalator
      if log_scaled_radius < MIN_RADIUS:
        min_radius = (math.sqrt(sphere_radius * total_nodes) * math.log(1 + (sphere_radius * total_nodes)))/2
        log_scaled_radius = max(MIN_RADIUS, min_radius)
      self.sphere_radius = log_scaled_radius

    def calculate_min_radius(self, sphere_radius, mean_size, graph_sizes):
      dynamic_min_radius = mean_size * (math.log(1 + sphere_radius) + 1)
      return max(MIN_RADIUS, dynamic_min_radius)

    def constrain_to_sphere(self, pos_df):
        pos_array = pos_df[['x', 'y', 'z']].values
        max_distance = 0
        for i in range(len(pos_array)):
            x, y, z = pos_array[i]
            distance_to_center = np.sqrt(x**2 + y**2 + z**2)

            if distance_to_center > max_distance:
              max_distance = distance_to_center
            # Si la distancia es mayor al radio de la esfera, se escala para que esté justo en el borde
            if distance_to_center > self.sphere_radius:
                scale_factor = self.sphere_radius / distance_to_center
                new_x = x * scale_factor
                new_y = y * scale_factor
                new_z = z * scale_factor
                pos_array[i] = [new_x, new_y, new_z]
        # Si la distancia máxima es menor al 80% del radio de la esfera, se escala a un 40% del radio
        if max_distance < 0.8 * self.sphere_radius:
          for i in range(len(pos_array)):
              x, y, z = pos_array[i]
              scale_factor = 0.4 * self.sphere_radius
              new_x = x * scale_factor
              new_y = y * scale_factor
              new_z = z * scale_factor
              new_distance_to_center = np.sqrt(new_x**2 + new_y**2 + new_z**2)
              if new_distance_to_center <= self.sphere_radius:
                pos_array[i] = [new_x, new_y, new_z]
              else:
                # Si no está dentro de la esfera, escalar para que esté justo en el borde
                final_scale_factor = self.sphere_radius / new_distance_to_center
                pos_array[i] = [new_x * final_scale_factor, new_y * final_scale_factor, new_z * final_scale_factor]

        pos_df[['x', 'y', 'z']] = pos_array
        return pos_df