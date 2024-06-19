import * as THREE from "three";

const partyAnglesCircle = [
    0.7,
    1.0,
    1.2,
    1.8,
    2.4,
    3.0,
    3.4,
    4.0,
    4.5,
    5,
    5.8,
    6.5,
    /*1.4,//1.2979333331076621,
    2.1,//2.2259503628200936,
    2.7,//3.2927412506760163,
    3.6,//3.6228816074696093,
    4.3,//4.694887563879969,
    4.7,//4.861858148614399,
    4.9,//5.07488044041428,
    5.2,//5.255374846993267,
    5.4,//5.428267628221719,
    5.7,//5.682656904487304,
    6,//5.840081262037342,
    6.24,//5.992467333017838,
    0.1,//6.073168309122938,
    0.2,//6.146090877892607,
    0.3,//6.179060718075742,
    0.4,//6.195589833663534,
    0.5,//6.208318136576058,
    0.6,//6.266656191591793,
    0.7,//6.274788162897017,
    0.8//6.2831853071795845*/
];

export class Graph {
	SATELLITES_RADIUS = 5;
    RADIUS = 300;

	totalParties = 0;
    labelVectorPositions = {};
    totalNodes = 0;
    edges = [];
    steps = 1;
    rounds = 1;
    metadata = {};

	constructor(nodesData, edgesData, metadata) {
        this.labelVectorPositions = {};
        this.nodesMap = {};
        this.edges = edgesData;
        this.nodes = nodesData;
        this.totalParties = Object.keys(nodesData).length;
        this.distributeNodesSpiral(nodesData);
        this.totalNodes = Object.keys(this.nodesMap).length;
        this.constantRadius = true;
        this.metadata = metadata;
	}

    updateSteps(steps) {
        this.steps = steps;
        this.distributeNodesSpiral(this.nodes);
    }

    updateRounds(rounds) {
        this.rounds = rounds;
        this.distributeNodesSpiral(this.nodes);
    }

    updateConstantRadius(radius) {
        this.constantRadius = radius;
        this.distributeNodesSpiral(this.nodes);
    }

    getEdges() {
        return this.edges;
    }

    getLabels() {
        return this.labelVectorPositions;
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

    distributeNodesSpiral(nodesData) {
        const TOTAL_NODES = nodesData.reduce(function (acc, obj) { return acc + obj.data.length; }, 0); //nodesData.flat().length
        console.log("total nodes:", TOTAL_NODES)
        let offset = 0;
        let angle = 0;

        const sortedNodes = [...nodesData].sort(function (a, b) {
            return a.data.length - b.data.length;
        });

        let i = 0;
        // Distribute party groups
        for (const party of sortedNodes) {
            const partyLen = party.data.length;
            const originalIndex = nodesData.findIndex((a) => a.key === party.key);
            let currentRadius = 650;
            if (this.rounds > 1) {
                if (!this.constantRadius) {
                    currentRadius = 5000*partyLen/TOTAL_NODES;
                }
                angle = this.rounds*partyAnglesCircle[i];//partyLen/TOTAL_NODES*100*2*Math.PI;
            } else {
                angle = partyAnglesCircle[i];
            }

            const partyPosition = new THREE.Vector3(
                this.rounds + currentRadius * Math.sin(angle),
                this.steps*3000*partyLen/TOTAL_NODES,
                this.rounds + currentRadius * Math.cos(angle),
            );

            let labelPosition = partyPosition.clone();
            this.labelVectorPositions[party.key] = {
                position: labelPosition,
                radius: currentRadius,
                angle: angle,
            };

            // Distribute nodes inside each party
            for (let j = 0; j < partyLen; j++) {
                const position = new THREE.Vector3(
                    (party["data"][j][1] + partyPosition.x) * this.SATELLITES_RADIUS,
                    (party["data"][j][2] + partyPosition.y) * this.SATELLITES_RADIUS,
                    (party["data"][j][3] + partyPosition.z) * this.SATELLITES_RADIUS
                );

                const nodeId = party["data"][j][0];
                this.nodesMap[nodeId] = {
                    "partyIndex": originalIndex,
                    "nodesIndex": offset + j,
                    "partyVector": partyPosition,
                    "positionVector": position
                };
            }
            offset += partyLen;
            i++;
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

    getNodes() {
        return this.nodesMap;
    }

	getNode(id) {
        const nodeVectorInfo = this.nodesMap[id];
        let position = nodeVectorInfo.partyVector.clone();
		position.add(nodeVectorInfo.positionVector);

		// la textura de bordes tiene un gradiente horizontal
		// para cada combinacion de estrella con estrella
		// en total son totalStars^2 gradientes
		const blockHeight = 1.0 / Math.pow(this.totalParties, 2);
		let vTextureCoord = blockHeight / 2 + nodeVectorInfo.partyIndex / this.totalParties;

		return { position, vTextureCoord };
	}

	getTotalParties() {
		return this.totalParties;
	}

    getEdgeData(fromId, toId) {
        return {
            originPosition: {
                party: this.nodesMap[fromId].partyIndex,
                nodePosition: this.nodesMap[fromId].nodesIndex
            },
            targetPosition: {
                party: this.nodesMap[toId].partyIndex,
                nodePosition: this.nodesMap[toId].nodesIndex
            }
        };
    }

    getEdge(fromId, toId) {
        const originPosition = this.nodesMap[fromId];
        const targetPosition = this.nodesMap[toId];
        const origin = this.calculateVectorPosition(originPosition);
        const target = this.calculateVectorPosition(targetPosition);
        const gradientOffset = this.calculateGradientOffset(originPosition, targetPosition);

        return { origin, target, gradientOffset };
    }

    calculateVectorPosition(position) {
        return new THREE.Vector3().addVectors(
            position.partyVector,
            position.positionVector
        );
    }

    calculateGradientOffset(originPosition, targetPosition) {
        return (targetPosition.partyIndex + (1.0 + originPosition.partyIndex) / (1.0 + this.totalParties)) / this.totalParties;
    }

    getColorList() {
        const colors = Object.values(this.metadata).map(data => new THREE.Color(data.color));
        return colors;
    }
}
