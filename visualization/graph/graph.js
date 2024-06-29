import * as THREE from "three";
import { Edge } from "./edgeT.js";
import { generateTextSprite } from "../utils/spriteText.js";
import { SpiralLayout } from "./layouts/spiralLayout.js";

export class Graph {
	totalSubgraphs = 0;
    totalNodes = 0;
    totalEdges = 0;
    metadata = {};

	constructor(subgraphs, crossingEdges, metadata) {
        this.subgraphs = this.sortSubgraphsBySize(subgraphs);
        this.allNodes = this.getAllNodes();
        this.crossingEdges = this.createEdges(crossingEdges);
        this.totalSubgraphs = subgraphs.length;
        this.totalNodes = this.calculateTotalNodes();
        this.totalEdges = this.calculateTotalEdges();
        this.metadata = metadata;
        this.layout = new SpiralLayout(this.subgraphs, this.totalNodes, {
            steps: 1,
            rounds: 1,
            separation: 2,
            constantRadius: true
        });
        this.layout.distributeNodes();
	}

    getAllNodes() {
        return this.subgraphs.flatMap(subgraph => subgraph.getNodes());
    }

    createEdges(rawEdges) {
        return rawEdges.map(([originId, targetId]) => {
            const originNode = this.allNodes.find(node => node.getId() === originId);
            const targetNode = this.allNodes.find(node => node.getId() === targetId);
            return new Edge(originNode, targetNode);
        });
    }

    getSubgraphs() {
        return this.subgraphs;
    }

    getTotalSubgraphs() {
        return this.totalSubgraphs;
    }

    sortSubgraphsBySize(subgraphs) {
        return subgraphs.sort((a, b) => a.getSize() - b.getSize());
    }

    calculateTotalNodes() {
        return this.subgraphs.reduce((total, subgraph) => total += subgraph.getOrder(), 0);
    }

    calculateTotalEdges() {
        return this.subgraphs.reduce((total, subgraph) => total += subgraph.getSize(), 0);
    }

    updateSteps(steps) {
        this.layout.setSteps(steps);
        this.layout.distributeNodes();
    }

    updateRounds(rounds) {
        this.layout.setRounds(rounds);
        this.layout.distributeNodes();
    }

    updateConstantRadius(constantRadius) {
        this.layout.setRadius(constantRadius);
        this.layout.distributeNodes();
    }

    updateSeparation(factor) {
        this.layout.setSeparationFactor(factor);
        this.layout.distributeNodes();
    }

    getLabels() {
        return this.subgraphs.reduce((labels, subgraph) => {
            labels[subgraph.getKey()] = subgraph.getLabelPosition();
            return labels;
        }, {});
    }

	getTotalNodes() {
		return this.totalNodes;
	}

    getTotalEdges() {
        return this.totalEdges;
    }

    getCrossingEdges() {
        return this.crossingEdges;
    }

    getColorList() {
        const colors = Object.values(this.metadata).map(data => new THREE.Color(data.color));
        return colors;
    }

    getPositionLabels() {
        const labelPositions = this.getLabels();
        return Object.keys(labelPositions).map(partyKey => {
            const { color = 0xffffff, label = partyKey } = this.metadata[partyKey];
            const { radius, angle, position } = labelPositions[partyKey];
            const textmesh = generateTextSprite(label, color);

            textmesh.position.set(
                radius * 9 * Math.sin(angle),
                position.y * 7,
                radius * 8 * Math.cos(angle)
            );
            textmesh.rotation.z = Math.PI / 2;

            return textmesh;
        });
      }
}
