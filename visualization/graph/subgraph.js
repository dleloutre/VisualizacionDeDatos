import * as THREE from "three";
import { Node } from "./nodeT.js";
import { Edge } from "./edgeT.js";

export class Subgraph {
    constructor(id, key) {
        this.id = id;
        this.key = key;
        this.nodes = [];
        this.edges = [];
        this.color = "#FFFFFF";
        this.label = key;
        this.angle = 0;
        this.radius = 0;
        this.position = new THREE.Vector3(0,0,0);
        this.labelPosition = {};
    }

    getKey() {
        return this.key;
    }

    getId() {
        return this.id;
    }

    setEdges(edgesData) {
        this.edges = edgesData.map(([originId, targetId]) => {
            const originNode = this.searchNodeById(originId);
            const targetNode = this.searchNodeById(targetId);
            return new Edge(originNode, targetNode);
        });
    }

    setNodes(nodesData) {
        this.nodes = nodesData.map(([id, x, y, z]) => {
            const position = new THREE.Vector3(x, y, z);
            const node = new Node(id, position);
            node.setSubgraphId(this.id);
            const radius = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
            if (radius > this.radius) {
                this.radius = radius;
            }

            return node;
        });
    }

    searchNodeById(id) {
        return this.nodes.find((node) => node.getId() === id);
    }

    setAngle(angle) {
        this.angle = angle;
    }

    getEdges() {
        return this.edges;
    }

    getNodes() {
        return this.nodes;
    }

    getOrder() {
        return this.nodes.length;
    }

    getSize() {
        return this.edges.length;
    }

    getAngle(distanceToCenter, prevAngle) {
        const angleBetweenGraphs = Math.atan((this.radius * 3) / distanceToCenter);
        return prevAngle + angleBetweenGraphs;
    }

    setLabelPosition(position) {
        this.labelPosition = position;
    }

    setPosition(position) {
        this.position = position;
        this.nodes.forEach(node => {
            node.setSubgraphPosition(position);
            const newPosition = node.getOriginalPosition().clone().add(position).multiplyScalar(5);
            node.setPosition(newPosition);
        });
    }

    getLabelPosition() {
        return this.labelPosition;
    }

    getPosition() {
        return this.position;
    }
}