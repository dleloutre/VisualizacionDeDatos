class Scalator():
    def scalate_3D_adjacent(self, df):
        min_x = df['x'].min()
        max_x = df['x'].max()
        min_y = df['y'].min()
        max_y = df['y'].max()
        min_z = df['z'].min()
        max_z = df['z'].max()
        
        # Calculate the width of each sub-graph
        subgraph_width = (max_x - min_x) / 21
        range_y = max_y - min_y
        range_z = max_z - min_z
        
        # Adjust positions for each sub-graph
        for i in range(21):
            # Calculate the offset for the current sub-graph
            offset = (i + 1) * subgraph_width
            # Adjust x positions for nodes in the current sub-graph
            df.loc[df['node_id'].isin(range(i * (len(df) // 21), (i + 1) * (len(df) // 21))), 'x'] += offset
        
        # Normalize adjusted positions to fit within the space width
        min_x_adj = df['x'].min()
        max_x_adj = df['x'].max()
        df['x_scaled'] = ((df['x'] - min_x_adj) / (max_x_adj - min_x_adj)) * 100
        df['y_scaled'] = ((df['y'] - min_y) / range_y) * 100 - 50
        df['z_scaled'] = ((df['z'] - min_z) / range_z) * 100 - 50

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
