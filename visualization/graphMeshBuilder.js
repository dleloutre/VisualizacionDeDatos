import * as THREE from "three";
import { nodeShader } from "./shaders/nodeShader.js";
import { edgeShader } from "./shaders/edgeShader.js";
// creacion de la geometria de las aristas

export class GraphMeshBuilder {
	constructor(graph) {
		this.graph = graph;
		this.edgesTexture = this._getEdgesTexture();
	}

	_getUnitCylinder() {
		const cylinderGeometry = new THREE.CylinderGeometry(
			0.5,
			0.5,
			1,
			3,
			1,
			true
		);
		// desplazo 0.5 en y para que el Origen este en la tapa inferior
		cylinderGeometry.translate(0, 0.5, 0);
		//Esto es clave, la geometria tiene que estar alineada con el eje -Z
		// porque el lookAt apunta el -z en la direccion del target
		cylinderGeometry.rotateX(-Math.PI / 2);
		return cylinderGeometry;
	}

	_getEdgesTexture() {
		const width = 256;
		const height = 4096;

		const size = width * height;
		const data = new Uint8Array(4 * size);

		let totalStars = this.graph.getTotalStars();

		let i = 0;
		const color1 = new THREE.Color();
		const color2 = new THREE.Color();
		const color = new THREE.Color();
		for (let r = 0; r < height; r++) {
			for (let c = 0; c < width; c++) {
				i++;

				let verticalOffset = r / height;

				// tono del grupo de origen
				let hue1 = Math.floor(verticalOffset * totalStars) / totalStars;
				let hue2 =
					Math.floor(
						(verticalOffset - hue1) * totalStars * totalStars
					) / totalStars;

				color1.setHSL(hue1, 1.0, 0.5);
				color2.setHSL(hue2, 1.0, 0.5);

				let color = color1.lerp(
					color2,
					THREE.MathUtils.smoothstep(c / width, 0.1, 0.9)
				);

				const red = Math.floor(color.r * 255);
				const g = Math.floor(color.g * 255);
				const b = Math.floor(color.b * 255);

				const stride = i * 4;
				data[stride] = red;
				data[stride + 1] = g;
				data[stride + 2] = b;
				data[stride + 3] = 255;
			}
		}

		// used the buffer to create a DataTexture
		const texture = new THREE.DataTexture(data, width, height);
		texture.needsUpdate = true;
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;

		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		return texture;
	}

	_createEdgesMaterial() {
		let texture = this.edgesTexture;

		let mat = new THREE.ShaderMaterial({
			uniforms: {
				color: { value: new THREE.Color(0xffffff) },
				edgeColor: {
					type: "t",
					value: texture,
				},
				waveOffset: { value: -3.0 },
				directionalLightDirection: {
					type: "v3",
					value: new THREE.Vector3(1, 1, 1).normalize(),
				},
				ambientColor: {
					type: "v3",
					value: new THREE.Color(0x666666),
				},
				emissionFactor: { value: 0.3 },
			},
			vertexShader: edgeShader.vertexShader,
			fragmentShader: edgeShader.fragmentShader,
		});

		return mat;
	}

	_createNodesMaterial(nodeSize = 20) {
		let mat = new THREE.ShaderMaterial({
			uniforms: {
				color: { value: new THREE.Color(0xffffff) }, // color de los nodos
				size: { value: nodeSize }, // tamano de los nodos
				diffuseMap: { type: "t", value: this.edgesTexture },
			},
			vertexShader: nodeShader.vertexShader,
			fragmentShader: nodeShader.fragmentShader,
			glslVersion: THREE.GLSL3,
		});
		return mat;
	}

