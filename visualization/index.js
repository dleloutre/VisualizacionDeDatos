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
import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js';
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { DroneCameraControl } from "./droneCamera.js";
import partiesData from "/data/parties.json" assert { type: "json" };

let scene,
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
  renderPassOrbital,
  renderPassDrone,
  composerOrbital,
  composerDrone,
  cameraMatrixOldValues = [],
  clock;

const params = {
  emissionFactor: 0.3,
  waveOffset: -3,
  spiralSteps: 1,
  spiralRounds: 1,
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
  //renderer.toneMapping = THREE.NoToneMapping;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const size = renderer.getDrawingBufferSize(new THREE.Vector2());

  const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
    samples: 5,
    type: THREE.FloatType,
  });

  renderPassOrbital = new SSAARenderPass(scene, orbitalCamera);
  renderPassOrbital.clearColor = new THREE.Color(0x000000); 
  renderPassOrbital.clearAlpha = 1; 
  renderPassOrbital.sampleLevel = 4; 
  renderPassOrbital.unbiased = true;

  renderPassDrone = new SSAARenderPass(scene, droneCamera);
  renderPassDrone.clearColor = new THREE.Color(0x000000); 
  renderPassDrone.clearAlpha = 1; 
  renderPassDrone.sampleLevel = 4; 
  renderPassDrone.unbiased = true;

  //const outputPass = new OutputPass();
  //composer = new EffectComposer(renderer, renderTarget);
  //composer.addPass(renderPassOrbital);
  //composer.addPass(outputPass);

  composerOrbital = new EffectComposer(renderer, renderTarget);
  composerOrbital.addPass(renderPassOrbital);
  composerOrbital.addPass(new OutputPass());

  composerDrone = new EffectComposer(renderer, renderTarget);
  composerDrone.addPass(renderPassDrone);
  composerDrone.addPass(new OutputPass());

  composer = composerOrbital;

  controls = new OrbitControls(orbitalCamera, renderer.domElement);
  droneCameraControl = new DroneCameraControl(droneCamera);

  // Semicircle layout: camera.position.set(0, 500, 2500)
  // Circle layout: camera.position.set(0, 3000, 0);
  // Spiral layout:
  orbitalCamera.position.set(0, 19000, 0);

  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

  const gridHelper = new THREE.GridHelper(100000, 100);
  scene.add(gridHelper)

  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  window.addEventListener("resize", onResize);

  clock = new THREE.Clock();
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
        composer = composerDrone;
        changeButtonsVisibility("visible");
      } else {
        camera = orbitalCamera;
        composer = composerOrbital;
        changeButtonsVisibility("hidden");
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
    .add(params, "waveOffset", -3, 3)
    .name("wave offset")
    .step(0.01)
    .onChange((v) => {
      edges.material.uniforms.waveOffset.value = v;
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
    scene.remove(label);
  }
  textlabels = [];
  const labelPositions = graph.getLabels();
  console.log("labels", labelPositions);

  textlabels = positionLabels(labelPositions);

  for (const label of textlabels) {
    scene.add(label);
  }
}

function positionLabels(labelPositions) {
  for (const partyKey of Object.keys(labelPositions)) {
    let color = partiesData[partyKey].color || 0xffffff;
    let label = partiesData[partyKey].label || "Unknown";
    var textmesh = generateTextSprite(label, { borderColor: color });

    textmesh.position.x =
      labelPositions[partyKey].radius *
      8 *
      Math.sin(labelPositions[partyKey].angle);
    textmesh.position.y = labelPositions[partyKey].position.y * 7;
    textmesh.position.z =
      labelPositions[partyKey].radius *
      6 *
      Math.cos(labelPositions[partyKey].angle);
    textmesh.rotation.z = Math.PI / 2;

    textlabels.push(textmesh);
  }

  return textlabels;
}

const animate = function () {
  stats.begin();
  //renderPass.camera = camera;
  requestAnimationFrame(animate);

  let cameraHasChanged = false;  
  camera.matrixWorld.elements.forEach((v, i) => {
    if (cameraMatrixOldValues.length > 0 && v != cameraMatrixOldValues[i]) {
      cameraHasChanged = true;
    }
  });

  if (params.droneCamera) {
    cameraHasChanged = droneCameraControl.update();
    //droneCameraControl.update();
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

  /*if (params.antialias) {
    let cameraHasChanged;
    let time = clock.getDelta();
    if (params.droneCamera) {
      cameraHasChanged = droneCameraControl.update(time);
    } else {
      cameraHasChanged = controls.update(time);
    }
    
    if (cameraHasChanged) {
      renderer.render(scene, camera);
    } else {
      composer.render();
    }
    //composer.render();
  } else {
    renderer.render(scene, camera);
  }*/

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
      const nodesList = await loadCSV(nodeFile);
      nodesInfo.push({
        key: fileKeys[i],
        data: nodesList,
      });
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
    parties: partiesData,
  };
  return new Graph(nodesInfo, edgesInfo, metadata);
}

setup();
createUI();
prepareData()
  .then((G) => {
    graph = G;
    updateGraph();
    animate();
  })
  .catch((e) => console.log(e));
