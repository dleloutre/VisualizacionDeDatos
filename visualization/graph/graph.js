import * as THREE from "three";
import { Edge } from "./edgeT.js";
import { generateTextSprite } from "../utils/spriteText.js";

export class Graph {
    INITIAL_RADIUS = 650;

	totalSubgraphs = 0;
    totalNodes = 0;
    totalEdges = 0;
    steps = 1;
    rounds = 1;
    separation = 2;
    metadata = {};

	constructor(subgraphs, crossingEdges, metadata) {
        this.subgraphs = this.sortSubgraphsBySize(subgraphs);
        this.allNodes = this.getAllNodes();
        this.crossingEdges = this.createEdges(crossingEdges);
        this.totalSubgraphs = subgraphs.length;
        this.totalNodes = this.calculateTotalNodes();
        this.totalEdges = this.calculateTotalEdges();
        this.constantRadius = true;
        this.metadata = metadata;
        this.distributeNodesSpiral();
	}

    getAllNodes() {
        let nodes = [];
        for (const subgraph of this.subgraphs) {
            nodes = nodes.concat(subgraph.getNodes());
        }
        return nodes;
    }

    createEdges(rawEdges) {
        const edges = [];
        for (const edgeData of rawEdges) {
            const originId = edgeData[0];
            const targetId = edgeData[1];
            const originNode = this.allNodes.find((node) => node.getId() === originId);
            const targetNode = this.allNodes.find((node) => node.getId() === targetId);
            const edge = new Edge(originNode, targetNode);
            edges.push(edge);
        }
        return edges;
    }

    getSubgraphs() {
        return this.subgraphs;
    }

    getTotalSubgraphs() {
        return this.totalSubgraphs;
    }

    sortSubgraphsBySize(subgraphs) {
        const sortedSubgraphs = subgraphs.sort(function (a, b) {
            return a.getSize() - b.getSize(); 
        });
        return sortedSubgraphs;
    }

    calculateTotalNodes() {
        let total = 0;
        for (const subgraph of this.subgraphs) {
            total += subgraph.getOrder();
        }

        return total;
    }

    calculateTotalEdges() {
        let total = 0;
        for (const subgraph of this.subgraphs) {
            total += subgraph.getSize();
        }

        return total;
    }

    updateSteps(steps) {
        this.steps = steps;
        this.distributeNodesSpiral();
    }

    updateRounds(rounds) {
        this.rounds = rounds;
        this.distributeNodesSpiral();
    }

    updateConstantRadius(radius) {
        this.constantRadius = radius;
        this.distributeNodesSpiral();
    }

    updateSeparation(factor) {
        this.separation = factor;
        this.distributeNodesSpiral();
    }

    getLabels() {
        const labels = {};
        for (const subgraph of this.subgraphs) {
            labels[subgraph.getKey()] = subgraph.getLabelPosition();
        }

        return labels;
    }

    distributeNodesSemicircle(nodesData) {
        const TOTAL_NODES = nodesData.flat().length;
        console.log("total nodes:", TOTAL_NODES)
        let angle = 0;
        let offset = 0;
        for (let i = 0; i < nodesData.length; i++) {
            angle = partyAnglesCircle[i];
            let currentRadius = 500;
            const partyPosition = new THREE.Vector3(
                currentRadius * Math.cos(angle/2),
                currentRadius * Math.sin(angle/2) - 250,
                0,
            );
    
            this.partySizes.push(nodesData[i].length);
            
            for (let j = 0; j < nodesData[i].length; j++) {
                const position = new THREE.Vector3(
                    (nodesData[i][j][1] + partyPosition.x) * this.SATELLITES_RADIUS,
                    (nodesData[i][j][2] + partyPosition.y) * this.SATELLITES_RADIUS,
                    (nodesData[i][j][3] + partyPosition.z) * this.SATELLITES_RADIUS
                );
    
                const nodeId = nodesData[i][j][0];
                this.nodesMap[nodeId] = {
                    "partyIndex": i,
                    "nodesIndex": offset + j,
                    "partyVector": partyPosition,
                    "positionVector": position
                };
            }
            offset += nodesData[i].length;
        }
    }

    distributeNodesSpiral() {
        let angle = 0;
        for (const subgraph of this.subgraphs) {
            const size = subgraph.getOrder();
            let currentRadius = this.INITIAL_RADIUS;
            angle = subgraph.getAngle(currentRadius, angle) + this.separation/this.totalSubgraphs;
            if (this.rounds > 1) {
                if (!this.constantRadius) {
                    currentRadius = 5000 * size/this.totalNodes;
                }
                angle = this.rounds * angle;
            }

            const subgraphPosition = new THREE.Vector3(
                this.rounds + currentRadius * Math.sin(angle),
                this.steps * 3000 * size/this.totalNodes,
                this.rounds + currentRadius * Math.cos(angle),
            );

            const labelPosition = subgraphPosition.clone();
            const labelVectorPositions = {
                position: labelPosition,
                radius: currentRadius,
                angle: angle,
            };

            subgraph.setLabelPosition(labelVectorPositions);
            subgraph.setPosition(subgraphPosition);
        }
    }

    distributeNodesCircle(nodesData) {
        const TOTAL_NODES = nodesData.flat().length
        console.log("total nodes:", TOTAL_NODES)
        let angle = 0
        let offset = 0;
        // Distribute party groups
        for (let i = 0; i < nodesData.length; i++) {
            // const partyLen = nodesData[i].length;
            angle = partyAnglesCircle[i]; // based on: (partyLen/TOTAL_NODES*2*Math.PI + angle);
            const currentRadius = 650;
            const partyPosition = new THREE.Vector3(
                currentRadius * Math.sin(angle), // angle/2 for semicircle
                0,
                currentRadius * Math.cos(angle),
            );
    
            //this.cumulus.push(partyPosition);
            this.partySizes.push(nodesData[i].length);
    
            // Distribute nodes inside each party
            for (let j = 0; j < nodesData[i].length; j++) {
                const position = new THREE.Vector3(
                    (nodesData[i][j][1] + partyPosition.x) * this.SATELLITES_RADIUS,
                    (nodesData[i][j][2] + partyPosition.y) * this.SATELLITES_RADIUS,
                    (nodesData[i][j][3] + partyPosition.z) * this.SATELLITES_RADIUS
                );
    
                //this.nodePositions.push(position);
                const nodeId = nodesData[i][j][0];
                this.nodesMap[nodeId] = {
                    "partyIndex": i,
                    "partyVector": partyPosition,
                    "nodesIndex": offset + j,
                    "positionVector": position
                };
            }
            offset += nodesData[i].length;
        }
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

    getPositionLabels(metadata) {
        const textlabels = [];
        const labelPositions = this.getLabels();
        for (const partyKey in labelPositions) {
          let color = metadata[partyKey].color || 0xffffff;
          let label = metadata[partyKey].label || partyKey;
          var textmesh = generateTextSprite(label, color);
      
          textmesh.position.x =
            labelPositions[partyKey].radius *
            9 * 
            Math.sin(labelPositions[partyKey].angle);
          textmesh.position.y = labelPositions[partyKey].position.y * 7; 
          textmesh.position.z =
            labelPositions[partyKey].radius *
            8 * 
            Math.cos(labelPositions[partyKey].angle);
          textmesh.rotation.z = Math.PI / 2;
          textlabels.push(textmesh);
        }
      
        return textlabels;
      }
}
