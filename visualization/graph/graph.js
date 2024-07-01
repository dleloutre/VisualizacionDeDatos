import * as THREE from "three";
import { Edge } from "./edgeT.js";
import { generateTextSprite } from "../utils/spriteText.js";
import { SpiralLayout } from "./layouts/spiralLayout.js";
import { SemicircleLayout } from "./layouts/semicircleLayout.js";

export class Graph {
	totalSubgraphs = 0;
    totalNodes = 0;
    totalEdges = 0;
    metadata = {};

	constructor(subgraphs, crossingEdges, metadata, positionOffset) {
        this.subgraphs = this.sortSubgraphsBySize(subgraphs);
        this.allNodes = this.subgraphs.flatMap(subgraph => subgraph.getNodes());
        //this.crossingEdges = this.createEdges(crossingEdges);
        this.totalSubgraphs = subgraphs.length;
        this.totalNodes = this.calculateTotalNodes();
        //this.totalEdges = this.calculateTotalEdges();
        this.metadata = metadata;
        this.layout = new SpiralLayout(this.subgraphs, this.totalNodes, {
            steps: 0.5,
            rounds: 1,
            separation: 1,
            constantRadius: true
        });
        this.layout.distributeNodes(positionOffset);
	}

    getAllNodes() {
        return this.allNodes;
    }

    /*createEdges(rawEdges) {
        return rawEdges.map(([originId, targetId]) => {
            const originNode = this.allNodes.find(node => node.getId() === originId);
            const targetNode = this.allNodes.find(node => node.getId() === targetId);
            return new Edge(originNode, targetNode);
        });
    }*/

    getSubgraphs() {
        return this.subgraphs;
    }

    getTotalSubgraphs() {
        return this.totalSubgraphs;
    }

    sortSubgraphsBySize(subgraphs) {
        return subgraphs.sort((a, b) => a.getOrder() - b.getOrder());
    }

    calculateTotalNodes() {
        return this.subgraphs.reduce((total, subgraph) => total += subgraph.getOrder(), 0);
    }

    /*calculateTotalEdges() {
        return this.subgraphs.reduce((total, subgraph) => total += subgraph.getSize(), 0);
    }*/

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

    /*getTotalEdges() {
        return this.totalEdges;
    }*/

    /*getCrossingEdges() {
        return this.crossingEdges;
    }*/

    getColorList() {
        const colors = Object.values(this.metadata).map(data => new THREE.Color(data.color));
        return colors;
    }

    getPositionLabels() {
        const labelPositions = this.getLabels();
        return Object.keys(labelPositions).map(partyKey => {
            const { color = 0xffffff, label = partyKey } = this.metadata[partyKey];
            const position = labelPositions[partyKey];
            const textmesh = generateTextSprite(label, color, position);

            return textmesh;
        });
      }
}
