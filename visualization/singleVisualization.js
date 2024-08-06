import * as THREE from "three";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { GraphMeshBuilder } from "./graph/graphMeshBuilder.js";
import { Graph } from "./graph/graph.js";
import initialMetadata from "/data/data.json" assert { type: "json" };
import { AnimationController } from "./controllers/animationController.js";
import { loadFiles } from "./utils/fileManager.js";

let scene,
  sceneElements = new THREE.Group(),
  stats,
  nodes,
  edges = [],
  animatedEdges,
  graph,
  time = 0,
  textlabels = [],
  animationController,
  metadata = initialMetadata,
  gui = new dat.GUI({ hideable: false });

const params = {
  emissionFactor: 0.3,
  spiralSteps: 1,
  spiralRounds: 1,
  subgraphSeparation: 2,
  spiralSwitch: true,
  droneCamera: false,
  antialias: false,
  animation: false,
  showAllEdges: true,
  time: 0
};

function setup() {
  scene = new THREE.Scene();
  animationController = new AnimationController(scene, [0, 34000, 0]);
  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
  window.addEventListener("resize", onResize);
}

function onResize() {
  animationController.setSize(window.innerWidth, window.innerHeight);
}

function createUI() {
  const animationFolder = gui.addFolder('Animation');
  const layoutFolder = gui.addFolder('Layout');
  const viewFolder = gui.addFolder('View');
  viewFolder.add(params, "antialias")
    .name("antialias")
  viewFolder
    .add(params, "droneCamera")
    .name("drone view")
    .onChange((v) => {
      animationController.switchCamera(sceneElements);
      changeButtonsVisibility(v);
    });
  animationFolder.add(params, "animation")
      .name("play/pause animation");
  layoutFolder
    .add(params, "spiralSteps", 0, 10)
    .name("spiral steps")
    .step(1)
    .onChange((v) => {
      graph.updateSteps(v);
      updateGraph();
    });
  layoutFolder
    .add(params, "spiralRounds", 1, 10)
    .name("spiral rounds")
    .step(1)
    .onChange((v) => {
      graph.updateRounds(v);
      updateGraph();
    });
  layoutFolder
    .add(params, "subgraphSeparation", 0, 5)
    .name("separation between subgraphs")
    .step(0.1)
    .onChange((v) => {
      graph.updateSeparation(v);
      updateGraph();
    });
  viewFolder.add(params, "showAllEdges")
      .name("show all edges")
      .onChange((v) => {
        updateGraph();
      });
  animationFolder
      .add(params, "time", 0, 30)
      .name("time")
      .step(1)
      .onChange((v) => {
        time = v;
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
  sceneElements.remove(animatedEdges);
  sceneElements.remove(nodes);
  textlabels.forEach((label) => sceneElements.remove(label));
}

function addAllToScene() {
  if (params.showAllEdges) sceneElements.add(edges);
  sceneElements.add(animatedEdges);
  sceneElements.add(nodes);
  textlabels.forEach((label) => sceneElements.add(label));
  scene.add(sceneElements);
}

function updateGraph() {
  removeAllFromScene();
  let gmb = new GraphMeshBuilder(graph);
  if (params.showAllEdges) {
    edges = gmb.createNonAnimatedEdges();
  }
  animatedEdges = gmb.createdAnimatedEdges();
  nodes = gmb.createNodes();
  textlabels = graph.getPositionLabels();
  addAllToScene();
}

const animate = function () {
  stats.begin();
  animationController.setCameraToRenderer();
  requestAnimationFrame(animate);
  animatedEdges.material.uniforms.time.value = time;
  nodes.material.uniforms.time.value = time;

  animationController.render(scene, params.antialias);
  if (params.animation) {
    time += 0.03;
    params.time = time;
    gui.updateDisplay();
  }
  if (time > 30) time = 0;
  stats.end();
};

async function prepareData() {
  const fileKeys = Object.keys(metadata);
  const { subgraphs, crossingEdges } = await loadFiles(fileKeys);

  return new Graph(subgraphs, crossingEdges, metadata);
}

setup();
createUI();
prepareData()
  .then((G) => {
    G.distributePositions();
    graph = G;
    updateGraph();
    animate();
  })
  .catch((e) => console.log(e));