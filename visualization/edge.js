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
}