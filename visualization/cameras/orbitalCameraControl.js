import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class OrbitalCameraControl {
    constructor(camera, domElement) {
        this.control = new OrbitControls(camera, domElement);
    }

    getControl() {
        return this.control;
    }

    update(cameraHasChanged) {
        this.control.update();

        return cameraHasChanged;
    }
}