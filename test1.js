// Importar la biblioteca three.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js";

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

const RANGE=800;

window.cylinderCount = 10;
window.cylinderMultiplier = 4;

// Crear geometría instanciada de cilindros
function createInstancedCylinders(count) {
	// Crear la geometría instanciada de cilindros
	console.log("cantidad instanciada:"+count)

	const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1,true);
	// desplazo 0.5 en y para que el Origen este en la tapa inferior
	cylinderGeometry.translate(0,0.5,0);
	//Esto es clave, la geometria tiene que estar alineada con el eje -Z
	// porque el lookAt apunta el -z en la direccion del target
    cylinderGeometry.rotateX(-Math.PI/2)

	const instancedCylinderGeometry = new THREE.InstancedBufferGeometry();  

	instancedCylinderGeometry.copy(cylinderGeometry);

	// Crear el material y el objeto InstancedMesh
	const material = new THREE.MeshNormalMaterial();

	const instancedCylinders = new THREE.InstancedMesh(
		instancedCylinderGeometry,
		material,
		count
	);

	// Crear matrices de transformación aleatorias para cada instancia
	const rotMatrix = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();  
	const matrix = new THREE.Matrix4();

	let origin=new THREE.Vector3();

	// orientamos y posicionamos cada instancia
	for (let i = 0; i < count; i++) {
		
		// la arista va desde position hasta target
		
		// elijo una posicion al azar
		let position=new THREE.Vector3(
			(Math.random()-0.5)*RANGE,
			(Math.random()-0.5)*RANGE,
			(Math.random()-0.5)*RANGE 
		)

		// elijo un target al azar
		let target=new THREE.Vector3(
			(Math.random()-0.5)*RANGE,
			(Math.random()-0.5)*RANGE,
			(Math.random()-0.5)*RANGE 
		)

		
		translationMatrix.makeTranslation(position);
		
		// determina un direccion entre 0,0,0 y target
		rotMatrix.lookAt(origin,target,new THREE.Vector3(0,1,0))


		// calculo distancia entre position y target
		length=(target.sub(position)).length()

		matrix.identity();
		matrix.makeScale(1,1,length);
		matrix.premultiply(rotMatrix)
		matrix.premultiply(translationMatrix);

		instancedCylinders.setMatrixAt(i, matrix);
	}

	return instancedCylinders;
}

const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);

// Configurar la cámara
camera.position.z = 5;

let instancedCylinderGeometry;
let instancedCylinders;
// Configurar el menú Dat.GUI
const gui = new dat.GUI();
gui
	.add(window, "cylinderMultiplier", 1, 7)
	.step(1)
	.name("cant 10^x")
	.onChange(updateCylinders);

function updateCylinders() {
	window.cylinderCount = Math.pow(10, window.cylinderMultiplier);
	scene.remove(instancedCylinders);
	instancedCylinders = createInstancedCylinders(window.cylinderCount);
	scene.add(instancedCylinders);
}

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

updateCylinders();

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
