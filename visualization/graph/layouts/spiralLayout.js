import * as THREE from "three";

export class SpiralLayout {
    constructor(subgraphs, totalNodes, config) {
        this.steps = config.steps;
        this.rounds = config.rounds;
        this.separation = config.separation;
        this.constantRadius = config.constantRadius;
        this.subgraphs = subgraphs;
        this.totalNodes = totalNodes;
    }

    distributeNodes(offset = {}) {
        const xAngle = offset["x-angle"] ?? 0;
        const yAngle = offset["y-angle"] ?? 0;
        const zAngle = offset["z-angle"] ?? 0;
        const xOffset = offset["x-offset"] ?? 0;
        const yOffset = offset["y-offset"] ?? 0;
        const zOffset = offset["z-offset"] ?? 0;
        let angle = 0;
        let initialRadius = 3*this.subgraphs[this.subgraphs.length-1].getRadius();
        for (const subgraph of this.subgraphs) {
            const size = subgraph.getOrder();
            let currentRadius = initialRadius;
            angle = subgraph.getAngle(currentRadius, angle) + this.separation/this.subgraphs.length;
            if (this.rounds > 1) {
                if (!this.constantRadius) {
                    currentRadius = 5000 * size/this.totalNodes;
                }
                angle = this.rounds * angle;
            }

            const subgraphPosition = new THREE.Vector3(
                this.rounds + currentRadius * Math.sin(angle),
                this.steps * 3000 * size/this.totalNodes,
                this.rounds + currentRadius * Math.cos(angle)
            );

            subgraphPosition.applyAxisAngle(new THREE.Vector3(1, 0, 0), xAngle);
            subgraphPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), yAngle);
            subgraphPosition.applyAxisAngle(new THREE.Vector3(0, 0, 1), zAngle);
            subgraphPosition.setX(subgraphPosition.x + xOffset);
            subgraphPosition.setY(subgraphPosition.y + yOffset);
            subgraphPosition.setZ(subgraphPosition.z + zOffset);

            subgraph.setLabelPosition(subgraphPosition.clone().multiplyScalar(7));
            subgraph.setPosition(subgraphPosition);
        }
    }

    setSteps(steps) {
        this.steps = steps;
    }

    setRounds(rounds) {
        this.rounds = rounds;
    }

    setSeparationFactor(factor) {
        this.separation = factor;
    }

    setRadius(radius) {
        this.constantRadius = radius;
    }
}