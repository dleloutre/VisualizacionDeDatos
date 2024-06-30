import { Edge } from "./edgeT.js";

export class BipartiteGraph {
    constructor(graph_A, graph_B) {
        this.graphA = graph_A;
        this.graphB = graph_B;
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
        console.log("starting")
        console.log(this.graphA.getSubgraphs())
        const crossingAToB = crossing_A.map(([originId, targetId]) => {
            const originNode = this.graphA.getAllNodes().find(node => node.getId() === originId);
            const targetNode = this.graphB.getAllNodes().find(node => node.getId() === targetId);
            if (!originNode || !targetNode) {
                console.log("Missing: ", originNode, targetNode)
            } else {
                return new Edge(originNode, targetNode);
            }
        });
console.log("finish crossing a to b")
        const crossingBToA = crossing_B.map(([originId, targetId]) => {
            const originNode = this.graphB.getAllNodes().find(node => node.getId() === originId);
            const targetNode = this.graphA.getAllNodes().find(node => node.getId() === targetId);
            if (!originNode || !targetNode) {
                console.log("Missing: ", originId, targetId)
            } else {
                return new Edge(originNode, targetNode);
            }
        });
console.log("finish crossing")
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
}