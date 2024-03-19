//------------------------------------------------------------------------------------------------------------
//-------------------------Visualizacion de aristas con posiciones de nodos por fuerzas-----------------------
//------------------------------------------------------------------------------------------------------------

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "stats.js";
import { loadCSV } from "./utils.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 100);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

async function loadData() {
  const nodesData = await loadCSV(
    "mcgs_reduced_hidalgo_node_positions_scaled.csv",
    ","
  );
  const edgesData = await loadCSV("mcgs_reduced_hidalgo.csv", ";");

  var contador = 0;
  nodesData.forEach((node) => {
    console.log("node", node);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphere = new THREE.Mesh(sphereGeometry, material);
    sphere.position.set(
      parseFloat(node[1]),
      parseFloat(node[2]),
      parseFloat(node[3])
    );
    scene.add(sphere);
    contador++;
  });

  edgesData.forEach((edge) => {
    //const node1 = nodesData.find((node) => node.node_id === edge.node_1);
    //const node2 = nodesData.find((node) => node.node_id === edge.node_2);

    console.log("edge: " + edge);
    console.log("edge 1: " + edge[0]);
    console.log("edge 2: " + edge[1]);

    const node1 = nodesData.find((node) => node[0] == edge[0]);
    const node2 = nodesData.find((node) => node[0] == edge[1]);
    console.log("arista_" + node1 + "_" + node2);

    if (node1 && node2) {
      console.log("hola");
      const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
      const points = [];
      points.push(
        new THREE.Vector3(
          parseFloat(node1[1]),
          parseFloat(node1[2]),
          parseFloat(node1[3])
        )
      );
      points.push(
        new THREE.Vector3(
          parseFloat(node2[1]),
          parseFloat(node2[2]),
          parseFloat(node2[3])
        )
      );
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      scene.add(line);
    }
  });
}

loadData().catch(console.error);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  renderer.render(scene, camera);
}

animate();
