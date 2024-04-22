import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { loadCSV } from "./utils.js";
import partiesJson from "./data/parties.json";

let nodePositions = [];
let nodesIds = [];
let crossing_edges = [];
let instancedEdges;
let instancedNodes;
let scene, camera, renderer, stats;
const crossingEdgeFile = "/data/edges/df_crossed_edges_reduced.csv";
const nodeFilePrefix = "/data/nodes/mcgs_reduced_";
const edgeFilePrefix = "/data/edges/mcgs_reduced_";
const edgeFileSuffix = ".csv";
const nodeFileSuffix = "_FR.csv";
const fileKeys = [
  //"macron",
  "zemmour",
  "melenchon",
  "philippot",
  "poutou",
  "roussel",
  "mlp",
  "pecresse",
  "jadot",
  "asselineau",
  "sandrousseau",
  //"hidalgo",
  "kazib",
  "taubira",
  //"lassalle",
  "dupontaignan",
  "bertrand",
  "arthaud",
  "barnier",
  "montebourg",
];
const nodeColors = [
  0x416D19,
  0xB7C9F2,
  0xB4B4B8,
  0xE8C872,
  0xD04848
];

function setup() {
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
  camera.position.set(0, 0, 300);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

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

function buildNodesGeometry(nodePositions, nodesIds) {
  let totalQuads = nodePositions.length / 3;
  let totalVerticesPerQuad = 6;

  let pos = new Float32Array(totalQuads * totalVerticesPerQuad * 3);
  let uvs = new Float32Array(totalQuads * totalVerticesPerQuad * 2);
  let ids = new Float32Array(totalQuads * totalVerticesPerQuad);

  let uv = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [-0.5, 0.5],
    [0.5, -0.5],
    [0.5, 0.5],
  ];

  let offsetPos = 0;
  let offsetUv = 0;
  let offsetId = 0;
  for (let i = 0; i < totalQuads; i++) {
    for (let j = 0; j < totalVerticesPerQuad; j++) {
      pos[offsetPos + 0] = nodePositions[i * 3 + 0];
      pos[offsetPos + 1] = nodePositions[i * 3 + 1];
      pos[offsetPos + 2] = nodePositions[i * 3 + 2];
      offsetPos += 3;

      uvs[offsetUv + 0] = uv[j][0];
      uvs[offsetUv + 1] = uv[j][1];
      offsetUv += 2;

      ids[offsetId] = nodesIds[i];
      offsetId++;
    }
  }

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("id", new THREE.BufferAttribute(ids, 1));
  return geometry;
}

function buildNodesMaterial(nodeSize = 1, key) {
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
      color: { value: new THREE.Color(parseInt(partiesJson[key].color)) }, // color de los nodos
      size: { value: nodeSize }, // tamano de los nodos
    },
    transparent: false,
  });
  return m;
}

function buildNodes(nodesData, key) {
  const nodeSize = 0.5;

  nodesData.forEach(nodeData => {
    nodePositions.push(nodeData[1]);
    nodePositions.push(nodeData[2]);
    nodePositions.push(nodeData[3]);
    nodesIds.push(nodeData[0]);
  });

  console.log(nodePositions);

  let geo = buildNodesGeometry(nodePositions, nodesIds);
  let mat = buildNodesMaterial(nodeSize, key);

  let nodes = new THREE.Mesh(geo, mat);

  return nodes;
}

function buildEdges(edgesData, nodesData, key) {
  const instancedEdges = instanceEdges(key, edgesData);

	// Crear matrices 1 transformación aleatorias para cada instancia
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

function instanceEdges(key, edgesData) {
  const edgeGeometry = new THREE.CylinderGeometry(0.01, 0.01, 1, 3, 1, true);
  // desplazo 0.5 en y para que el Origen este en la tapa inferior
  edgeGeometry.translate(0, 0.5, 0);
  // Esto es clave, la geometria tiene que estar alineada con el eje -Z
  // porque el lookAt apunta el -z en la direccion del target
  edgeGeometry.rotateX(-Math.PI / 2);

  const instancedEdgeGeometry = new THREE.InstancedBufferGeometry();
  instancedEdgeGeometry.copy(edgeGeometry);

  // Crear el material y el objeto InstancedMesh
  const material = new THREE.MeshBasicMaterial({ color: parseInt(partiesJson[key].color) });

  const instancedEdges = new THREE.InstancedMesh(
    instancedEdgeGeometry,
    material,
    edgesData.length
  );
  return instancedEdges;
}

function getNodePositionById(mesh, id) {
  const index = mesh.geometry.attributes.id.array.findIndex((element) => {
      return element === id;
  });
  return mesh.geometry.attributes.position.array.slice(index * 3, index * 3 + 3);
}

function buildCrossingEdges(edgesData, nodesData, key) {
  const instancedCrossingEdges = instanceEdges(key, edgesData);

	// Crear matrices de transformación aleatorias para cada instancia
	const rotMatrix = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();  
	const matrix = new THREE.Matrix4();
  nodesData = nodesData.flat();
	// orientamos y posicionamos cada instancia
  edgesData.forEach((edgeData, idx) => {
    const node1 = nodesData.find((node) => node[0] == edgeData[0]);
    const node2 = nodesData.find((node) => node[0] == edgeData[4]);
    
    if (node1 && node2) {
      let source = new THREE.Vector3(edgeData[1], edgeData[2], edgeData[3]);
		  let target = new THREE.Vector3(edgeData[5], edgeData[6], edgeData[7]);

      translationMatrix.makeTranslation(source.x, source.y, source.z);
      rotMatrix.lookAt(source, target, new THREE.Vector3(0,1,0))

      // calculo distancia entre source y target
      let length = source.distanceTo(target);

      matrix.identity();
      matrix.makeScale(1, 1, length);
      matrix.premultiply(rotMatrix);
      matrix.premultiply(translationMatrix);

      instancedCrossingEdges.setMatrixAt(idx, matrix);
    }
  });

	return instancedCrossingEdges;
}

function calculateGraphPositions() {
  const keys = Object.keys(partiesJson);
  const radius = 400;
  const angleIncrement = Math.PI / 18

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const angle = i * angleIncrement;
    const x = radius * Math.cos(angle); // convert polar coordinates to cartesian coordinates
    const y = radius * Math.sin(angle) - 150;
    const z = 0; // can be adjusted to position along the z-axis
    partiesJson[key].position = { x, y, z };
  }
  return partiesJson;
}

