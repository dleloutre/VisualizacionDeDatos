import * as THREE from "three";
import {Edge} from "./edgeT.js";
import {generateTextSprite} from "../utils/spriteText.js";
import {SpiralLayout} from "./layouts/spiralLayout.js";

export class Graph {
	totalSubgraphs = 0;
    totalNodes = 0;
    totalEdges = 0;
    metadata = {};

	constructor(subgraphs, crossingEdges, metadata) {
        this.subgraphs = this.sortSubgraphsBySize(subgraphs);
        this.allNodes = this.subgraphs.flatMap(subgraph => subgraph.getNodes());
        this.allNodesMap = this.allNodes.reduce((acc, node) => {
            const id = node.getId();
            acc[id] = node;
            return acc;
        }, {});
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
            separation: offset["separation"] ?? 1,
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

    getNodesMap() {
        return this.allNodesMap;
    }

    createEdges(rawEdges) {
        return rawEdges.map(([originId, targetId]) => {
            const originNode = this.allNodesMap[originId];
            const targetNode = this.allNodesMap[targetId];
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

    getTotalSubgraphs() {
        return this.totalSubgraphs;
    }

    getNodeDepthFromIndex(idx) {
        if (!this.allNodes[idx]) return -1;
        const node = this.allNodes[idx];
        if (!node.isInEdge() || !node.isInAnimatedEdge()) return -1;
        return node.getDepth();
    }

    getDepthFromEdge(idx) {
        if (!this.allEdges[idx]) return -1;
        const edge = this.allEdges[idx];
        const srcDepth = edge.getOrigin().getDepth();
        const tgtDepth = edge.getTarget().getDepth();
        if (srcDepth === -1 || tgtDepth === -1) {
            return -1;
        }
        return Math.min(srcDepth, tgtDepth);
    }

    sortSubgraphsBySize(subgraphs) {
        return subgraphs.sort((a, b) => a.getOrder() - b.getOrder());
    }

    updateSteps(steps) {
        this.layout.setSteps(steps);
        this.layout.distributeNodes();
    }

    updateRounds(rounds) {
        this.layout.setRounds(rounds);
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

    getColorList() {
        return Object.values(this.metadata).map(data => new THREE.Color(data.color));
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
