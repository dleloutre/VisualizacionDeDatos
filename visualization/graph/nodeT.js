import * as THREE from "three";

export class Node {
    constructor(id, position, subgraphPosition, subgraphId) {
        this.id = id;
        this.position = position;
        this.originalPosition = position;
        this.subgraphPosition = subgraphPosition;
        this.subgraphId = subgraphId;
        this.depth = -1;
    }

    getId() {
        return this.id;
    }

    setDepth(depth) {
        this.depth = depth;
    }

    getDepth() {
        return this.depth;
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