import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { GraphMeshBuilder } from "./graphMeshBuilder.js";
import { Graph } from "./graph.js";
import { loadCSV } from "./utils.js";
import { generateTextSprite } from "./spriteText.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js';
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { DroneCameraControl } from "./droneCamera.js";
import { Subgraph } from "./subgraph.js";
import metadata from "/data/data.json" assert { type: "json" };

let scene,
  sceneElements = new THREE.Group(),
  camera,
  renderer,
  composer,
  stats,
  controls,
  nodes,
  edges,
  graph,
  textlabels = [],
  fileKeys,
  orbitalCamera,
  droneCamera,
  droneCameraControl,
  renderPass,
  cameraMatrixOldValues = [];

const params = {
  emissionFactor: 0.3,
  spiralSteps: 1,
  spiralRounds: 1,
  subgraphSeparation: 2,
  spiralSwitch: true,
  droneCamera: false,
  antialias: false,
};

function setup() {
  scene = new THREE.Scene();
  orbitalCamera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    200000
  );
  droneCamera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    200000
  );
  camera = orbitalCamera;
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  THREE.ColorManagement.enabled = true;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const size = renderer.getDrawingBufferSize(new THREE.Vector2());

  const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
    samples: 5,
    type: THREE.FloatType,
  });

  renderPass = new SSAARenderPass(scene, camera);
  renderPass.clearColor = new THREE.Color(0x000000); 
  renderPass.clearAlpha = 1; 
  renderPass.sampleLevel = 4; 
  renderPass.unbiased = true;

  const outputPass = new OutputPass();
  composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(renderPass);
  composer.addPass(outputPass);

  controls = new OrbitControls(orbitalCamera, renderer.domElement);
  droneCameraControl = new DroneCameraControl(droneCamera);

  // Semicircle layout: camera.position.set(0, 500, 2500)
  // Circle layout: camera.position.set(0, 3000, 0);
  // Spiral layout:
  orbitalCamera.position.set(0, 22000, 0);

  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  window.addEventListener("resize", onResize);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function changeButtonsVisibility(visibility) {
  if (isMobile.apple.phone || isMobile.android.phone) {
    document.getElementById("translation-buttons").style.visibility=visibility;
    document.getElementById("rotation-buttons").style.visibility=visibility;
  }
}

function createUI() {
  const gui = new dat.GUI();
  gui.add(params, "antialias")
    .name("antialias")
  gui
    .add(params, "droneCamera")
    .name("drone view")
    .onChange((v) => {
      if (v) {
        camera = droneCamera;
        changeButtonsVisibility("visible");
        droneCameraControl.adjustGraphPosition(sceneElements);
      } else {
        camera = orbitalCamera;
        changeButtonsVisibility("hidden");
        sceneElements.rotation.y = -Math.PI;
        sceneElements.rotation.x = Math.PI;
        sceneElements.rotation.z = -Math.PI;
      }
    });
  gui
    .add(params, "emissionFactor", 0, 1)
    .step(0.01)
    .name("emission factor")
    .onChange((v) => {
      edges.material.uniforms.emissionFactor.value = v;
    });
  gui
    .add(params, "spiralSteps", 0, 10)
    .name("spiral steps")
    .step(1)
    .onChange((v) => {
      graph.updateSteps(v);
      updateGraph();
    });
  gui
    .add(params, "spiralRounds", 1, 10)
    .name("spiral rounds")
    .step(1)
    .onChange((v) => {
      graph.updateRounds(v);
      updateGraph();
    });
  gui
    .add(params, "spiralSwitch")
    .name("constant radius")
    .onChange((v) => {
      graph.updateConstantRadius(v);
      updateGraph();
    });
  gui
    .add(params, "subgraphSeparation", 0, 3)
    .name("separation between subgraphs")
    .step(0.1)
    .onChange((v) => {
      graph.updateSeparation(v);
      updateGraph();
    });
}

function updateGraph() {
  scene.remove(sceneElements);
  sceneElements.remove(edges);
  sceneElements.remove(nodes);
  textlabels.forEach((label) => sceneElements.remove(label));
  let gmb = new GraphMeshBuilder(graph);
  edges = gmb.createEdges();
  nodes = gmb.createNodes();

  textlabels = [];
  const labelPositions = graph.getLabels();
  textlabels = positionLabels(labelPositions);
  sceneElements.add(edges);
  sceneElements.add(nodes);
  textlabels.forEach((label) => sceneElements.add(label));
  scene.add(sceneElements);

  console.log("ESCENA", scene)
}

