import { CameraController } from "./cameraController.js";
import { RenderController } from "./renderController.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export class AnimationController {
    constructor(scene, camPosition) {
        this.cameraController = new CameraController(
            35,
            window.innerWidth / window.innerHeight,
            0.1,
            200000,
            camPosition
        );
        this.renderController = new RenderController();

        this.composer = new EffectComposer(this.renderController.getRenderer());
        this.composer.setPixelRatio(1);

        this.initialize(scene);
    }

    initialize(scene) {
        this.renderController.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        const rendererDomElement = this.renderController.getDomElement();
        document.body.appendChild(rendererDomElement);
        this.cameraController.createControls(rendererDomElement);
        this.renderController.createPass(scene, this.getCamera());

        this.composer.addPass(this.renderController.getPass());
        this.composer.addPass(new OutputPass());
    }

    setSize(width, height) {
        this.cameraController.setAspect(width / height);
        this.renderController.setSize(width, height);
        this.composer.setSize(width, height);
    }

    switchCamera(sceneElements) {
        this.cameraController.switchCamera(sceneElements);
    }

    setCameraToRenderer() {
        this.renderController.setCamera(this.getCamera());
    }

    getCamera() {
        return this.cameraController.getCurrentCamera();
    }

    render(scene, antialiasing) {
        const cameraHasChanged = this.cameraController.updateControl();
        if (cameraHasChanged || !antialiasing) {
            this.renderController.render(scene, this.getCamera());
        } else {
            this.composer.render();
        }

        this.cameraController.updateMatrixValues();
    }
}