function drawCrossingEdges(edges, nodes, key="poutou") {
  console.log("crossing edges", edges);
  instancedEdges = buildCrossingEdges(edges, nodes, key);
  scene.add(instancedEdges);
}

function preProcessCrossingEdges(crossingEdgesData) {
  crossingEdgesData.forEach((crossingEdge) => {
    //console.log("crossing edge", crossingEdge);
    const sourceId = crossingEdge[3];
    const targetId = crossingEdge[4];
    const source = getNodePositionById(instancedNodes, sourceId);
    const target = getNodePositionById(instancedNodes, targetId);
    const sourceGroupId = crossingEdge[2];
    const targetGroupId = crossingEdge[1];
    //console.log("source", source);
    //console.log("sourceId", sourceId);
    //console.log("sourceGroupId", sourceGroupId);
    //console.log("target", target);
    //console.log("targetId", targetId);
    //console.log("targetGroupId", targetGroupId);
    for (let i = 0; i < Object.keys(partiesJson).length; i++) {
      if (partiesJson[Object.keys(partiesJson)[i]].id === sourceGroupId) {
        var sourceGroup = Object.keys(partiesJson)[i];
      }
      if (partiesJson[Object.keys(partiesJson)[i]].id === targetGroupId) {
        var targetGroup = Object.keys(partiesJson)[i];
      }
    }
    //console.log("sourceGroup", sourceGroup);
    //console.log("targetGroup", targetGroup);
    const sourceX = source[0] + partiesJson[sourceGroup].position.x
    const sourceY = source[1] + partiesJson[sourceGroup].position.y
    const sourceZ = source[2] + partiesJson[sourceGroup].position.z
    const targetX = target[0] + partiesJson[targetGroup].position.x
    const targetY = target[1] + partiesJson[targetGroup].position.y
    const targetZ = target[2] + partiesJson[targetGroup].position.z
    const edge = [sourceId, sourceX, sourceY, sourceZ, targetId, targetX, targetY, targetZ];
    //console.log("edge", edge);
    crossing_edges.push(edge);
  });
  return crossing_edges;

}

function drawGraph(nodes, edges, key, partiesData) {
  const group = new THREE.Group();
  instancedNodes = buildNodes(nodes, key);
  instancedEdges = buildEdges(edges, nodes, key);
  group.add(instancedNodes);
  group.add(instancedEdges);
  // const positionsForSubGraphs = positionNodesInSemiCircle(nodes.length, index);
  group.position.x = partiesData[key].position.x//positionsForSubGraphs[index].x;
  group.position.y = partiesData[key].position.y//positionsForSubGraphs[index].y;
  scene.add(group);
}

const animate = function () {
	stats.begin();
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	stats.end();
};

async function loadData() {
  const partiesData = calculateGraphPositions();

  for (let i = 0; i < fileKeys.length; i++) {
    const nodeFile = nodeFilePrefix + fileKeys[i] + nodeFileSuffix;
    const edgeFile = edgeFilePrefix + fileKeys[i] + edgeFileSuffix;
    const nodesData = await loadCSV(nodeFile);
    const edgesData = await loadCSV(edgeFile);
    nodes_crossing.push(nodesData);
    drawGraph(nodesData, edgesData, fileKeys[i], partiesData);
    animate();
  }
  return nodes_crossing;
}

async function loadCrossingEdges(nodes_crossing) {
  const crossingEdgesData = await loadCSV(crossingEdgeFile);
  crossing_edges = preProcessCrossingEdges(crossingEdgesData);
  drawCrossingEdges(crossing_edges, nodes_crossing);
  animate();
}

let nodes_crossing = [];
setup();
nodes_crossing = await loadData();
await loadCrossingEdges(nodes_crossing);