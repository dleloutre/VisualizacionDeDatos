// Importar la biblioteca three.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { loadCSV } from "./utils.js";

let nodePositions = [];
let nodesData, edgesData;
let instancedEdges;
let instancedNodes;
let scene, camera, renderer, stats;

function setup() {
  // Inicializar la escena, la cámara y el renderizador
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  camera.position.set(2, 0, 5);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Añadir controles de órbita
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  const axesHelper = new THREE.AxesHelper(10);
  scene.add(axesHelper);

  const size = 10;
  const divisions = 10;

  const gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);

  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
}

function buildNodesGeometry(nodePositions) {
  // positions es un array de 3 * n elementos, donde n es la cantidad de nodos
  // quad son 2 triangulos que forman un cuadrado
  let totalQuads = nodePositions.length / 3;
  let totalVerticesPerQuad = 6; // 6 vertices por quad

  let pos = new Float32Array(totalQuads * totalVerticesPerQuad * 3); // 6 vertices por quad, 3 coordenadas por vertice
  let uvs = new Float32Array(totalQuads * totalVerticesPerQuad * 2); // 6 vertices por quad, 2 coordenadas por vertice

  // los 6 vertices que forman un quad
  let uv = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],

    [-0.5, 0.5],
    [0.5, -0.5],
    [0.5, 0.5],
  ];

  // llenar los arrays pos y uvs
  // por cada quad todos los vertices tienen la posicion del nodo
  // pero los uvs son distintos, tienen el desplazamiento en 2D para formar el quad
  let offsetPos = 0;
  let offsetUv = 0;
  for (let i = 0; i < totalQuads; i++) {
    for (let j = 0; j < totalVerticesPerQuad; j++) {
      pos[offsetPos + 0] = nodePositions[i * 3 + 0];
      pos[offsetPos + 1] = nodePositions[i * 3 + 1];
      pos[offsetPos + 2] = nodePositions[i * 3 + 2];
      offsetPos += 3;

      uvs[offsetUv + 0] = uv[j][0];
      uvs[offsetUv + 1] = uv[j][1];
      offsetUv += 2;
    }
  }

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

  return geometry;
}

function buildNodesMaterial(nodeSize = 1) {
  let m = new THREE.ShaderMaterial({
    vertexShader: `
            varying vec2 vUv;
            uniform float size;
            void main() {
                vUv = uv;
                vec4 pos =  modelViewMatrix * vec4(position, 1.0);
                // modificamos la posicion en el espacio de la camara
                // desplazamos cada vertice del quad a su posicion local relativa al centro del quad
                pos.x+=uv.x*size;
                pos.y+=uv.y*size;

                pos=projectionMatrix * pos;

                gl_Position=pos;
            }
        `,
    fragmentShader: `
            varying vec2 vUv;
            uniform vec3 color;
            void main() {
                float r=length(vUv);
                float decay=1.0-r*0.7;
                if (r>0.5){
                    discard;
                }
                gl_FragColor = vec4(color*decay,  1.0);
            }
        `,
    uniforms: {
      color: { value: new THREE.Color(0x00ff00) }, // color de los nodos
      size: { value: nodeSize }, // tamano de los nodos
    },
    transparent: false,
  });
  return m;
}

function buildNodes() {
  const nodeSize = 0.5;

  nodesData.forEach(nodeData => {
    nodePositions.push(nodeData[1]);
    nodePositions.push(nodeData[2]);
    nodePositions.push(nodeData[3]);
  });

  let geo = buildNodesGeometry(nodePositions);
  let mat = buildNodesMaterial(nodeSize);

  let nodes = new THREE.Mesh(geo, mat);
  return nodes;
}

function buildEdges() {
  const edgeGeometry = new THREE.CylinderGeometry(0.01, 0.01, 1, 3, 1, true);
	// desplazo 0.5 en y para que el Origen este en la tapa inferior
	edgeGeometry.translate(0,0.5,0);
	// Esto es clave, la geometria tiene que estar alineada con el eje -Z
	// porque el lookAt apunta el -z en la direccion del target
  edgeGeometry.rotateX(-Math.PI/2)

	const instancedEdgeGeometry = new THREE.InstancedBufferGeometry();
	instancedEdgeGeometry.copy(edgeGeometry);

	// Crear el material y el objeto InstancedMesh
	const material = new THREE.MeshNormalMaterial();

	const instancedEdges = new THREE.InstancedMesh(
		instancedEdgeGeometry,
		material,
		edgesData.length
	);

	// Crear matrices de transformación aleatorias para cada instancia
	const rotMatrix = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();  
	const matrix = new THREE.Matrix4();

	// orientamos y posicionamos cada instancia
  edgesData.forEach((edgeData, idx) => {
    const node1 = nodesData.find((node) => node[0] == edgeData[0]);
    const node2 = nodesData.find((node) => node[0] == edgeData[1]);

    if (node1 && node2) {
      let source = new THREE.Vector3(node1[1], node1[2], node1[3]);
		  let target = new THREE.Vector3(node2[1], node2[2], node2[3]);

      translationMatrix.makeTranslation(source.x, source.y, source.z);
      rotMatrix.lookAt(source, target, new THREE.Vector3(0,1,0))

      // calculo distancia entre source y target
      let length = source.distanceTo(target);

      matrix.identity();
      matrix.makeScale(1, 1, length);
      matrix.premultiply(rotMatrix);
      matrix.premultiply(translationMatrix);

      instancedEdges.setMatrixAt(idx, matrix);
    }
  });

	return instancedEdges;
}

function drawEdges() {
	instancedEdges = buildEdges();
	scene.add(instancedEdges);
}

function drawNodes() {
	instancedNodes = buildNodes();
	scene.add(instancedNodes);
}

const animate = function () {
	stats.begin();
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	stats.end();
};

async function loadData() {
  nodesData = await loadCSV("mcgs_reduced_lasalle_FR.csv");
  edgesData = await loadCSV("mcgs_reduced_lasalle.csv");
}

loadData()
  .then(() => {
    setup();
    drawNodes();
    drawEdges();
    animate();
  })
  .catch(console.error);