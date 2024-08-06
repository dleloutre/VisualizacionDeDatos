import * as THREE from "three";
import { nodeShader } from "../shaders/nodeShader.js";
import { edgeShader } from "../shaders/edgeShader.js";
import { animatedEdgeShader } from "../shaders/animatedEdgeShader.js";

export class GraphMeshBuilder {
	constructor(graph) {
		this.graph = graph;
		this.edgesTexture = this._getEdgesTexture();
		this.edgeAnimationTexture = this._getEdgeAnimationTexture();
		this.nodeAnimationTexture = this._getNodeAnimationTexture();
	}

	_getUnitCylinder() {
		const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true);
		cylinderGeometry.translate(0, 0.5, 0);
		cylinderGeometry.rotateX(-Math.PI / 2);
		return cylinderGeometry;
	}

	_getEdgesTexture() {
		const width = 256;
		const height = 4096;
		const size = width * height;
		const data = new Uint8Array(4 * size);

		const colors = this.graph.getColorList();
		const numColors = colors.length;

		for (let i = 0, r = 0; r < height; r++) {
			for (let c = 0; c < width; c++, i++) {
				const color1 = this.getColor(colors, r / height, numColors);
				const color2 = this.getColor(colors, (r / height) * numColors, numColors);
				const color = color1.lerp(color2, THREE.MathUtils.smoothstep(c / width, 0.1, 0.9));
				const [red, green, blue] = [color.r, color.g, color.b].map(val => Math.floor(val * 255));

				const stride = i * 4;
				data.set([red, green, blue, 255], stride);
			}
		}

		const texture = new THREE.DataTexture(data, width, height);
		texture.needsUpdate = true;
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;

		return texture;
	}

	getTexture(data, width, height) {
		const texture = new THREE.DataTexture(
			data,
			width,
			height,
			THREE.RedIntegerFormat,
			THREE.UnsignedByteType
		);
		texture.needsUpdate = true;
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		return texture;
	}

	_getEdgeAnimationTexture() {
		/*
		Esta textura almacena en cada pixel, el tiempo en el que la arista correspondiente
		debe iluminarse.
		El parametro time en el edgeMaterial, es el tiempo actual de la animacion.
		el shader compara el valor de la textura con el tiempo actual y enciende la arista
		cuando el tiempo actual es mayor que el valor de la textura.
		Cada arista tiene un atributo que es numero de arista, entre 0 y Integer maximo de 32 bits
		*/
		// la textura debe tener un tamaño tal que permita almacenar el tiempo de encendido de cada arista
		const TEXTURE_SIZE = 2048;
		const width = TEXTURE_SIZE;
		const height = TEXTURE_SIZE;

		const size = width * height;
		const data = new Uint8Array(size);

		let i = 0;
		const totalNodes = this.graph.getTotalEdges();
		const limit = Math.min(totalNodes, size);

		for (let r = 0; r < height; r++) {
			for (let c = 0; c < width; c++) {
				// i es el nro de arista
				if (i < limit) {
					// IMPORTANTE: data[i] no puede ser mayor a 255
					// encender por niveles de profundidad
					// cada arista se enciende en un tiempo distinto segun su profundidad
					data[i] = this.graph.getDepthFromEdge(i) * 5;
				} else {
					data[i] = -1;
				}
				//if (i % 2 == 0) data[i] = 0;
				i++;
			}
		}

		return this.getTexture(data, width, height);
	}

	_getNodeAnimationTexture() {
		const TEXTURE_SIZE = 2048;
		const width = TEXTURE_SIZE;
		const height = TEXTURE_SIZE;

		const size = width * height;
		const data = new Uint8Array(size);

		let i = 0;
		const totalNodes = this.graph.getTotalNodes();
		const limit = Math.min(totalNodes, size);

		for (let r = 0; r < height; r++) {
			for (let c = 0; c < width; c++) {
				// i es el nro de nodo
				if (i < limit) {
					// IMPORTANTE: data[i] no puede ser mayor a 255
					// encender por niveles de profundidad
					data[i] = this.graph.getNodeDepthFromIndex(i) * 5;
				} else {
					data[i] = -1;
				}
				i++;
			}
		}

		return this.getTexture(data, width, height);
	}

	getColor(colors, factor, numColors) {
		const color = new THREE.Color();
		const colorIndex = Math.floor(factor * numColors);
		color.copy(colors[colorIndex % numColors]);
		return color;
	}

	_createAnimatedEdgesMaterial() {
		return new THREE.ShaderMaterial({
			uniforms: {
				color: { value: new THREE.Color(0xffffff) },
				diffuseMap: { type: "t", value: this.edgesTexture },
				animationData: { type: "t", value: this.edgeAnimationTexture },
				time: { value: 0.0 },
				directionalLightDirection: { type: "v3", value: new THREE.Vector3(1, 1, 1).normalize() },
				ambientColor: { type: "v3", value: new THREE.Color(0x333333) },
				emissionFactor: { value: 0.3 },
			},
			defines: { ANIMATION_TEXTURE_SIDE: String(this.edgeAnimationTexture.image.width) + ".0" },
			vertexShader: animatedEdgeShader.vertexShader,
			fragmentShader: animatedEdgeShader.fragmentShader,
		});
	}

	_createEdgesMaterial() {
		return new THREE.ShaderMaterial({
			uniforms: {
				color: { value: new THREE.Color(0xffffff) },
				edgeColor: { type: "t", value: this.edgesTexture },
				waveOffset: { value: -3.0 },
				directionalLightDirection: { type: "v3", value: new THREE.Vector3(1, 1, 1).normalize() },
				ambientColor: { type: "v3", value: new THREE.Color(0x666666) },
				emissionFactor: { value: 0.3 },
			},
			vertexShader: edgeShader.vertexShader,
			fragmentShader: edgeShader.fragmentShader,
		});
	}

	_createNodesMaterial(nodeSize = 30) {
		return new THREE.ShaderMaterial({
			uniforms: {
				color: { value: new THREE.Color(0xffffff) },
				size: { value: nodeSize },
				diffuseMap: { type: "t", value: this.edgesTexture },
				animationData: { type: "t", value: this.nodeAnimationTexture },
				time: { value: 0.0 },
			},
			vertexShader: nodeShader.vertexShader,
			fragmentShader: nodeShader.fragmentShader,
			glslVersion: THREE.GLSL3,
			defines: { ANIMATION_TEXTURE_SIDE: String(this.nodeAnimationTexture.image.width) + ".0" },
		});
	}

	createEdges(animated = false) {
		let edges = this.graph.getAllEdges();
		let material = animated ? this._createAnimatedEdgesMaterial() : this._createEdgesMaterial();
		const totalEdgesToDraw = edges.length;
		const instancedEdgeGeometry = new THREE.InstancedBufferGeometry();
		instancedEdgeGeometry.copy(this._getUnitCylinder());

		const instanceGradientOffsetArray = new Float32Array(totalEdgesToDraw);
		const gradientOffsetAttribute = new THREE.InstancedBufferAttribute(instanceGradientOffsetArray, 1, true);
		const instanceEdgeLengthArray = animated ? new Float32Array(totalEdgesToDraw) : null;
		const edgeLengthAttribute = animated ? new THREE.InstancedBufferAttribute(instanceEdgeLengthArray, 1, true) : null;
		const instanceEdgeNumberArray = animated ? new Uint32Array(totalEdgesToDraw) : null;
		const edgeNumberAttribute = animated ? new THREE.InstancedBufferAttribute(instanceEdgeNumberArray, 1, true) : null;
		const instanceRandomSeedArray = !animated ? new Float32Array(totalEdgesToDraw) : null;
		const randomSeedAttribute = !animated ? new THREE.InstancedBufferAttribute(instanceRandomSeedArray, 1, true) : null;

		const instancedEdges = new THREE.InstancedMesh(instancedEdgeGeometry, material, totalEdgesToDraw);

		this.setEdgesAttributes(edges, instancedEdges, instanceGradientOffsetArray, instanceEdgeLengthArray, instanceEdgeNumberArray, instanceRandomSeedArray, animated);

		instancedEdgeGeometry.setAttribute("gradientOffset", gradientOffsetAttribute);
		if (animated) {
			instancedEdgeGeometry.setAttribute("edgeLength", edgeLengthAttribute);
			instancedEdgeGeometry.setAttribute("edgeNumber", edgeNumberAttribute);
		} else {
			instancedEdgeGeometry.setAttribute("randomSeed", randomSeedAttribute);
		}
		return instancedEdges;
	}

	setEdgesAttributes(edges, instancedEdges, gradientOffsetArray, edgeLengthArray, edgeNumberArray, randomSeedArray, animated) {
		const rotMatrix = new THREE.Matrix4();
		const translationMatrix = new THREE.Matrix4();
		const matrix = new THREE.Matrix4();

		edges.forEach((edge, j) => {
			const originNode = edge.getOrigin();
			const targetNode = edge.getTarget();

			if (animated !== edge.isAnimated()) {
				return;
			}

			const originVectorPosition = originNode.getVectorPosition();
			const targetVectorPosition = targetNode.getVectorPosition();

			const gradientOffset = (targetNode.getSubgraphId() + (1.0 + originNode.getSubgraphId()) / (1.0 + this.graph.getTotalSubgraphs())) / this.graph.getTotalSubgraphs();
			translationMatrix.makeTranslation(originVectorPosition.x, originVectorPosition.y, originVectorPosition.z);
			rotMatrix.lookAt(originVectorPosition, targetVectorPosition, new THREE.Vector3(0, 1, 0));

			const length = targetVectorPosition.distanceTo(originVectorPosition);
			matrix.identity().makeScale(1, 1, length).premultiply(rotMatrix).premultiply(translationMatrix);

			instancedEdges.setMatrixAt(j, matrix);
			gradientOffsetArray[j] = gradientOffset;
			if (animated) {
				edgeNumberArray[j] = j;
				edgeLengthArray[j] = length;
			} else {
				randomSeedArray[j] = 4.0;
			}
		});
	}

	createdAnimatedEdges() {
		return this.createEdges(true);
	}

	createNonAnimatedEdges() {
		return this.createEdges(false);
	}

	createNodes() {
		const positions = [-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5];
		const totalNodes = this.graph.getTotalNodes();

		const { translation, vTextureCoord, nodeNumber } = this.getNodeAttributes();

		const geo = new THREE.InstancedBufferGeometry();
		geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 2));
		geo.setAttribute("translation", new THREE.InstancedBufferAttribute(new Float32Array(translation), 3));
		geo.setAttribute("vTextureCoord", new THREE.InstancedBufferAttribute(new Float32Array(vTextureCoord), 1));
		geo.setAttribute("nodeNumber", new THREE.InstancedBufferAttribute(new Float32Array(nodeNumber), 1));

		const material = this._createNodesMaterial();
		const instancedNodes = new THREE.InstancedMesh(geo, material, totalNodes);
		instancedNodes.frustumCulled = false;
		return instancedNodes;
	}

	getNodeAttributes() {
		const vTextureCoord = [];
		const translation = [];
		const nodeNumber = [];

		const nodes = this.graph.getAllNodes();
		console.log("all nodes: ", nodes)
		nodes.forEach((node, i) => {
			const position = node.getVectorPosition();
			translation.push(position.x, position.y, position.z);
			nodeNumber.push(i);
			vTextureCoord.push(node.getVTextureCoord(this.graph.getTotalSubgraphs()));
		})

		return { translation, vTextureCoord, nodeNumber };
	}
}
