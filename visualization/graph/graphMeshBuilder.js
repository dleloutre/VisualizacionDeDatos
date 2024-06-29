import * as THREE from "three";
import { nodeShader } from "../shaders/nodeShader.js";
import { edgeShader } from "../shaders/edgeShader.js";

export class GraphMeshBuilder {
	constructor(graph) {
		this.graph = graph;
		this.edgesTexture = this._getEdgesTexture();
	}

	_getUnitCylinder() {
		const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1, true);
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

	getColor(colors, factor, numColors) {
		const color = new THREE.Color();
		const colorIndex = Math.floor(factor * numColors);
		color.copy(colors[colorIndex % numColors]);
		return color;
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
			},
			vertexShader: nodeShader.vertexShader,
			fragmentShader: nodeShader.fragmentShader,
			glslVersion: THREE.GLSL3,
		});
	}

	createEdges() {
		const totalEdgesToDraw = this.graph.getTotalEdges();
		const instancedEdgeGeometry = new THREE.InstancedBufferGeometry();
		instancedEdgeGeometry.copy(this._getUnitCylinder());

		const instanceGradientOffsetArray = new Float32Array(
			totalEdgesToDraw * 1
		);
		const gradientOffsetAttribute = new THREE.InstancedBufferAttribute(
			instanceGradientOffsetArray,
			1,
			true
		);

		const instanceRandomSeedArray = new Float32Array(totalEdgesToDraw * 1);
		const randomSeedAttribute = new THREE.InstancedBufferAttribute(
			instanceRandomSeedArray,
			1,
			true
		);

		let material = this._createEdgesMaterial();

		const instancedEdges = new THREE.InstancedMesh(
			instancedEdgeGeometry,
			material,
			totalEdgesToDraw
		);

		const subgraphs = this.graph.getSubgraphs();
		let edges = this.graph.getCrossingEdges().concat(...subgraphs.map(subgraph => subgraph.getEdges()));

		this.setEdgesAttributes(edges, instancedEdges, instanceGradientOffsetArray, instanceRandomSeedArray);

		instancedEdgeGeometry.setAttribute(
			"gradientOffset",
			gradientOffsetAttribute
		);

		instancedEdgeGeometry.setAttribute("randomSeed", randomSeedAttribute);
		return instancedEdges;
	}

	setEdgesAttributes(edges, instancedEdges, gradientOffsetArray, randomSeedArray) {
		const rotMatrix = new THREE.Matrix4();
		const translationMatrix = new THREE.Matrix4();
		const matrix = new THREE.Matrix4();

		edges.forEach((edge, j) => {
			const originNode = edge.getOrigin();
			const originVectorPosition = originNode.getVectorPosition();
			const targetNode = edge.getTarget();
			const targetVectorPosition = targetNode.getVectorPosition();

			const gradientOffset = (targetNode.getSubgraphId() + (1.0 + originNode.getSubgraphId()) / (1.0 + this.graph.getTotalSubgraphs())) / this.graph.getTotalSubgraphs();
			translationMatrix.makeTranslation(originVectorPosition.x, originVectorPosition.y, originVectorPosition.z);
			rotMatrix.lookAt(originVectorPosition, targetVectorPosition, new THREE.Vector3(0, 1, 0));

			const length = targetVectorPosition.distanceTo(originVectorPosition);
			matrix.identity().makeScale(1, 1, length).premultiply(rotMatrix).premultiply(translationMatrix);

			instancedEdges.setMatrixAt(j, matrix);
			gradientOffsetArray[j] = gradientOffset;
			randomSeedArray[j] = 4.0;
		});
	}

	createNodes() {
		const positions = [-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5];
		const totalNodes = this.graph.getTotalNodes();

		const { offsets, vTextureCoord } = this.getNodeAttributes();

		const geo = new THREE.InstancedBufferGeometry();
		geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 2));
		geo.setAttribute("offset", new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
		geo.setAttribute("vTextureCoord", new THREE.InstancedBufferAttribute(new Float32Array(vTextureCoord), 1));

		const material = this._createNodesMaterial();

		const instancedNodes = new THREE.InstancedMesh(geo, material, totalNodes);
		instancedNodes.frustumCulled = false;

		return instancedNodes;
	}

	getNodeAttributes() {
		const offsets = [];
		const vTextureCoord = [];

		for (const subgraph of this.graph.getSubgraphs()) {
			for (const node of subgraph.getNodes()) {
				const position = node.getVectorPosition();
				offsets.push(position.x, position.y, position.z);
				vTextureCoord.push(node.getVTextureCoord(this.graph.getTotalSubgraphs()));
			}
		}

		return { offsets, vTextureCoord };
	}
}
