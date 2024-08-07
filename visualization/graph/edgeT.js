export class Edge {
    constructor(origin, target) {
        this.origin = origin;
        this.target = target;
    }

    getOrigin() {
        return this.origin;
    }

    getTarget() {
        return this.target;
    }

    hasNode(nodeId) {
        return this.origin.getId() === nodeId || this.target.getId() === nodeId;
    }

    isAnimated() {
        const srcDepth = this.origin.getDepth();
        const tgtDepth = this.target.getDepth();
        if (srcDepth >= 5) return false;
        return srcDepth !== -1 && tgtDepth !== -1 && Math.abs(srcDepth - tgtDepth) === 1 && srcDepth < tgtDepth;
    }
}