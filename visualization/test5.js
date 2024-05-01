// Merge entre demo4 y test
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { GraphMeshBuilder } from "./graphMeshBuilder.js";
import { Graph } from "./graph.js";
import { loadCSV } from "./utils.js";
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

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
    20000
  );
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  // Semicircle layout: camera.position.set(0,500,2500)
  // Circle layout: camera.position.set(0, 3000, 0);
  // Spiral layout: 
  camera.position.set(0, 10000, 0)

  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

  const gridHelper = new THREE.GridHelper(4000);
  //scene.add(gridHelper);

  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  /*plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  plane.rotation.y = Math.PI / 2;
  plane.position.x = -1500;
  plane.position.y = 500;
  plane.name = "textureDebuggerPlane";*/
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

function drawGraph(graph, font) {
	let gmb = new GraphMeshBuilder(graph);
    const e = graph.getEdges();
	edges = gmb.createEdges(e);
	scene.add(edges);

	//let texture = edges.material.uniforms.edgeColor.value;
	//plane.material.map = texture;

	nodes = gmb.createNodes();
	scene.add(nodes);

    // LABEL PRUEBA
    let light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);

    const labels = graph.getLabels();
    console.log("labels:", labels);
    const materialargs = {
        color: 0xFFFFFF
    };

    for (let i=0; i < labels.length; i++) {
        let labelgeo = new TextGeometry(labels[i].label, {
            font: font,
            size: 25000,
            depth: 10000 / 2
        });
        
        //labelgeo.translate(, 0, 0 );
        const material = new THREE.MeshPhongMaterial( materialargs );
        const textmesh = new THREE.Mesh( labelgeo, material );
        textmesh.scale.set( 0.01, 0.01, 0.01 );
        console.log("label: ", labels[i])
        textmesh.position.x = (labels[i].radius + labels[i].size) * Math.sin(labels[i].angle);
        textmesh.position.y = labels[i].position.y*7;
        textmesh.position.z = (labels[i].radius + labels[i].size) * Math.cos(labels[i].angle);
        console.log(`mesh ${labels[i].label}`,textmesh)
    
        //textmesh.lookAt(camera.position);
        textmesh.quaternion.copy(camera.quaternion);
        scene.add(textmesh);
    }


    // FIN LABEL PRUEBA
}

const animate = function () {
	stats.begin();
	requestAnimationFrame(animate);
    controls.update();
	renderer.render(scene, camera);
	stats.end();
};

async function loadFiles() {
  const nodeFilePrefix = "/nodes/dataset_";
  const edgeFilePrefix = "/edges/dataset_";
  
  const edgeFileSuffix = ".csv";
  const nodeFileSuffix = "_FR.csv";
  const fileKeys = [
    "macron",
    "zemmour", 
    "melenchon",
    "crossing",
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
    if (fileKeys[i] !== "crossing") {
        const nodeFile = nodeFilePrefix + fileKeys[i] + nodeFileSuffix;
        const nodesData = await loadCSV(nodeFile);
        nodesInfo.push(nodesData);
    }
    const edgeFile = edgeFilePrefix + fileKeys[i] + edgeFileSuffix;
    const edgesData = await loadCSV(edgeFile);
    edgesInfo.push(edgesData);
  }

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

const loader = new FontLoader();
loader.load('fonts/helvetiker_regular.typeface.json', function ( font ) {
    setup();
    createUI();
    prepareData().then((graph) => {
        drawGraph(graph, font);
        animate();
    }).catch((e) => console.log(e));
});