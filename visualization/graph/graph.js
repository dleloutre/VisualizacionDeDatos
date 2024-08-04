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
        this.allNodes = this.subgraphs.flatMap(subgraph => subgraph.getNodes());
        this.crossingEdges = crossingEdges ? this.createEdges(crossingEdges) : [];
        this.allEdges = this.subgraphs.flatMap(subgraph => subgraph.getEdges()).concat(this.crossingEdges);
        this.totalSubgraphs = subgraphs.length;
        this.totalNodes = this.allNodes.length;
        this.totalEdges = this.allEdges.length;
        this.metadata = metadata;
	}

    distributePositions(offset = {}) {
        this.positionOffset = offset;
        this.layout = new SpiralLayout(this.subgraphs, this.totalNodes, {
            steps: offset["steps"] ?? 0.5,
            rounds: offset["rounds"] ?? 1,
            separation: offset["separation"] ?? 2,
            constantRadius: true
        });
        this.layout.distributeNodes(this.positionOffset);
    }

    getAllNodes() {
        return this.allNodes;
    }

    getAllEdges() {
        return this.allEdges;
    }

    getAnimatedEdges() {
        return this.allEdges.filter((edge) => {
            return edge.getOrigin().getDepth() !== -1 || edge.getTarget().getDepth() !== -1
        })
    }

    getStillEdges() {
        return this.allEdges.filter((edge) => {
            return edge.getOrigin().getDepth() === -1 && edge.getTarget().getDepth() === -1
        })
    }

    createEdges(rawEdges) {
        return rawEdges.map(([originId, targetId]) => {
            const originNode = this.allNodes.find(node => node.getId() === originId);
            const targetNode = this.allNodes.find(node => node.getId() === targetId);
            if (!originNode || !targetNode) {
                console.log(originNode, originId, targetNode, targetId)
            }
            return new Edge(originNode, targetNode);
        });
    }

    getSubgraphs() {
        return this.subgraphs;
    }

    getTotalSubgraphs() {
        return this.totalSubgraphs;
    }

    getNodeDepthFromIndex(idx) {
        if (!this.allNodes[idx]) return -1;
        return this.allNodes[idx].getDepth();
    }

    getDepthFromEdge(idx) {
        if (!this.allEdges[idx]) return -1;
        const edge = this.allEdges[idx];
        const srcDepth = edge.getOrigin().getDepth();
        const tgtDepth = edge.getTarget().getDepth();
        if (srcDepth == -1 || tgtDepth == -1) {
            return -1;
        }
        return (srcDepth > tgtDepth) ? srcDepth : tgtDepth;
    }

    sortSubgraphsBySize(subgraphs) {
        return subgraphs.sort((a, b) => a.getOrder() - b.getOrder());
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
        this.layout.distributeNodes(this.positionOffset);
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
            const position = labelPositions[partyKey];
            const textmesh = generateTextSprite(label, color, position);

            return textmesh;
        });
      }
}
