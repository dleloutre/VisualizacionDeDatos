import * as THREE from "three";
import { DroneCameraControl } from "./droneCameraControl.js";
import { OrbitalCameraControl } from "./orbitalCameraControl.js";

export class CameraController {
    constructor(fov, aspect, near, far) {
        this.orbitalCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.droneCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.matrixValues = [];
        this.currentCamera = this.orbitalCamera;
        // Semicircle layout: camera.position.set(0, 500, 2500)
        // Circle layout: camera.position.set(0, 3000, 0);
        // Spiral layout:
        this.setCameraPosition(0, 22000, 0);
    }

    createControls(domElement) {
        this.orbitalControl = new OrbitalCameraControl(this.orbitalCamera, domElement);
        this.droneControl = new DroneCameraControl(this.droneCamera);
        this.currentControl = this.orbitalControl;
    }

    updateControl() {
        const hasChanged = this.cameraHasChanged();
        return this.currentControl.update(hasChanged);
    }

    getCurrentCamera() {
        return this.currentCamera;
    }
    
    switchCamera(elements) {
        this.currentCamera = (this.currentCamera === this.droneCamera) ? this.orbitalCamera : this.droneCamera;
        this.currentControl = (this.currentCamera === this.droneCamera) ? this.droneControl : this.orbitalControl;
        this.currentControl.adjustGraphPosition(elements);
    }

    getOrbitalCamera() {
        return this.orbitalCamera;
    }

    getCurrentControl() {
        return this.currentControl;
    }

    getDroneCamera() {
        return this.droneCamera;
    }

    setCameraPosition(x, y, z) {
        this.currentCamera.position.set(x, y, z);
    }

    setAspect(aspectRatio) {
        this.currentCamera.aspect = aspectRatio;
    }

    cameraHasChanged() {
        let cameraHasChanged = false;  
        this.currentCamera.matrixWorld.elements.forEach((v, i) => {
          if (this.matrixValues.length > 0 && v != this.matrixValues[i]) {
            cameraHasChanged = true;
          }
        });

        return cameraHasChanged;
    }

    updateMatrixValues() {
        this.matrixValues = [];
        this.currentCamera.matrixWorld.elements.forEach((element) => {
            this.matrixValues.push(element);
        });
    }
}