import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class OrbitalCameraControl {
    constructor(camera, domElement) {
        this.control = new OrbitControls(camera, domElement);
    }

    update(cameraHasChanged) {
        //const cameraHasChanged = controller.cameraHasChanged();
        this.control.update();

        return cameraHasChanged;
    }

    adjustGraphPosition(elements) {
        elements.rotation.y = -Math.PI;
        elements.rotation.x = Math.PI;
        elements.rotation.z = -Math.PI;
    }
}