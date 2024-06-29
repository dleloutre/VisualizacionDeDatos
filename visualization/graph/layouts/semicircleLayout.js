import * as THREE from "three";

export const cameraPosition = [0, 500, 2500];

export class SemicircleLayout {
    INITIAL_RADIUS = 650;

    constructor(subgraphs, totalNodes) {
        this.subgraphs = subgraphs;
        this.totalNodes = totalNodes;
    }

    distributeNodes() {
        let angle = 0;
        const radius = this.INITIAL_RADIUS;
        for (const subgraph of this.subgraphs) {
            angle = subgraph.getAngle(radius, angle) + this.separation/this.subgraphs.length;
            const subgraphPosition = new THREE.Vector3(
                radius * Math.cos(angle/2),
                radius * Math.sin(angle/2) - 250,
                0,
            );
    
            const labelPosition = subgraphPosition.clone();
            const labelVectorPositions = {
                position: labelPosition,
                radius: radius,
                angle: angle,
            };

            subgraph.setLabelPosition(labelVectorPositions);
            subgraph.setPosition(subgraphPosition);
        }
    }
}