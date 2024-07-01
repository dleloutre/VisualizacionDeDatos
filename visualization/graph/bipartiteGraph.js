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
        crossingAToB = crossingAToB.filter((edge) => edge)
        crossingBToA = crossingBToA.filter((edge) => edge)
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

    updatePositions(graphAElements, graphBElements) {
        const allNodesA = this.graphA.getAllNodes();
        for (const node of allNodesA) {
            let newPosition = node.getPosition().clone();
            newPosition.x = newPosition.x - 3500;
            //newPosition.rotateY(Math.PI/2);
            node.setPosition(newPosition)
        }
        const allNodesB = this.graphB.getAllNodes();
        for (const node of allNodesB) {
            let newPosition = node.getPosition().clone();
            newPosition.x = newPosition.x + 4000;
            newPosition.z = newPosition.z + 2000;
            node.setPosition(newPosition)
        }
        graphAElements.position.x = graphAElements.position.x - 3500;
        graphAElements.rotateY(Math.PI/2)
        graphBElements.position.x = graphBElements.position.x + 4000;
        // graphBElements.position.y = graphBElements.position.y + 1000;
        graphBElements.position.z = graphBElements.position.z + 2000;
        // graphBElements.rotateX(-Math.PI)
    }
}