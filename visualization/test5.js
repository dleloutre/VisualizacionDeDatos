// Merge entre demo4 y test
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { GraphMeshBuilder } from "./graphMeshBuilder.js";
import { Graph } from "./graph.js";
import { loadCSV } from "./utils.js";

let scene, camera, renderer, stats, controls, plane, nodes, edges;

const params = {
	emissionFactor: 0.3,
	waveOffset: -3,
};

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

  controls = new OrbitControls(camera, renderer.domElement);
  // Semicircle layout: camera.position.set(0,500,2500)
  // Circle layout: 
  camera.position.set(0, 3000, 0);

  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

  const gridHelper = new THREE.GridHelper(4000);
  //scene.add(gridHelper);

  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  plane.rotation.y = Math.PI / 2;
  plane.position.x = -1500;
  plane.position.y = 500;
  plane.name = "textureDebuggerPlane";
  //scene.add(plane);
  window.addEventListener("resize", onResize);
}

function onResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function createUI() {
	const gui = new dat.GUI();
	gui.add(params, "emissionFactor", 0, 1)
		.step(0.01)
		.name("emission factor")
		.onChange((v) => {
			edges.material.uniforms.emissionFactor.value = v;
		});
	gui.add(params, "waveOffset", -3, 3)
		.name("wave offset")
		.step(0.01)
		.onChange((v) => {
			edges.material.uniforms.waveOffset.value = v;
		});
}

function drawGraph(graph) {
	let gmb = new GraphMeshBuilder(graph);
    const e = graph.getEdges();
	edges = gmb.createEdges(e);
    console.log("instanced edges draw graph", edges)
	scene.add(edges);

	let texture = edges.material.uniforms.edgeColor.value;
	plane.material.map = texture;

	nodes = gmb.createNodes();
	scene.add(nodes);
}

const animate = function () {
	stats.begin();
	requestAnimationFrame(animate);
    controls.update();
	renderer.render(scene, camera);
	stats.end();
};

async function loadFiles() {
  const nodeFilePrefix = "/data/nodes/dataset_";
  const edgeFilePrefix = "/data/edges/dataset_";
  const edgeFileSuffix = ".csv";
  const nodeFileSuffix = "_FR.csv";
  const fileKeys = [
    "macron",
    "zemmour", 
    "melenchon",
    "poutou",
    "philippot",
    "mlp",
    "pecresse",
    "jadot",
    "hidalgo",
    "roussel",
    "asselineau",
    "kazib",
    "sandrousseau",
    "taubira",
    "bertrand",
    "montebourg",
    "dupontaignan",
    "lasalle",
    "arthaud",
    "barnier", // separar más los nodos o dibujarlos más chicos
  ];

  const nodesInfo = [];
  const edgesInfo = [];

  for (let i = 0; i < fileKeys.length; i++) {
    const nodeFile = nodeFilePrefix + fileKeys[i] + nodeFileSuffix;
    const edgeFile = edgeFilePrefix + fileKeys[i] + edgeFileSuffix;
    const nodesData = await loadCSV(nodeFile);
    const edgesData = await loadCSV(edgeFile);
    nodesInfo.push(nodesData);
    edgesInfo.push(edgesData);
  }
  //"/data/edges/reduced_df_crossed_edges_all_but_none.csv"
  const crossingEdgesData = await loadCSV("/data/edges/df_crossed_edges_all_but_none_reduced_2.csv");
  edgesInfo.push(crossingEdgesData);

  console.log("nodes", nodesInfo);
  console.log("edges", edgesInfo);
  return { nodesInfo, edgesInfo };
}

async function prepareData() {
    // cargar info de los archivos
    // para los nodos hay un array por partido politico
    // para las aristas hay un array por partido politico + uno para las aristas que cruzan
    const { nodesInfo, edgesInfo } = await loadFiles();
    return new Graph(nodesInfo, edgesInfo);
}

setup();
createUI();
const graph = await prepareData();
drawGraph(graph);
animate();