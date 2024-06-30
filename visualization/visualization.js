import * as THREE from "three";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { GraphMeshBuilder } from "./graph/graphMeshBuilder.js";
import { Graph } from "./graph/graph.js";
import initialMetadata_A from "/data/data_A.json" assert { type: "json" };
import initialMetadata_B from "/data/data_B.json" assert { type: "json" };
import { AnimationController } from "./controllers/animationController.js";
import { validateMetadata, loadFiles } from "./dataManager.js";
import { BipartiteGraph } from "./graph/bipartiteGraph.js";

let scene,
  sceneElements = new THREE.Group(),
  graphAElements = new THREE.Group(),
  graphBElements = new THREE.Group(),
  nodesA,
  nodesB,
  textlabelsA =[],
  textlabelsB=[],
  stats,
  nodes,
  edges,
  graph,
  textlabels = [],
  animationController,
  metadata = {
    A: initialMetadata_A,
    B: initialMetadata_B
  };

const params = {
  emissionFactor: 0.3,
  spiralSteps: 1,
  spiralRounds: 1,
  subgraphSeparation: 2,
  spiralSwitch: true,
  droneCamera: false,
  antialias: false,
  showLabels: true,
};

function setup() {
  scene = new THREE.Scene();
  animationController = new AnimationController(scene);
  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
  window.addEventListener("resize", onResize);
}

function onResize() {
  animationController.setSize(window.innerWidth, window.innerHeight);
}

function createUI() {
  const gui = new dat.GUI();
  gui.add(params, "antialias")
    .name("antialias")
  gui
    .add(params, "droneCamera")
    .name("drone view")
    .onChange((v) => {
      animationController.switchCamera(sceneElements);
      changeButtonsVisibility(v);
    });
  /*gui
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
    });*/
  gui
    .add(params, "subgraphSeparation", 0, 5)
    .name("separation between subgraphs")
    .step(0.1)
    .onChange((v) => {
      graph.updateSeparation(v);
      updateGraph();
    });
  gui
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
}

function changeButtonsVisibility(visibility) {
  if (isMobile.apple.phone || isMobile.android.phone) {
    const visibilityString = visibility ? "visible" : "hidden";
    document.getElementById("translation-buttons").style.visibility = visibilityString;
    document.getElementById("rotation-buttons").style.visibility = visibilityString;
  }
}

function removeAllFromScene() {
  sceneElements.remove(edges);
  //sceneElements.remove(nodes)
  //textlabels.forEach((label) => sceneElements.remove(label));
  graphAElements.remove(nodesA)
  textlabelsA.forEach((label) => graphAElements.remove(label));

  graphBElements.remove(nodesB)
  textlabelsB.forEach((label) => graphBElements.remove(label));
  
  sceneElements.remove(graphAElements)
  sceneElements.remove(graphBElements)
  scene.remove(sceneElements);
}

function addAllToScene() {
  sceneElements.add(edges);
  //sceneElements.add(nodes);
  //textlabels.forEach((label) => sceneElements.add(label));
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
  //edges = gmb.createEdges();
  nodesA = gmb.createNodes();
  textlabelsA = graph.getPositionLabelsA();

  gmb = new GraphMeshBuilder(graph.getGraphB());
  nodesB = gmb.createNodes();
  textlabelsB = graph.getPositionLabelsB();

  //gmb = new GraphMeshBuilder(graph);
  //edges = gmb.createEdges();

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
  let fileKeys = Object.keys(metadata.A);
  const A = await loadFiles(fileKeys, "_A");
  //metadata.A["x-offset"] = -1000;
  const graph_A = new Graph(A.subgraphs, A.crossingEdges, metadata.A);
  fileKeys = Object.keys(metadata.B);
  const B = await loadFiles(fileKeys, "_B");
  //metadata.B["x-offset"] = 1000;
  const graph_B = new Graph(B.subgraphs, B.crossingEdges, metadata.B);

  const bGraph = new BipartiteGraph(graph_A, graph_B);
  //bGraph.createCrossingEdges(A.crossingEdges, B.crossingEdges);

  return bGraph;
}

setup();
createUI();
metadata.A = validateMetadata(initialMetadata_A);
metadata.B = validateMetadata(initialMetadata_B);
prepareData()
  .then((G) => {
    graph = G;
    updateGraph();
    animate();
    graphAElements.position.x = graphAElements.position.x - 3500;
    graphAElements.rotateY(Math.PI/2)
    graphBElements.position.x = graphBElements.position.x + 4000;
    graphBElements.position.y = graphBElements.position.y + 1000;
    graphBElements.position.z = graphBElements.position.z + 2000;
    //graphBElements.rotateX(-Math.PI)
  })
  .catch((e) => console.log(e));
