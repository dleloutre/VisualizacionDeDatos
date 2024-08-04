import numpy as np

DEFAULT_RADIUS = 1
MIN_RADIUS = 80

class SphereConstraint:
    def __init__(self, sphere_radius, radius_scalator):
        if not radius_scalator:
            radius_scalator = DEFAULT_RADIUS
        sphere_radius = sphere_radius*100*radius_scalator
        if sphere_radius < MIN_RADIUS:
            sphere_radius = MIN_RADIUS
        self.sphere_radius = sphere_radius

    def constrain_to_sphere(self, pos_df):
        pos_array = pos_df[['x', 'y', 'z']].values
        max_distance = 0
        for i in range(len(pos_array)):
            x, y, z = pos_array[i]
            distance_to_center = np.sqrt(x**2 + y**2 + z**2)

            if distance_to_center > max_distance:
              max_distance = distance_to_center

            if distance_to_center > self.sphere_radius:
                scale_factor = self.sphere_radius / distance_to_center
                new_x = x * scale_factor
                new_y = y * scale_factor
                new_z = z * scale_factor
                pos_array[i] = [new_x, new_y, new_z]
        if max_distance < 0.8 * self.sphere_radius:
          '''larger_pos = pos_df
          scale_factor = 0.4 * self.sphere_radius
          for i in range(len(pos_array)):
            pos_array[i] = [x * scale_factor, y * scale_factor, z * scale_factor]
          larger_pos[['x', 'y', 'z']] = pos_array
          return self.constrain_to_sphere(larger_pos)'''
          for i in range(len(pos_array)):
              x, y, z = pos_array[i]
              scale_factor = 0.4 * self.sphere_radius
              new_x = x * scale_factor
              new_y = y * scale_factor
              new_z = z * scale_factor
              pos_array[i] = [new_x, new_y, new_z]

        pos_df[['x', 'y', 'z']] = pos_array
        return pos_df