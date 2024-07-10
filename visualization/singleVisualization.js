import * as THREE from "three";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { GraphMeshBuilder } from "./graph/graphMeshBuilder.js";
import { Graph } from "./graph/graph.js";
import initialMetadata from "/data/data.json" assert { type: "json" };
import { AnimationController } from "./controllers/animationController.js";
import { validateMetadata, loadFiles } from "./dataManager.js";

let scene,
  sceneElements = new THREE.Group(),
  stats,
  nodes,
  edges,
  graph,
  textlabels = [],
  animationController,
  metadata = initialMetadata;

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
  animationController = new AnimationController(scene, [0, 22000, 0]);
  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
  window.addEventListener("resize", onResize);
}

function onResize() {
  animationController.setSize(window.innerWidth, window.innerHeight);
}

function createUI() {
  const gui = new dat.GUI({hideable: false});
  gui.add(params, "antialias")
    .name("antialias")
  gui
    .add(params, "droneCamera")
    .name("drone view")
    .onChange((v) => {
      animationController.switchCamera(sceneElements);
      changeButtonsVisibility(v);
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
  /*gui
    .add(params, "spiralSwitch")
    .name("constant radius")
    .onChange((v) => {
      graph.updateConstantRadius(v);
      updateGraph();
    });*/
  gui
    .add(params, "subgraphSeparation", 0, 5)
    .name("separation between subgraphs")
    .step(0.1)
    .onChange((v) => {
      graph.updateSeparation(v);
      updateGraph();
    });
}

function changeButtonsVisibility(visibility) {
  if (isMobile.phone) {
    const visibilityString = visibility ? "visible" : "hidden";
    document.getElementById("translation-buttons").style.visibility = visibilityString;
    document.getElementById("rotation-buttons").style.visibility = visibilityString;
  }
}

function removeAllFromScene() {
  scene.remove(sceneElements);
  sceneElements.remove(edges);
  sceneElements.remove(nodes);
  textlabels.forEach((label) => sceneElements.remove(label));
}

function addAllToScene() {
  sceneElements.add(edges);
  sceneElements.add(nodes);
  textlabels.forEach((label) => sceneElements.add(label));
  scene.add(sceneElements);
}

function updateGraph() {
  removeAllFromScene();
  let gmb = new GraphMeshBuilder(graph);
  edges = gmb.createEdges();
  nodes = gmb.createNodes();
  textlabels = graph.getPositionLabels();
  addAllToScene();
}

const animate = function () {
  stats.begin();
  animationController.setCameraToRenderer();
  requestAnimationFrame(animate);
  animationController.render(scene, params.antialias)
  stats.end();
};

async function prepareData() {
  const fileKeys = Object.keys(metadata);
  const { subgraphs, crossingEdges } = await loadFiles(fileKeys);

  return new Graph(subgraphs, crossingEdges, metadata);
}

setup();
createUI();
metadata = validateMetadata(initialMetadata);
prepareData()
  .then((G) => {
    G.distributePositions();
    graph = G;
    updateGraph();
    animate();
  })
  .catch((e) => console.log(e));