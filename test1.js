// // Importar la biblioteca three.js
// import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// import * as dat from "dat.gui";
// import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";

// // Inicializar la escena, la cámara y el renderizador
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(
//   75,
//   window.innerWidth / window.innerHeight,
//   0.1,
//   10000
// );
// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// // Añadir controles de órbita
// const controls = new OrbitControls(camera, renderer.domElement);
// camera.position.set(1000, 1000, 1000);

// const RANGE = 800;

// //LIO

// window.cylinderCount = 10;
// window.cylinderMultiplier = 1;

// window.SphereCount = 10;
// window.SphereMultiplier = 1;

// let nodes = [];

// function createInstancedSpheres(count) {
//   console.log("cantidad instanciada:" + count);

//   const sphereGeometry = new THREE.SphereGeometry(10, 20, 10);
//   sphereGeometry.translate(0, 5, 0);

//   const instancedSphereGeometry = new THREE.InstancedBufferGeometry();

//   instancedSphereGeometry.copy(sphereGeometry);

//   const material = new THREE.MeshNormalMaterial();

//   const instancedSpheres = new THREE.InstancedMesh(
//     instancedSphereGeometry,
//     material,
//     count
//   );

//   const translationMatrix = new THREE.Matrix4();
//   const matrix = new THREE.Matrix4();

//   for (let i = 0; i < count; i++) {
//     let position = new THREE.Vector3(
//       (Math.random() - 0.5) * RANGE,
//       (Math.random() - 0.5) * RANGE,
//       (Math.random() - 0.5) * RANGE
//     );

//     nodes.push(position);

//     translationMatrix.makeTranslation(position.x, position.y, position.z);

//     matrix.identity();
//     matrix.premultiply(translationMatrix);

//     instancedSpheres.setMatrixAt(i, matrix);
//   }
//   return instancedSpheres;
// }

// // Crear geometría instanciada de cilindros
// function createInstancedCylinders(count) {
//   // Crear la geometría instanciada de cilindros
//   console.log("cantidad instanciada:" + count);

//   const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1, true);
//   // desplazo 0.5 en y para que el Origen este en la tapa inferior
//   cylinderGeometry.translate(0, 0.5, 0);
//   //Esto es clave, la geometria tiene que estar alineada con el eje -Z
//   // porque el lookAt apunta el -z en la direccion del target
//   cylinderGeometry.rotateX(-Math.PI / 2);

//   const instancedCylinderGeometry = new THREE.InstancedBufferGeometry();

//   instancedCylinderGeometry.copy(cylinderGeometry);

//   // Crear el material y el objeto InstancedMesh
//   const material = new THREE.MeshNormalMaterial();

//   const instancedCylinders = new THREE.InstancedMesh(
//     instancedCylinderGeometry,
//     material,
//     count
//   );

//   // Crear matrices de transformación aleatorias para cada instancia
//   const rotMatrix = new THREE.Matrix4();
//   const translationMatrix = new THREE.Matrix4();
//   const matrix = new THREE.Matrix4();

//   // orientamos y posicionamos cada instancia
//   for (let i = 0; i < count; i++) {
//     // Selecciona dos nodos diferentes al azar de la lista de nodos
//     let indexInicio = Math.floor(Math.random() * nodes.length);
//     let indexFinal = Math.floor(Math.random() * nodes.length);

//     // Asegurarse de que los índices no sean iguales
//     while (indexFinal === indexInicio) {
//       indexFinal = Math.floor(Math.random() * nodes.length);
//     }

//     let position = nodes[indexInicio];
//     let target = nodes[indexFinal];

//     translationMatrix.makeTranslation(position.x, position.y, position.z);

//     rotMatrix.lookAt(position, target, new THREE.Vector3(0, 1, 0));

//     // calculo distancia entre position y target
//     let length = position.distanceTo(target);

//     matrix.identity();
//     matrix.makeScale(1, 1, length);
//     matrix.premultiply(rotMatrix);
//     matrix.premultiply(translationMatrix);

//     instancedCylinders.setMatrixAt(i, matrix);
//   }

//   return instancedCylinders;
// }

// const axesHelper = new THREE.AxesHelper(100);
// scene.add(axesHelper);

// // Configurar la cámara
// camera.position.z = 5;

// let instancedCylinders;
// let instancedSpheres;

// // Configurar el menú Dat.GUI
// const guiCylinders = new dat.GUI();
// const guiSpheres = new dat.GUI();
// guiCylinders
//   .add(window, "cylinderMultiplier", 1, 7)
//   .step(1)
//   .name("cylinder cant 10^x")
//   .onChange(updateCylinders);

// guiSpheres
//   .add(window, "SphereMultiplier", 1, 7)
//   .step(1)
//   .name("sphere cant 10^x")
//   .onChange(updateSpheres);

// function updateCylinders() {
//   window.cylinderCount = Math.pow(10, window.cylinderMultiplier);
//   scene.remove(instancedCylinders);
//   instancedCylinders = createInstancedCylinders(window.cylinderCount);
//   scene.add(instancedCylinders);
// }

// function updateSpheres() {
//   window.SphereCount = Math.pow(10, window.SphereMultiplier);
//   scene.remove(instancedSpheres);
//   instancedSpheres = createInstancedSpheres(window.SphereCount);
//   scene.add(instancedSpheres);
// }

// var stats = new Stats();
// stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild(stats.dom);

// updateSpheres();
// updateCylinders();

// // Función de animación
// const animate = function () {
//   stats.begin();
//   requestAnimationFrame(animate);

//   // Actualizar los controles de órbita
//   controls.update();

//   // Renderizar la escena
//   renderer.render(scene, camera);
//   stats.end();
// };

// // Llamar a la función de animación
// animate();

// Importar la biblioteca three.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat.gui";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";
import { loadCSV } from "./utils.js"; // Ensure this path is correct

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

// Añadir controles de órbita
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(1000, 1000, 1000);

const RANGE = 800;

let nodes = new Map();
let edges = [];

// Function to create nodes
function createInstancedSpheres(count) {
  console.log("cantidad instanciada:" + count);

  const sphereGeometry = new THREE.SphereGeometry(10, 20, 10);
  sphereGeometry.translate(0, 5, 0);

  const instancedSphereGeometry = new THREE.InstancedBufferGeometry();
  instancedSphereGeometry.copy(sphereGeometry);

  const material = new THREE.MeshNormalMaterial();
  const instancedSpheres = new THREE.InstancedMesh(
    instancedSphereGeometry,
    material,
    count
  );

  const translationMatrix = new THREE.Matrix4();
  const matrix = new THREE.Matrix4();

  for (let i = 0; i < count; i++) {
    let position = new THREE.Vector3(
      (Math.random() - 0.5) * RANGE,
      (Math.random() - 0.5) * RANGE,
      (Math.random() - 0.5) * RANGE
    );

    nodes.set(i, position);

    translationMatrix.makeTranslation(position.x, position.y, position.z);

    matrix.identity();
    matrix.premultiply(translationMatrix);

    instancedSpheres.setMatrixAt(i, matrix);
  }
  scene.add(instancedSpheres);
}

// Function to create edges
function createInstancedCylinders(count) {
  console.log("cantidad instanciada:" + count);

  const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1, true);
  cylinderGeometry.translate(0, 0.5, 0);
  cylinderGeometry.rotateX(-Math.PI / 2);

  const instancedCylinderGeometry = new THREE.InstancedBufferGeometry();
  instancedCylinderGeometry.copy(cylinderGeometry);

  const material = new THREE.MeshNormalMaterial();
  const instancedCylinders = new THREE.InstancedMesh(
    instancedCylinderGeometry,
    material,
    count
  );

  const rotMatrix = new THREE.Matrix4();
  const translationMatrix = new THREE.Matrix4();
  const matrix = new THREE.Matrix4();

  edges.forEach((edge) => {
    let position = nodes.get(edge.source);
    let target = nodes.get(edge.target);

    translationMatrix.makeTranslation(position.x, position.y, position.z);

    rotMatrix.lookAt(position, target, new THREE.Vector3(0, 1, 0));

    let length = position.distanceTo(target);

    matrix.identity();
    matrix.makeScale(1, 1, length);
    matrix.premultiply(rotMatrix);
    matrix.premultiply(translationMatrix);

    instancedCylinders.setMatrixAt(edge.index, matrix);
  });

  scene.add(instancedCylinders);
}

