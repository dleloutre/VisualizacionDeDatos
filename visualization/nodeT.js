import * as THREE from "three";

export class Node {
    constructor(id, position, subgraphPosition, subgraphId) {
        this.id = id;
        this.position = position;
        this.originalPosition = position;
        this.subgraphPosition = subgraphPosition;
        this.subgraphId = subgraphId;
    }

    getId() {
        return this.id;
    }

    getPosition() {
        return this.position;
    }

    getOriginalPosition() {
        return this.originalPosition;
    }

    setPosition(position) {
        this.position = position;
    }

    getSubgraphId() {
        return this.subgraphId;
    }

    setSubgraphId(id) {
        this.subgraphId = id;
    }

    setSubgraphPosition(position) {
        this.subgraphPosition = position;
    }

    getVectorPosition() {
        return new THREE.Vector3().addVectors(
            this.subgraphPosition,
            this.position
        );
    }

    getVTextureCoord(totalSubgraphs) {
        const blockHeight = 1.0 / Math.pow(totalSubgraphs, 2);
		return (blockHeight / 2 + this.subgraphId / totalSubgraphs);
    }
}