// Importar la biblioteca three.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { loadCSV } from "./utils.js";

// Inicializar la escena, la cámara y el renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Añadir controles de órbita
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(20, 20, 20);

const material = new THREE.MeshNormalMaterial();

const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 3, 1);
cylinderGeometry.translate(0, 0.5, 0);
cylinderGeometry.rotateX(-Math.PI / 2);
//LIO
let cylinder = new THREE.Mesh(cylinderGeometry, material);

// Crear el material y el objeto InstancedMesh

const axesHelper2 = new THREE.AxesHelper(2);
cylinder.add(axesHelper2);

scene.add(cylinder);

const geometry = new THREE.SphereGeometry(1, 32, 16);
const material2 = new THREE.MeshPhongMaterial({ color: 0xffff00 });
const targetMesh = new THREE.Mesh(geometry, material2);

scene.add(targetMesh);

const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

const size = 10;
const divisions = 10;

const gridHelper = new THREE.GridHelper(size, divisions);
scene.add(gridHelper);
var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

let params = {
  alfa: 0,
  beta: 0,
};

const gui = new dat.GUI();
gui
  .add(params, "alfa", 0, 2 * Math.PI)
  .step(0.001)
  .onChange((v) => {
    updateTransform();
  });

gui
  .add(params, "beta", -Math.PI / 2, Math.PI / 2)
  .step(0.001)
  .onChange((v) => {
    updateTransform();
  });

let origin = new THREE.Vector3();

function updateTransform() {
  console.log("updateTransform() ");
  // Crear matrices de transformación aleatorias para cada instancia
  const rotMatrix = new THREE.Matrix4();
  const translationMatrix = new THREE.Matrix4();
  const matrix = new THREE.Matrix4();

  let target = new THREE.Vector3(
    length * Math.cos(params.beta) * Math.cos(params.alfa),
    length * Math.sin(params.beta),
    length * Math.cos(params.beta) * Math.sin(params.alfa)
  );

  rotMatrix.lookAt(origin, target, new THREE.Vector3(0, 1, 0));

  length = 10;

  matrix.identity();
  matrix.makeScale(1, 1, length);
  matrix.premultiply(rotMatrix);

  cylinder.matrixAutoUpdate = false;
  cylinder.matrix.copy(matrix);

  targetMesh.position.copy(target);
}

updateTransform();

// Función de animación
const animate = function () {
  stats.begin();
  requestAnimationFrame(animate);

  // Actualizar los controles de órbita
  controls.update();

  // Renderizar la escena
  renderer.render(scene, camera);
  stats.end();
};

// Llamar a la función de animación
animate();
