import * as THREE from "three";
import { Node } from "./node.js";
import { Edge } from "./edge.js";

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
        const edges = [];
        for (const edgeData of edgesData) {
            const originId = edgeData[0];
            const targetId = edgeData[1];
            const originNode = this.searchNodeById(originId);
            const targetNode = this.searchNodeById(targetId);
            const edge = new Edge(originNode, targetNode);
            edges.push(edge);
        }
        this.edges = edges;
    }

    setNodes(nodesData) {
        const nodes = [];
        for (const nodeData of nodesData) {
            const id = nodeData[0];
            const position = new THREE.Vector3(
                nodeData[1],
                nodeData[2],
                nodeData[3]
            );
            const node = new Node(id, position);
            node.setSubgraphId(this.id);
            nodes.push(node);
            const radius = Math.sqrt(Math.pow(nodeData[1], 2) + Math.pow(nodeData[2], 2) + Math.pow(nodeData[3], 2));
            if (radius > this.radius) {
                this.radius = radius;
            }
        }
        this.nodes = nodes;
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

    //getSubgraphDistanceToCenter() {
    //    return Math.sqrt(Math.pow(this.position.x,2) + Math.pow(this.position.y,2) + Math.pow(this.position.z,2))
    //}

    getAngle(distanceToCenter, prevAngle) {
        //const a = prevAngle + (this.nodes.length/totalNodes)*0.9*2*Math.PI;
        const subgraphDistanceToCenter = distanceToCenter;
        const subgraphRadius = this.radius*3;
        const angleBetweenGraphs = Math.atan(subgraphRadius/subgraphDistanceToCenter);
        //console.log("ANGLE BETWEEN", angleBetweenGraphs)
        //const a = prevAngle + (this.getOrder()/totalNodes)*2*Math.PI;
        //console.log(a)
        return prevAngle + angleBetweenGraphs;
    }

    setLabelPosition(position) {
        this.labelPosition = position;
    }

    setPosition(position) {
        this.position = position;
        this.nodes.forEach((node) => {
            node.setSubgraphPosition(position);
            const newPosition = new THREE.Vector3(
                (node.getOriginalPosition().x + position.x) * 5,
                (node.getOriginalPosition().y + position.y) * 5,
                (node.getOriginalPosition().z + position.z) * 5
            );
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