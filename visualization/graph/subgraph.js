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
            if (originNode.getDepth() !== -1 && targetNode.getDepth() !== -1) {
                originNode.markAsAnimated();
                targetNode.markAsAnimated();
            } else {
                originNode.mark();
                targetNode.mark();
            }
            return new Edge(originNode, targetNode);
        });
    }

    setNodes(nodesData) {
        this.nodes = nodesData.map(([id, x, y, z, depth]) => {
            const position = new THREE.Vector3(x, y, z);
            const node = new Node(id, position);
            if (depth && depth !== 0) node.setDepth(depth);
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

    getEdges() {
        return this.edges;
    }

    getNodes() {
        return this.nodes;
    }

    getOrder() {
        return this.nodes.length;
    }

    getRadius() {
        return this.radius;
    }

    getAngle(distanceToCenter, prevAngle) {
        console.log("SUBGRAPH RADIUS", this.key, this.radius)
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
            const newPosition = node.getOriginalPosition().clone().add(position).multiplyScalar(4.7);
            node.setPosition(newPosition);
        });
    }

    getLabelPosition() {
        return this.labelPosition;
    }
}