import * as THREE from "three";

export const cameraPosition = [0, 12000, 15000];

export class SpiralLayout {
    INITIAL_RADIUS = 650;

    constructor(subgraphs, totalNodes, config) {
        this.steps = config.steps;
        this.rounds = config.rounds;
        this.separation = config.separation;
        this.constantRadius = config.constantRadius;
        this.subgraphs = subgraphs;
        this.totalNodes = totalNodes;
    }

    distributeNodes(metadata) {
        let angle = 0;
        for (const subgraph of this.subgraphs) {
            const size = subgraph.getOrder();
            let currentRadius = this.INITIAL_RADIUS;
            angle = subgraph.getAngle(currentRadius, angle) + this.separation/this.subgraphs.length;
            if (this.rounds > 1) {
                if (!this.constantRadius) {
                    currentRadius = 5000 * size/this.totalNodes;
                }
                angle = this.rounds * angle;
            }

            const subgraphPosition = new THREE.Vector3(
                this.rounds + currentRadius * Math.sin(angle),// + metadata["x-offset"],
                this.steps * 3000 * size/this.totalNodes,// + metadata["y-offset"],
                this.rounds + currentRadius * Math.cos(angle)// + metadata["z-offset"],
            );
            subgraphPosition.applyAxisAngle(new THREE.Vector3(1, 0, 0), metadata["x-angle"]);
            subgraphPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), metadata["y-angle"]);
            subgraphPosition.setX(subgraphPosition.x + metadata["x-offset"])
            subgraphPosition.setY(subgraphPosition.y + metadata["y-offset"])
            subgraphPosition.setZ(subgraphPosition.z + metadata["z-offset"])

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