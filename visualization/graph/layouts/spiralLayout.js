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
                this.rounds + currentRadius * Math.sin(angle),
                this.steps * 3000 * size/this.totalNodes,
                this.rounds + currentRadius * Math.cos(angle),
            );

            const labelVectorPositions = {
                position: subgraphPosition.clone(),
                radius: currentRadius,
                angle: angle,
            };

            subgraph.setLabelPosition(labelVectorPositions);
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