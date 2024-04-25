import numpy as np

class SphereConstraint:
    def __init__(self, sphere_radius):
        self.sphere_radius = sphere_radius

    def constrain_to_sphere(self, pos_df):
        # Convertir las posiciones a un arreglo numpy para facilitar los cálculos
        pos_array = pos_df[['x', 'y', 'z']].values
        max_distance = 0
        # Iterar sobre todas las posiciones y ajustar aquellas que estén fuera de la esfera
        for i in range(len(pos_array)):
            x, y, z = pos_array[i]

            # Calcular la distancia del punto al centro de la esfera
            distance_to_center = np.sqrt(x**2 + y**2 + z**2)

            if distance_to_center > max_distance:
              max_distance = distance_to_center

            # Si la distancia al centro es mayor que el radio de la esfera, ajustar la posición
            if distance_to_center > self.sphere_radius:
                # Calcular la nueva posición en la superficie de la esfera
                scale_factor = self.sphere_radius / distance_to_center
                new_x = x * scale_factor
                new_y = y * scale_factor
                new_z = z * scale_factor
                # Actualizar la posición para que esté en la superficie de la esfera
                pos_array[i] = [new_x, new_y, new_z]

        # Ajustar posiciones si todas estan muy cercanas al centro
        if max_distance < 0.8 * self.sphere_radius:
          for i in range(len(pos_array)):
              x, y, z = pos_array[i]
              scale_factor = 0.4 * self.sphere_radius
              new_x = x * scale_factor
              new_y = y * scale_factor
              new_z = z * scale_factor
              pos_array[i] = [new_x, new_y, new_z]

        pos_df[['x', 'y', 'z']] = pos_array
        return pos_df