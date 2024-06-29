import * as THREE from "three";

export const cameraPosition = [0, 3000, 0];

export class CircleLayout {
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
                radius * Math.sin(angle),
                0,
                radius * Math.cos(angle),
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