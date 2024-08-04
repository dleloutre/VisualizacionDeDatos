import { Edge } from "./edgeT.js";

export class BipartiteGraph {
    constructor(graph_A, graph_B) {
        this.graphA = graph_A;
        this.graphB = graph_B;
        this.graphA.distributePositions({
            "x-offset": -600,
            "y-angle": Math.PI/2,
            "steps": 0.6
        });
        this.graphB.distributePositions({
            "x-offset": 600,
            "y-angle": Math.PI/2,
            "steps": 0.6
        });
    }

    getAllEdges() {
        return this.crossingEdges;
    }

    getGraphA() {
        return this.graphA;
    }

    getGraphB() {
        return this.graphB;
    }

    getPositionLabels() {
        return this.graphA.getPositionLabels().concat(this.graphB.getPositionLabels());
    }

    getPositionLabelsA() {
        return this.graphA.getPositionLabels();
    }

    getPositionLabelsB() {
        return this.graphB.getPositionLabels();
    }

    getTotalNodes() {
        return this.graphA.getTotalNodes() + this.graphB.getTotalNodes();
    }

    getSubgraphs() {
        return this.graphA.getSubgraphs().concat(this.graphB.getSubgraphs());
    }

    getTotalSubgraphs() {
        return this.graphA.getTotalSubgraphs() + this.graphB.getTotalSubgraphs();
    }

    getColorList() {
        return this.graphA.getColorList().concat(this.graphB.getColorList());
    }

    createCrossingEdges(crossing_A, crossing_B) {
        let crossingAToB = crossing_A.map(([originId, targetId]) => {
            const originNode = this.graphA.getAllNodes().find(node => node.getId() === originId);
            const targetNode = this.graphB.getAllNodes().find(node => node.getId() === targetId);
            if (originNode && targetNode) {
                return new Edge(originNode, targetNode);
            }
        });

        let crossingBToA = crossing_B.map(([originId, targetId]) => {
            const originNode = this.graphB.getAllNodes().find(node => node.getId() === originId);
            const targetNode = this.graphA.getAllNodes().find(node => node.getId() === targetId);
            if (originNode && targetNode) {
                return new Edge(originNode, targetNode);
            }
        });
        crossingAToB = crossingAToB.filter((edge) => edge);
        crossingBToA = crossingBToA.filter((edge) => edge);
        this.crossingEdges = crossingAToB.concat(crossingBToA);
    }

    getCrossingEdges() {
        return this.crossingEdges;
    }

    getTotalEdges() {
        return this.crossingEdges.length;
    }

    updateSeparation(factor) {
        this.graphA.updateSeparation(factor);
        this.graphB.updateSeparation(factor);
    }

    getNodeDepthFromIndex(idx) {
        const depthA = this.graphA.getNodeDepthFromIndex(idx);
        const depthB = this.graphB.getNodeDepthFromIndex(idx);
        if (depthA !== -1) return depthA;
        if (depthB !== -1) return depthB;

        return -1;
    }

    getDepthFromEdge(idx) {
        if (!this.crossingEdges[idx]) return -1;
        const edge = this.crossingEdges[idx];
        const srcDepth = edge.getOrigin().getDepth();
        const tgtDepth = edge.getTarget().getDepth();
        if (srcDepth === -1 || tgtDepth === -1) {
            return -1;
        }
        return (srcDepth > tgtDepth) ? srcDepth : tgtDepth;
    }
}