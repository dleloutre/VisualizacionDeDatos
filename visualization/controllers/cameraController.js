import * as THREE from "three";
import { DroneCameraControl } from "../cameras/droneCameraControl.js";
import { OrbitalCameraControl } from "../cameras/orbitalCameraControl.js";

const EXTERIOR_SPHERE_RADIUS = 1000;
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const exteriorSphere = new THREE.Sphere(
    new THREE.Vector3(0, 0, 0),
    EXTERIOR_SPHERE_RADIUS
);

export class CameraController {
    constructor(fov, aspect, near, far, camPosition) {
        this.orbitalCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.droneCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.matrixValues = [];
        this.currentCamera = this.orbitalCamera;
        this.setCameraPosition(camPosition[0], camPosition[1], camPosition[2]);
    }

    createControls(domElement) {
        this.orbitalControl = new OrbitalCameraControl(this.orbitalCamera, domElement);
        this.droneControl = new DroneCameraControl(this.droneCamera, [0, -1000, 22000]);
        this.currentControl = this.orbitalControl;
    }

    updateControl() {
        const hasChanged = this.cameraHasChanged();
        return this.currentControl.update(hasChanged);
    }

    getCurrentCamera() {
        return this.currentCamera;
    }
    
    switchCamera() {
        this.currentCamera = (this.currentCamera === this.droneCamera) ? this.droneToOrbitalCamera() : this.orbitalToDroneCamera();
        this.currentControl = (this.currentCamera === this.droneCamera) ? this.droneControl : this.orbitalControl;
    }

    droneToOrbitalCamera() {
        let position = this.droneControl.getPosition();
        let direction = this.droneControl.getDirection();

        let target = new THREE.Vector3();
        let ray = new THREE.Ray(position, direction);
        target = ray.intersectPlane(floorPlane, target);

        if (target == null) {
            target = new THREE.Vector3();
            target = ray.intersectSphere(exteriorSphere, target); 
            if (target == null) {
                target = this.droneControl.getTarget();
            }
        }
        this.orbitalCamera.position.copy(position);
        this.orbitalCamera.updateMatrixWorld();
        this.orbitalControl.getControl().target.copy(target);

        return this.orbitalCamera;
    }

    orbitalToDroneCamera() {
        let position = this.orbitalCamera.position.clone();
        let target = new THREE.Vector3(0, 0, -1);
        this.orbitalCamera.localToWorld(target);
        this.droneControl.setInitialState(position, target);

        return this.droneCamera;
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