	createEdges(edgesData) {
		// customShaders e InstancedBufferGeometry
		// https://medium.com/@pailhead011/instancing-with-three-js-36b4b62bc127
		// https://medium.com/@pailhead011/instancing-with-three-js-part-2-3be34ae83c57
		// https://medium.com/@pailhead011/instancing-with-three-js-part-3-a3fe15bcee3a

		const totalEdgesToDraw = edgesData.flat().length;
		console.log(
			"createEdgesGeometry() totalEdgedToDraw:" + totalEdgesToDraw
		);

		const instancedEdgeGeometry = new THREE.InstancedBufferGeometry();

		// representa una arista de longitud 1
		instancedEdgeGeometry.copy(this._getUnitCylinder());

		// instancedEdgeGeometry tiene los atributos:
		// position, normal, uv e index
		// posee una sola copia de la geometria de la arista, que se reutiliza para todas las instancias

		// A partir de aca definimos los valores de los atributos para cada instancia

		// atributo que representa la posicion vertical de la arista en la textura de gradientes
		// el valor va de 0.0 a 1.0
		const instanceGradientOffsetArray = new Float32Array(
			totalEdgesToDraw * 1
		);
		const gradientOffsetAttribute = new THREE.InstancedBufferAttribute(
			instanceGradientOffsetArray,
			1,
			true
		);

		// atributo que representa un valor aleatorio para cada arista
		// el valor va de 0.0 a 1.0
		const instanceRandomSeedArray = new Float32Array(totalEdgesToDraw * 1);
		const randomSeedAttribute = new THREE.InstancedBufferAttribute(
			instanceRandomSeedArray,
			1,
			true
		);

		let material = this._createEdgesMaterial();

		// representa el mesh de aristas
		const instancedEdges = new THREE.InstancedMesh(
			instancedEdgeGeometry,
			material,
			totalEdgesToDraw
		);

		// variables auxiliares para definir la matriz de transformacion de cada instancia
		const rotMatrix = new THREE.Matrix4();
		const translationMatrix = new THREE.Matrix4();
		const matrix = new THREE.Matrix4();

		// recorro todas las instancias
		const flatEdges = edgesData.flat();
		for (let j = 0; j < flatEdges.length; j++) {
			// definimos la transformacion de cada instancia
			let res = this.graph.getEdge(flatEdges[j][0], flatEdges[j][1]);
			translationMatrix.makeTranslation(res.origin);

			// determina un direccion entre 0,0,0 y target
			rotMatrix.lookAt(
				res.origin,
				res.target,
				new THREE.Vector3(0, 1, 0)
			);

			// calculo distancia entre origin y target
			length = res.target.sub(res.origin).length();

			matrix.identity();
			matrix.makeScale(1, 1, length);
			matrix.premultiply(rotMatrix);
			matrix.premultiply(translationMatrix);

			instancedEdges.setMatrixAt(j, matrix);

			// defino el valor de gradientOffset y randomSeed para cada instancia
			instanceGradientOffsetArray[j] = res.gradientOffset;
			instanceRandomSeedArray[j] = 4.0;
		}
		

		// agrego los atributos especiales a la geometria
		instancedEdgeGeometry.setAttribute(
			"gradientOffset",
			gradientOffsetAttribute
		);

		instancedEdgeGeometry.setAttribute("randomSeed", randomSeedAttribute);
		return instancedEdges;
	}

	createNodes() {
		let positions = [
			-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
		];
		let offsets = [];
		let vTextureCoord = [];
		let totalNodes = this.graph.getTotalNodes();
		// recorro todos los nodos
		for (let i = 0; i < totalNodes; i++) {
			let res = this.graph.getNode(i);
			offsets.push(res.position.x);
			offsets.push(res.position.y);
			offsets.push(res.position.z);

			vTextureCoord.push(res.vTextureCoord);
		}

		const geo = new THREE.InstancedBufferGeometry();
		geo.count = totalNodes;
		geo.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(positions, 2)
		);
		geo.setAttribute(
			"offset",
			new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3)
		);
		geo.setAttribute(
			"vTextureCoord",
			new THREE.InstancedBufferAttribute(
				new Float32Array(vTextureCoord),
				1
			)
		);

		console.log("nodes geometry", geo);
		let material = this._createNodesMaterial();

		const instancedNodes = new THREE.InstancedMesh(
			geo,
			material,
			totalNodes
		);
		instancedNodes.frustumCulled = false;

		console.log("instanced nodes", instancedNodes);
		return instancedNodes;
	}
}
