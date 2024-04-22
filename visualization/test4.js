// Importar la biblioteca three.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { GraphMeshBuilder } from "./delete_graphMeshBuilder.js";
import { FakeGraph } from "./delete_fakeGraph.js";

let scene, camera, renderer, controls, edges, stats, nodes, plane;
const RANGE = 200;

const params = {
	emissionFactor: 0.3,
	multiplier: 4,
	waveOffset: -3,
};

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

	// Añadir controles de órbita
	controls = new OrbitControls(camera, renderer.domElement);
	camera.position.set(500, 300, 500);

	window.cylinderCount = 10;
	window.cylinderMultiplier = 4;

	const axesHelper = new THREE.AxesHelper(100);
	scene.add(axesHelper);

	// Configurar la cámara
	camera.position.z = 5;

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
	scene.add(plane);
	updateGraph();
	window.addEventListener("resize", onResize);
}

function onResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function createUI() {
	const gui = new dat.GUI();
	gui.add(params, "multiplier", 1, 7)
		.step(1)
		.name("edges 10^x")
		.onChange(updateGraph);
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
	//edges.material.uniforms.waveOffset.value = (Date.now() * 0.001) % 10;
}

function updateGraph() {
	let fakeGraph = new FakeGraph();
	let gmb = new GraphMeshBuilder(fakeGraph);

	let count = Math.pow(10, params.multiplier);
	scene.remove(edges);

	edges = gmb.createEdges(count);
	scene.add(edges);

	let texture = edges.material.uniforms.edgeColor.value;
	plane.material.map = texture;
	scene.remove(nodes);

	nodes = gmb.createNodes();
	scene.add(nodes);
}

// Función de animación
const animate = function () {
	stats.begin();
	requestAnimationFrame(animate);

	// value between 0 and 10

	// Actualizar los controles de órbita
	controls.update();

	// Renderizar la escena
	renderer.render(scene, camera);
	stats.end();
};

setup();
createUI();
animate();
