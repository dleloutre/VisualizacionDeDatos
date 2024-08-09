# GLNetViz

**GLNetViz** es una herramienta diseñada para la visualización de grafos en donde los nodos pertenecen a distintas categorías. Esta herramienta permite visualizar los nodos divididos en comunidades y ver fácilmente cómo se relacionan entre ellos. Además, ofrece una opción para generar una visualización conjunta entre dos grafos(con sus respectivos subgrafos) y otra para visualizar la propagación de un mensaje en la red.

## Requerimientos Técnicos

- NPM
- PIP
- Python 3

## Comandos a ejecutar para utilizar la herramienta

1. Clonar el repositorio:

    ```bash
    git clone git@github.com:dleloutre/VisualizacionDeDatos.git
    ```
2. Instalar las dependencias:

    ```bash
    cd visualization
    npm install
    cd ../preprocessing
    pip install -r requirements.txt
    ```
3. Ejecutar el procesamiento de datos:

    ```bash
    python main.py -e [archivo_aristas] -c [archivo_nodos] [-e2 [archivo_aristas2] -c2 [archivo_nodos2]] [-a [archivo_animacion]] [-r {mcgs,degree,transitive}] [-rad [radio]] [-l [limite]] [-rr [tasa_muestreo]] [-log]
    ```
4. Generar visualización:
    - Opción 1:
      1. Ejecutar la visualización de forma local:

            ```bash
            cd ../visualization
            npm run dev[:joint]
            ```
      2. Abrir el navegador en `http://localhost:[puerto]/` segun el puerto que se indique en la consola,  para visualizar el grafo.
    - Opción 2
        1. Generar la visualización para su despliegue:

            ```bash
            cd ../visualization
            npm run build[:joint]
            ```
        2. Copiar el contenido de la carpeta `dist` en un servidor web y abrir el navegador en la dirección correspondiente para visualizar el grafo.
## Estructura del Proyecto

El proyecto consta de dos partes principales:

### Parte 1: Procesamiento de Datos

Para el procesamiento de datos, se requieren los siguientes archivos CSV que deben guardarse en el directorio `/visualization/public/uploaded_files`:

- **Archivo de nodos:** columnas "node_id,{category}" donde `node_id` es el identificador único del nodo y `{category}` es la categoría de agrupación (ej. si la categoría es música, los valores pueden ser géneros musicales).
- **Archivo de aristas:** columnas "source,target,weight" donde `source` es el ID del nodo origen, `target` el ID del nodo destino y `weight` el peso de la arista.
- **(Opcional) Archivos para visualización conjunta:** un archivo de nodos y uno de aristas por cada categoría respetando el formato mencionado previamente.
- **(Opcional) Archivo de transmisión de mensajes:** columnas "source,target,timestamp" donde `source` es el ID del nodo origen, `target` el ID del nodo destino y `timestamp` el momento de la transmisión del mensaje.


Ejemplos de estos archivos se encuentran en la carpeta `/examples`.

### Ejecución del Procesamiento de Datos

Para ejecutar el procesamiento de datos, sigue estos pasos:

1. Instalar las dependencias: `pip install -r requirements.txt`
2. Ejecutar el script principal:

    ```bash
    python main.py [-h] -e EDGES -c CATEGORIES [-e2 EDGES2] [-c2 CATEGORIES2] [-a ANIMATION] [-r {mcgs,degree,transitive}] [-rad RADIUS] [-l LIMIT] [-rr RATE] [-log LOG]
    ```

#### Opciones:

- `-h, --help`: muestra la descripción de cada opción.
- `-e EDGES, --edges EDGES`: archivo que contiene todas las aristas.
- `-c CATEGORIES, --categories CATEGORIES`: archivo que contiene todos los nodos y sus categorías.
- `-e2 EDGES2, --edges2 EDGES2`: segundo archivo con las aristas para una visualización bipartita.
- `-c2 CATEGORIES2, --categories2 CATEGORIES2`: segundo archivo con los nodos y sus categorías para una visualización bipartita.
- `-a ANIMATION, --animation ANIMATION`: archivo que contiene el flujo de animación.
- `-r {mcgs,degree,transitive}, --reduction {mcgs,degree,transitive}`: tipo de algoritmo de reducción.
- `-rad RADIUS, --radius RADIUS`: factor escalar para calcular el radio de la restricción de la esfera.
- `-l LIMIT, --limit LIMIT`: filtra el número de aristas que cruzan dentro de cada categoría.
- `-rr RATE, --rate RATE`: tasa de muestreo, es decir, la proporción de nodos preservados en la muestra.
- `-log LOG`: habilita el *logger* en la ejecución.

