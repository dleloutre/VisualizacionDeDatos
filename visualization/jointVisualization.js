import * as THREE from "three";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { GraphMeshBuilder } from "./graph/graphMeshBuilder.js";
import { Graph } from "./graph/graph.js";
import initialMetadata_A from "/data/data_A.json" assert { type: "json" };
import initialMetadata_B from "/data/data_B.json" assert { type: "json" };
import { AnimationController } from "./controllers/animationController.js";
import { loadFiles } from "./utils/fileManager.js";
import { BipartiteGraph } from "./graph/bipartiteGraph.js";

let scene,
  sceneElements = new THREE.Group(),
  graphAElements = new THREE.Group(),
  graphBElements = new THREE.Group(),
  nodesA,
  nodesB,
  textlabelsA = [],
  textlabelsB = [],
  stats,
  edges = [],
  animatedEdges,
  graph,
  animationController,
  metadata = {
    A: initialMetadata_A,
    B: initialMetadata_B
  },
  time = 0,
  gui = new dat.GUI({ hideable: false });

const params = {
  subgraphSeparation: 1,
  droneCamera: false,
  antialias: false,
  showLabels: true,
  animation: false,
  showAllEdges: true,
  time: 0
};

function setup() {
  scene = new THREE.Scene();
  animationController = new AnimationController(scene, [0, 12000, 15000]);
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
  layoutFolder
    .add(params, "subgraphSeparation", 0, 5)
    .name("separation between subgraphs")
    .step(0.1)
    .onChange((v) => {
      graph.updateSeparation(v);
      updateGraph();
    });
  viewFolder
    .add(params, "showLabels")
    .name("show labels")
    .onChange((v) => {
      if (v) {
        textlabelsA.forEach((label) => graphAElements.add(label));
        textlabelsB.forEach((label) => graphBElements.add(label));
      } else {
        textlabelsA.forEach((label) => graphAElements.remove(label));
        textlabelsB.forEach((label) => graphBElements.remove(label));
      }
    });
  viewFolder.add(params, "showAllEdges")
      .name("show all edges")
      .onChange((_v) => {
        updateGraph();
      });
  animationFolder
      .add(params, "time", 0, 30)
      .name("time")
      .step(1)
      .onChange((v) => {
        time = v;
      });
  animationFolder.add(params, "animation")
      .name("play/pause animation");
}

function changeButtonsVisibility(visibility) {
  if (isMobile.phone) {
    const visibilityString = visibility ? "visible" : "hidden";
    document.getElementById("translation-buttons").style.visibility = visibilityString;
    document.getElementById("rotation-buttons").style.visibility = visibilityString;
  }
}

function removeAllFromScene() {
  sceneElements.remove(edges);
  sceneElements.remove(animatedEdges);
  graphAElements.remove(nodesA)
  textlabelsA.forEach((label) => graphAElements.remove(label));

  graphBElements.remove(nodesB)
  textlabelsB.forEach((label) => graphBElements.remove(label));
  
  sceneElements.remove(graphAElements)
  sceneElements.remove(graphBElements)
  scene.remove(sceneElements);
}

function addAllToScene() {
  if (params.showAllEdges) sceneElements.add(edges);
  sceneElements.add(animatedEdges);
  graphAElements.add(nodesA)
  graphBElements.add(nodesB)

  if (params.showLabels) {
    textlabelsA.forEach((label) => graphAElements.add(label));
    textlabelsB.forEach((label) => graphBElements.add(label));
  }

  sceneElements.add(graphAElements)
  sceneElements.add(graphBElements)
  scene.add(sceneElements);
}

function updateGraph() {
  removeAllFromScene();
  let gmb = new GraphMeshBuilder(graph.getGraphA());
  nodesA = gmb.createNodes();
  textlabelsA = graph.getPositionLabelsA();

  gmb = new GraphMeshBuilder(graph.getGraphB());
  nodesB = gmb.createNodes();
  textlabelsB = graph.getPositionLabelsB();

  gmb = new GraphMeshBuilder(graph);
  if (params.showAllEdges) {
    edges = gmb.createNonAnimatedEdges();
  }
  animatedEdges = gmb.createdAnimatedEdges();

  addAllToScene();
}

const animate = function () {
  stats.begin();
  animationController.setCameraToRenderer();
  requestAnimationFrame(animate);
  animatedEdges.material.uniforms.time.value = time;
  nodesA.material.uniforms.time.value = time;
  nodesB.material.uniforms.time.value = time;

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
  let fileKeys = Object.keys(metadata.A);
  const A = await loadFiles(fileKeys, "_A", true);
  const graph_A = new Graph(A.subgraphs, null, metadata.A);
  fileKeys = Object.keys(metadata.B);
  const B = await loadFiles(fileKeys, "_B", true);
  const graph_B = new Graph(B.subgraphs, null, metadata.B);
  const bGraph = new BipartiteGraph(graph_A, graph_B);
  bGraph.createCrossingEdges(A.crossingEdges, B.crossingEdges);

  return bGraph;
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
