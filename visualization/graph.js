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
        console.log("psitions", this.nodePositions)
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

    getInnerEdge(partyPosition, userPosition) {
        // edges: [[party1], [party2], ..., [partyN], [crossingEdges]]
		let origin, target;
		let fromUser, toUser;
		let gradientOffset = 0;

        fromUser = this.edges[partyPosition][userPosition][0]; // guarda el id del nodo
        toUser = this.edges[partyPosition][userPosition][1];

        const fromUserPosition = this.nodes[partyPosition].findIndex((user) => user[0] == fromUser);
        const toUserPosition = this.nodes[partyPosition].findIndex((user) => user[0] == toUser);

        let offset = 0;
        for (let p = 0; p < partyPosition; p++) {
            offset += this.nodes[p].length
        }
        origin = new THREE.Vector3().addVectors(
            this.cumulus[partyPosition],
            this.nodePositions[offset + fromUserPosition]
        );
        target = new THREE.Vector3().addVectors(
            this.cumulus[partyPosition],
            this.nodePositions[offset + toUserPosition]
        );

        gradientOffset =
            (partyPosition +
                (1.0 + partyPosition) / (1.0 + this.totalParties)) /
            this.totalParties;

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

    getNodePositionAndPartyFromNodeId(id) {
        let nodePosition;
        let party;
        for (let i = 0; i < this.totalParties; i++) {
            nodePosition = this.nodes[i].findIndex((user) => user[0] == id);
            if (nodePosition !== -1) {
                party = i;
                return { party, nodePosition }
            }
        }

        return { party, nodePosition };
    }

    getCrossingEdge(partyPosition, edgePosition) {
        let origin, target;
		let fromUser, toUser;
		let gradientOffset = 0;
//console.log("partyPosition", partyPosition)
//console.log("edgePosition", edgePosition)
        fromUser = this.edges[partyPosition][edgePosition][4]; // guarda el id del nodo
        toUser = this.edges[partyPosition][edgePosition][3];

        const originPositions = this.getNodePositionAndPartyFromNodeId(fromUser);
        const originPartyPosition = originPositions.party;
        let offset = 0;
        for (let p = 0; p < originPartyPosition; p++) {
            offset += this.nodes[p].length
        }
        //console.log("originPartyPosition", originPartyPosition)
        //console.log("cumulus",this.cumulus[originPartyPosition])
        //console.log("node", this.nodePositions[offset + originPositions.nodePosition])
        origin = new THREE.Vector3().addVectors(
            this.cumulus[originPartyPosition],
            this.nodePositions[offset + originPositions.nodePosition]
        );
//console.log("fromUser:", fromUser)
//console.log("toUser:", toUser)
        const targetPositions = this.getNodePositionAndPartyFromNodeId(toUser);
        //console.log("targetPositions", targetPositions)
        const targetPartyPosition = targetPositions.party;
        offset = 0;
        for (let p = 0; p < targetPartyPosition; p++) {
            offset += this.nodes[p].length
        }
        target = new THREE.Vector3().addVectors(
            this.cumulus[targetPartyPosition],
            this.nodePositions[offset + targetPositions.nodePosition]
        );

        gradientOffset =
            (targetPartyPosition + (1.0 + originPartyPosition) / (1.0 + this.totalParties)) /
            this.totalParties;

        return { origin, target, gradientOffset };
    }
}
