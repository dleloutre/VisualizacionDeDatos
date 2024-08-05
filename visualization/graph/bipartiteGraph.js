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

    getTotalEdges() {
        return this.crossingEdges.length;
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

    getTotalSubgraphs() {
        return this.graphA.getTotalSubgraphs() + this.graphB.getTotalSubgraphs();
    }

    getColorList() {
        return this.graphA.getColorList().concat(this.graphB.getColorList());
    }

    createCrossingEdges(crossing_A, crossing_B) {
        let crossingAToB = crossing_A.map(([originId, targetId]) => {
            const originNode = this.graphA.getNodesMap()[originId];
            const targetNode = this.graphB.getNodesMap()[targetId];
            if (originNode.getDepth() !== -1 && targetNode.getDepth() !== -1) {
                originNode.markAsAnimated();
                targetNode.markAsAnimated();
            } else {
                originNode.mark();
                targetNode.mark();
            }
            return new Edge(originNode, targetNode);
        });

        let crossingBToA = crossing_B.map(([originId, targetId]) => {
            const originNode = this.graphB.getNodesMap()[originId];
            const targetNode = this.graphA.getNodesMap()[targetId];
            if (originNode.getDepth() !== -1 && targetNode.getDepth() !== -1) {
                originNode.markAsAnimated();
                targetNode.markAsAnimated();
            } else {
                originNode.mark();
                targetNode.mark();
            }
            return new Edge(originNode, targetNode);
        });
        this.crossingEdges = crossingAToB.concat(crossingBToA);
    }

    updateSeparation(factor) {
        this.graphA.updateSeparation(factor);
        this.graphB.updateSeparation(factor);
    }

    // only called when drawing edges
    getNodeDepthFromIndex(idx) {
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
        return Math.min(srcDepth, tgtDepth);
    }
}