function positionLabels(labelPositions) {
  for (const partyKey in labelPositions) {
    let color = metadata[partyKey].color || 0xffffff;
    let label = metadata[partyKey].label || partyKey;
    var textmesh = generateTextSprite(label, { borderColor: color });

    textmesh.position.x =
      labelPositions[partyKey].radius *
      9 * 
      Math.sin(labelPositions[partyKey].angle);
    textmesh.position.y = labelPositions[partyKey].position.y * 7; 
    textmesh.position.z =
      labelPositions[partyKey].radius *
      8 * 
      Math.cos(labelPositions[partyKey].angle);
    textmesh.rotation.z = Math.PI / 2;

    textlabels.push(textmesh);
  }

  return textlabels;
}

const animate = function () {
  stats.begin();
  renderPass.camera = camera;
  requestAnimationFrame(animate);

  let cameraHasChanged = false;  
  camera.matrixWorld.elements.forEach((v, i) => {
    if (cameraMatrixOldValues.length > 0 && v != cameraMatrixOldValues[i]) {
      cameraHasChanged = true;
    }
  });

  if (params.droneCamera) {
    cameraHasChanged = droneCameraControl.update();
  } else {
    controls.update();
  }

  if (cameraHasChanged || !params.antialias) {
    renderer.render(scene, camera);
  } else {
    composer.render();
  }
  
  cameraMatrixOldValues = [];
  camera.matrixWorld.elements.forEach((element) => {
    cameraMatrixOldValues.push(element);
  });

  stats.end();
};

async function loadFiles() {
  const nodeFilePrefix = "/nodes/dataset_";
  const edgeFilePrefix = "/edges/dataset_";

  const edgeFileSuffix = ".csv";
  const nodeFileSuffix = "_FR.csv";
  fileKeys = Object.keys(metadata);
  const subgraphs = [];
  let i = 0;

  for (const key of fileKeys) {
    const subgraph = new Subgraph(i, key);
    const nodeFile = nodeFilePrefix + key + nodeFileSuffix;
    const nodes = await loadCSV(nodeFile);
    subgraph.setNodes(nodes);
    const edgeFile = edgeFilePrefix + key + edgeFileSuffix;
    const edges = await loadCSV(edgeFile);
    subgraph.setEdges(edges);
    
    subgraphs.push(subgraph);
    i++;
  }

  const crossingEdges = await loadCSV(edgeFilePrefix + "crossing" + edgeFileSuffix);

  return { subgraphs, crossingEdges };
}

async function prepareData() {
  // para los nodos hay un array por partido politico
  // para las aristas hay un array por partido politico + uno para las aristas que cruzan
  const { subgraphs, crossingEdges } = await loadFiles();
  // TODO: set angles to each subgraph depending on its size
  return new Graph(subgraphs, crossingEdges, metadata);
}

function validateData() {
  // if all keys are missing a color definition, it assigns randomly
  // if some keys are missing a color definition, it assigns white
  const missingKeyColor = Object.values(metadata).every(property => !property.color);
  if (missingKeyColor) {
    const numColors = Object.keys(metadata).length;
    const red = new THREE.Color("#FF0000");
		const blue = new THREE.Color("#0000FF");
		const colors = [];
		
		colors.push(red);
		for (let j = 1; j <= numColors - 2; j++) {
			const hue = (j / (numColors - 1)) * 0.7;
			const saturation = 1.0;
			const lightness = 0.5;
			colors.push(new THREE.Color().setHSL(hue, saturation, lightness));
		}
		colors.push(blue);
    let i = 0;
    for (const key in metadata) {
      metadata[key].color = `#${colors[i].getHexString()}`;
      i += 1;
    }
  }
  // TODO: if missing data.json, obtain keys from dataset filenames
}

setup();
createUI();
validateData();
prepareData()
  .then((G) => {
    graph = G;
    updateGraph();
    animate();
  })
  .catch((e) => console.log(e));
