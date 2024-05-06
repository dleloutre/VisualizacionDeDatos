import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { GraphMeshBuilder } from "./graphMeshBuilder.js";
import { Graph } from "./graph.js";
import { loadCSV } from "./utils.js";
import { generateTextSprite } from "./spriteText.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { DroneCameraControl } from "./droneCamera.js";
import partiesData from "/data/parties.json" assert { type: 'json' };

let scene, camera, renderer, composer, stats, controls, plane, nodes, edges, graph, textlabels = [];
let fileKeys, orbitalCamera, droneCamera, droneCameraControl;

const params = {
	emissionFactor: 0.3,
	waveOffset: -3,
  spiralSteps: 1,
  spiralRounds: 1,
  spiralSwitch: true,
  droneCamera: false,
};

function setup() {
  scene = new THREE.Scene();
  orbitalCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  );
  droneCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  );
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  
  const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
    samples: 4,
    type: THREE.HalfFloatType,
  });
  
  const renderPass = new RenderPass(scene, droneCamera);
  const outputPass = new OutputPass();
  
  composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(renderPass);
  composer.addPass(outputPass);

  controls = new OrbitControls(orbitalCamera, renderer.domElement);
  // Semicircle layout: camera.position.set(0, 500, 2500)
  // Circle layout: camera.position.set(0, 3000, 0);
  // Spiral layout: 
  orbitalCamera.position.set(0, 5000, 0)

  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  //window.addEventListener("resize", onResize);

  droneCameraControl = new DroneCameraControl(droneCamera, [0, 0, 1000]);
  camera = orbitalCamera;
  window.addEventListener("resize", onResize);
}

function onResize() {
  orbitalCamera.aspect = window.innerWidth / window.innerHeight;
  orbitalCamera.updateProjectionMatrix();
  droneCamera.aspect = window.innerWidth / window.innerHeight;
  droneCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function createUI() {
	const gui = new dat.GUI();
  gui
    .add(params, "droneCamera")
    .name("drone view")
    .onChange((v) => {
      if (v) {
        camera = droneCamera;
      } else {
        camera = orbitalCamera;
      }
    });
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
    gui.add(params, "spiralSteps", 0, 10)
		.name("spiral steps")
		.step(1)
		.onChange((v) => {
            graph.updateSteps(v);
            updateGraph();
		});
    gui.add(params, "spiralRounds", 1, 10)
		.name("spiral rounds")
		.step(1)
		.onChange((v) => {
            graph.updateRounds(v);
            updateGraph();
		});
    gui.add(params, "spiralSwitch")
        .name("constant radius")
        .onChange((v) => {
            graph.updateConstantRadius(v);
            updateGraph();
        });
}

function updateGraph() {
	let gmb = new GraphMeshBuilder(graph);
  const e = graph.getEdges();
  scene.remove(edges);
	edges = gmb.createEdges(e);
	scene.add(edges);

  scene.remove(nodes);
	nodes = gmb.createNodes();
	scene.add(nodes);

  for (const label of textlabels) {
    scene.remove(label)
  }
  textlabels = []
  const labelPositions = graph.getLabels();

  textlabels = positionLabels(labelPositions);

  for (const label of textlabels) {
    scene.add(label)
  }
}

function positionLabels(labelPositions) {
  for (let i = 0; i < labelPositions.length; i++) {
    let partyKey = fileKeys[i];
    let color = partiesData[partyKey].color || 0xffffff;
    let label = partiesData[partyKey].label || "Unknown";
    var textmesh = generateTextSprite(label, { borderColor: color });

    textmesh.position.x = labelPositions[i].radius * 7 * Math.sin(labelPositions[i].angle);
    textmesh.position.y = labelPositions[i].position.y * 5;
    textmesh.position.z = labelPositions[i].radius * 6 * Math.cos(labelPositions[i].angle);
    textmesh.rotation.z = Math.PI / 2;

    textlabels.push(textmesh);
  }

  return textlabels;
}

const animate = function () {
	stats.begin();
	requestAnimationFrame(animate);
  controls.update();
  if (params.droneCamera) {
    let cameraHasChanged = droneCameraControl.update();
    if (cameraHasChanged) {
      renderer.render(scene, camera);
    } else {
      // maxima calidad
      composer.render();
    }
  }
	renderer.render(scene, camera);
	stats.end();
};

async function loadFiles() {
  const nodeFilePrefix = "/nodes/dataset_";
  const edgeFilePrefix = "/edges/dataset_";
  
  const edgeFileSuffix = ".csv";
  const nodeFileSuffix = "_FR.csv";
  fileKeys = Object.keys(partiesData);
  fileKeys.push("crossing");

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
    // para los nodos hay un array por partido politico
    // para las aristas hay un array por partido politico + uno para las aristas que cruzan
    const { nodesInfo, edgesInfo } = await loadFiles();
    const metadata = {
      parties: partiesData
    }
    return new Graph(nodesInfo, edgesInfo, metadata);
}

setup();
createUI();
prepareData().then((G) => {
    graph = G
    updateGraph();
    animate();
}).catch((e) => console.log(e));