#### Salida del Procesamiento

El procesamiento de datos genera nuevos archivos que se utilizarán para la visualización:

- En `/visualization/public/nodes`, se genera un archivo de nodos para cada categoría posible.
- En `/visualization/public/edges`, se genera un archivo de aristas internas para cada categoría y un archivo de aristas que cruzan entre categorías.
- En `/visualization/data`, se genera un archivo JSON con la especificación de la etiqueta y color asignado a cada categoría. Este archivo se puede editar para personalizarlo.
- Para una visualización conjunta, los archivos de nodos y aristas se dividirán en las carpetas `/nodes_A` y `/edges_A` respectivamente, y los archivos JSON serán dos: `data_A.json` y `data_B.json`.

### Parte 2: Visualización

1. Instalar dependencias: `npm install`
2. Ejecutar el programa:
    - Para la visualización clásica: `npm run dev`
    - Para la visualización conjunta: `npm run dev:joint`

#### Parámetros ajustable en la visualización

- **Antialias:** mejora la calidad de la visualización.
- **Drone View:** cambia el tipo de cámara a una "drone". Controla la cámara con las teclas: "A, W, S, D, Q, E" para cambiar el ángulo y "U, H, J, K, O, L" para trasladarte en el espacio. La velocidad de movimiento se ajusta con las teclas 1, 2, 3 o 4.
- **Spiral Steps:** ajusta el paso en la distribución en forma de espiral.
- **Spiral Rounds:** ajusta la cantidad de vueltas en la espiral.
- **Separation:** ajusta la separación entre subgrafos.
- **Show All Edges:** muestra u oculta las aristas que no se iluminan durante la animación.
- **Play/Pause animation:** pausa o reproduce la animación.
- **Time:** controla el tiempo de la animación.
- **Show All Labels:** muestra u oculta las etiquetas de los subgrafos.

La visualización genera un grafo con subgrafos diferenciados por color. Las aristas entre subgrafos de distintos grupos tendrán un color gradiente donde el extremo corresponderá al color del nodo del otro extremo. Esto permite identificar fácilmente las conexiones entre grupos.

La visualización requiere que existan y sean correctos todos los archivos generados en el procesamiento de datos. El único archivo que puede editarse es `data.json`, respetando sus claves.

## Demo
- Visualización de grupos políticos: [https://visualizaciondatos-politicos.netlify.app/](https://visualizaciondatos-politicos.netlify.app/)
- Visualización de medios: [https://visualizaciondatos-medios.netlify.app/](https://visualizaciondatos-medios.netlify.app/)
- Visualización conjunta: [https://visualizaciondatos-conjunta.netlify.app/](https://visualizaciondatos-conjunta.netlify.app/)

### Ejemplos
```
cp examples/* visualization/public/uploaded_files/
```

```
cd preprocessing/
```

##### Ejemplo de visualización con animación
```
python3 main.py -e edges_comida.csv -c comida.csv -a animation_comida.csv
```

##### Ejemplo de visualización ajustando el radio de la esfera de cada subgrafo
```
python3 main.py -e edges_politicos.csv -c politicos.csv -rad 2
```

##### Ejemplo de visualización bipartita con animación
```
python3 main.py -e edges_comida.csv -c comida.csv -e2 edges_musica.csv -c2 musica.csv -a animation_comida.csv
```
##### Ejemplo de visualización con reducción de subgrafos a traves de MCGS
```
python3 main.py -e edges_comida.csv -c comida.csv -r mcgs
```
##### Ejemplo de visualización con limitación de aristas que cruzan entre subgrafos
```
python3 main.py -e edges_comida.csv -c comida.csv -l 5
```

##### Ejemplo de visualización bipartita con reducción de subgrafos a traves de MCGS y animación de aristas
```
python3 main.py -e edges_comida.csv -c comida.csv -e2 edges_musica.csv -c2 musica.csv -a animation_comida.csv -r mcgs
```

Luego del procesamiento de datos ejecutar:
```
cd ../visualization
```
Para la visualización clásica: `npm run dev`

Para la visualización conjunta: `npm run dev:joint`
