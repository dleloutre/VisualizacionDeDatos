class Scalator():
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
