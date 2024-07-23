import math

class Scalator():
    def scalate_3D_adjacent(self, df):
        min_x = df['x'].min()
        max_x = df['x'].max()
        min_y = df['y'].min()
        max_y = df['y'].max()
        min_z = df['z'].min()
        max_z = df['z'].max()
        
        subgraph_width = (max_x - min_x) / 21
        range_y = max_y - min_y
        range_z = max_z - min_z
        
        for i in range(21):
            offset = (i + 1) * subgraph_width
            df.loc[df['node_id'].isin(range(i * (len(df) // 21), (i + 1) * (len(df) // 21))), 'x'] += offset
        
        min_x_adj = df['x'].min()
        max_x_adj = df['x'].max()
        df['x_scaled'] = ((df['x'] - min_x_adj) / (max_x_adj - min_x_adj)) * 100
        df['y_scaled'] = ((df['y'] - min_y) / range_y) * 100 - 50
        df['z_scaled'] = ((df['z'] - min_z) / range_z) * 100 - 50

        df_scaled = df[['node_id', 'x_scaled', 'y_scaled', 'z_scaled']]
        df_scaled.columns = ['node_id', 'x', 'y', 'z']
        
        return df_scaled

    def scalate_3D_semicircle(self, df):
        max_x = df['x'].max()
        min_x = df['x'].min()
        radius = (max_x - min_x) / 2
        
        angle_increment = math.pi / 21

        for index, row in df.iterrows():
            angle = (row['x'] - min_x) / radius  # calculate the angle based on x-coordinate
            slice_index = int(angle / angle_increment)
            angle = slice_index * angle_increment  # adjust the angle to fit within the slice
            new_x = radius * math.cos(angle)  # convert polar coordinates to cartesian coordinates
            new_y = radius * math.sin(angle)
            df.at[index, 'x'] = new_x
            df.at[index, 'y'] = new_y

        min_x_adj = df['x'].min()
        max_x_adj = df['x'].max()
        min_y = df['y'].min()
        max_y = df['y'].max()
        df['x_scaled'] = ((df['x'] - min_x_adj) / (max_x_adj - min_x_adj)) * 100
        df['y_scaled'] = ((df['y'] - min_y) / (max_y - min_y)) * 100 - 50
        df['z_scaled'] = df['z']

        df_scaled = df[['node_id', 'x_scaled', 'y_scaled', 'z_scaled']]
        df_scaled.columns = ['node_id', 'x', 'y', 'z']
        
        return df_scaled


    def scalate_3D(self, df):
        max_x = df['x'].max()
        min_x = df['x'].min()
        max_y = df['y'].max()
        min_y = df['y'].min()
        max_z = df['z'].max()  
        min_z = df['z'].min()  

        range_x = max_x - min_x
        range_y = max_y - min_y
        range_z = max_z - min_z 

        # Escalado entre -50 y 50
        df['x_scaled'] = ((df['x'] - min_x) / range_x) * 100 - 50
        df['y_scaled'] = ((df['y'] - min_y) / range_y) * 100 - 50
        df['z_scaled'] = ((df['z'] - min_z) / range_z) * 100 - 50  

        df_scaled = df[['node_id', 'x_scaled', 'y_scaled', 'z_scaled']]
        df_scaled.columns = ['node_id', 'x', 'y', 'z'] 

        return df_scaled

    def scalate_2D(self, df):
        max_x = df['x'].max()
        min_x = df['x'].min()
        max_y = df['y'].max()
        min_y = df['y'].min()

        range_x = max_x - min_x
        range_y = max_y - min_y

        # Escalado entre -50 y 50
        df['x_scaled'] = ((df['x'] - min_x) / range_x) * 100 - 50
        df['y_scaled'] = ((df['y'] - min_y) / range_y) * 100 - 50

        df_scaled = df[['node_id', 'x_scaled', 'y_scaled']]
        df_scaled.columns = ['node_id', 'x', 'y'] 

        return df_scaled