// Load and process CSV data
loadCSV("sample_1.csv")
  .then((edgesData) => {
    let count = 0;
    edgesData.forEach((edge, index) => {
      if (index === 0) {
        console.log("First row keys:", Object.keys(edge));
      }

      const node1 = parseInt(edge.node_1);
      const node2 = parseInt(edge.node_2);

      if (!Number.isNaN(node1) && !Number.isNaN(node2)) {
        if (!nodes.has(node1)) {
          nodes.set(
            node1,
            new THREE.Vector3(
              Math.random() * RANGE,
              Math.random() * RANGE,
              Math.random() * RANGE
            )
          );
        }
        if (!nodes.has(node2)) {
          nodes.set(
            node2,
            new THREE.Vector3(
              Math.random() * RANGE,
              Math.random() * RANGE,
              Math.random() * RANGE
            )
          );
        }
        edges.push({ source: node1, target: node2, index: count++ });
      } else {
        console.log("Invalid edge data at index", index, edge);
      }
    });

    console.log("Total nodes created:", nodes.size);
    console.log("Total edges created:", edges.length);

    createInstancedSpheres(nodes.size);
    createInstancedCylinders(edges.length);
  })
  .catch((error) => {
    console.error("Error loading CSV:", error);
  });

const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);

camera.position.z = 5;

var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const animate = function () {
  stats.begin();
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  stats.end();
};

animate();
