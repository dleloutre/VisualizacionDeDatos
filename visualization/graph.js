import * as THREE from "three";

const partyAnglesCircle = [
    1.4,//1.2979333331076621,
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
    0.8//6.2831853071795845
]

export class Graph {
	CLOUD_RADIUS = 200;
	SATELLITES_RADIUS = 5;
	SATELLITES_VERTICAL_OFFSET = 20;
    RADIUS = 300;

	totalParties = 0;
	cumulus = [];
	satellites = [];
    totalNodes = 0;
    edges = [];
    partySizes = [];

	constructor(nodesData, edgesData) {
		this.cumulus = [];
        this.nodePositions = [];
        this.partySizes = [];
        this.edges = edgesData;
        this.nodes = nodesData;
        this.totalParties = nodesData.length;
        this.distributeNodesCircle(nodesData);
        this.totalNodes = this.nodePositions.length;
        console.log("positions", this.nodePositions)
	}

    getEdges() {
        return this.edges;
    }

    distributeNodesSemicircle(nodesData) {
        const TOTAL_NODES = nodesData.flat().length
        console.log("total nodes:", TOTAL_NODES)
        let angle = 0
        for (let i = 0; i < nodesData.length; i++) {
            angle = partyAnglesCircle[i];
            let currentRadius = 500;
            const partyPosition = new THREE.Vector3(
                currentRadius * Math.cos(angle/2),
                currentRadius * Math.sin(angle/2) - 250,
                0,
            );
    
            this.cumulus.push(partyPosition);
            this.partySizes.push(nodesData[i].length);
    
            for (let j = 0; j < nodesData[i].length; j++) {
                const position = new THREE.Vector3(
                    (nodesData[i][j][1] + partyPosition.x) * this.SATELLITES_RADIUS,
                    (nodesData[i][j][2] + partyPosition.y) * this.SATELLITES_RADIUS,
                    (nodesData[i][j][3] + partyPosition.z) * this.SATELLITES_RADIUS
                );
    
                this.nodePositions.push(position);
            }
        }
    }

    // Falta ajustar la vista, probar que la espiral empiece con los grafos más grandes
    distributeNodesSpiral(nodesData) {
        const initialRadius = 200;
        const TOTAL_NODES = nodesData.flat().length
        console.log("total nodes:", TOTAL_NODES)
        let currentRadius = initialRadius;
    
        // Distribute party groups
        for (let i = 0; i < nodesData.length; i++) {
            const partyLen = nodesData[i].length;
            const angle = partyLen/TOTAL_NODES*100*2*Math.PI;
            currentRadius = 2500*partyLen/TOTAL_NODES
            const partyPosition = new THREE.Vector3(
                currentRadius * Math.sin(angle),
                0,
                currentRadius * Math.cos(angle),
            );

            this.cumulus.push(partyPosition);
            this.partySizes.push(nodesData[i].length);

            // Distribute nodes inside each party
            for (let j = 0; j < nodesData[i].length; j++) {
                const position = new THREE.Vector3(
                    (nodesData[i][j][1] + partyPosition.x) * this.SATELLITES_RADIUS,
                    (nodesData[i][j][2] + partyPosition.y) * this.SATELLITES_RADIUS,
                    (nodesData[i][j][3] + partyPosition.z) * this.SATELLITES_RADIUS
                );

                this.nodePositions.push(position);
            }
        }
    }

    distributeNodesCircle(nodesData) {
        const TOTAL_NODES = nodesData.flat().length
        console.log("total nodes:", TOTAL_NODES)
        let angle = 0
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
    
            this.cumulus.push(partyPosition);
            this.partySizes.push(nodesData[i].length);
    
            // Distribute nodes inside each party
            for (let j = 0; j < nodesData[i].length; j++) {
                const position = new THREE.Vector3(
                    (nodesData[i][j][1] + partyPosition.x) * this.SATELLITES_RADIUS,
                    (nodesData[i][j][2] + partyPosition.y) * this.SATELLITES_RADIUS,
                    (nodesData[i][j][3] + partyPosition.z) * this.SATELLITES_RADIUS
                );
    
                this.nodePositions.push(position);
            }
        }
    }

	getTotalNodes() {
		return this.totalNodes;
	}

    getTotalNodesForParty(partyPosition) {
        return this.partySizes[partyPosition];
    }

	getNode(number) {
		// total=totalStars*totalSatellites
        const cumulusNum = this.getPartyFromPosition(number);
		let position = this.cumulus[cumulusNum].clone();
		position.add(this.nodePositions[number]);

		// la textura de bordes tiene un gradiente horizontal
		// para cada combinacion de estrella con estrella
		// en total son totalStars^2 gradientes
		const blockHeight = 1.0 / Math.pow(this.totalParties, 2);
		let vTextureCoord = blockHeight / 2 + cumulusNum / this.totalParties;

		return { position, vTextureCoord };
	}

	getTotalStars() {
		return this.totalParties;
	}

	getTotalSatellites() {
		return this.totalNodes;
	}

    getEdgeData(fromId, toId) {
        const {originPos,targetPos} = this.getNodePositionAndPartyFromNodeId(fromId, toId);
        const crossing = originPos.party !== targetPos.party;

        return {
            crossing,
            originPosition: originPos,
            targetPosition: targetPos
        };
    }

    getEdge(fromId, toId) {
        const edgeData = this.getEdgeData(fromId, toId);
        return edgeData.crossing ? this.getCrossingEdge(edgeData) : this.getInnerEdge(edgeData);
    }

    calculateNodePosition(position) {
        let offset = 0;
        for (let p = 0; p < position.party; p++) {
            offset += this.partySizes[p];
        }
        return new THREE.Vector3().addVectors(
            this.cumulus[position.party],
            this.nodePositions[offset + position.nodePosition]
        );
    }
    
    calculateGradientOffset(originPosition, targetPosition) {
        return (targetPosition.party + (1.0 + originPosition.party) / (1.0 + this.totalParties)) / this.totalParties;
    }

    getInnerEdge(edgeData) {
        const { originPosition, targetPosition } = edgeData;
        const origin = this.calculateNodePosition(originPosition);
        const target = this.calculateNodePosition(targetPosition);
        const gradientOffset = this.calculateGradientOffset(originPosition, targetPosition);
        return { origin, target, gradientOffset };
    }

    getPartyFromPosition(nodePosition) {
        let acc = 0;
        for (let i = 0; i < this.partySizes.length; i++) {
            acc += this.partySizes[i];
            if (nodePosition < acc) {
                return i;
            }
        }
        return null;
    }

    getNodePositionAndPartyFromNodeId(src, tgt) {
        const positions = { originPos: {}, targetPos: {} };
        for (let i = 0; i < this.totalParties; i++) {
            const srcPosition = this.nodes[i].findIndex(user => user[0] === src);
            const tgtPosition = this.nodes[i].findIndex(user => user[0] === tgt);
            if (srcPosition !== -1) {
                positions.originPos = { party: i, nodePosition: srcPosition };
            }
            if (tgtPosition !== -1) {
                positions.targetPos = { party: i, nodePosition: tgtPosition };
            }
            if (positions.originPos.party !== undefined && positions.targetPos.party !== undefined) {
                break;
            }
        }
        return positions;
    }

    getCrossingEdge(edgeData) {
        const { originPosition, targetPosition } = edgeData;
        const origin = this.calculateNodePosition(originPosition);
        const target = this.calculateNodePosition(targetPosition);
        const gradientOffset = this.calculateGradientOffset(originPosition, targetPosition);
        return { origin, target, gradientOffset };
    }
}
