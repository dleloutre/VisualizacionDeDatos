import * as THREE from "three";

export class Graph {
	CLOUD_RADIUS = 200;
	SATELLITES_RADIUS = 5;
	SATELLITES_VERTICAL_OFFSET = 20;

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
        this.distributeNodes(nodesData);
        this.totalNodes = this.nodePositions.length;
        console.log("psitions", this.nodePositions)
	}

    getEdges() {
        return this.edges;
    }

    distributeNodes(nodesData) {
        const initialRadius = 60;  // Radio inicial para la espiral
        const heightIncrement = 5; // Incremento en Z por cada grupo
        const angleIncrement = Math.PI / 4; // Incremento del ángulo para la espiral
        const expansionRate = 10;  // Tasa de expansión del radio de la espiral por cada paso
    
        let currentHeight = 0;  // Altura inicial en Z
        let currentRadius = initialRadius; // Radio inicial de la espiral
    
        // Distribute party groups
        for (let i = 0; i < nodesData.length; i++) {
            const angle = i * angleIncrement;
            const partyPosition = new THREE.Vector3(
                currentHeight,
                currentRadius * Math.sin(angle),
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
    
            currentHeight += heightIncrement; // Incrementa la altura para el siguiente grupo
            currentRadius += expansionRate; // Incrementa el radio para el siguiente grupo
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
        // edges: [[party1], [party2], [crossingEdges]]
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

        fromUser = this.edges[partyPosition][edgePosition][3]; // guarda el id del nodo
        toUser = this.edges[partyPosition][edgePosition][4];

        const originPositions = this.getNodePositionAndPartyFromNodeId(fromUser);
        const originPartyPosition = originPositions.party;
        let offset = 0;
        for (let p = 0; p < originPartyPosition; p++) {
            offset += this.nodes[p].length
        }

        origin = new THREE.Vector3().addVectors(
            this.cumulus[originPartyPosition],
            this.nodePositions[offset + originPositions.nodePosition]
        );

        const targetPositions = this.getNodePositionAndPartyFromNodeId(toUser);
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
