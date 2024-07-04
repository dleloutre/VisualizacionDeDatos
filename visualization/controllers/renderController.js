import * as THREE from "three";
import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js';

export class RenderController {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        THREE.ColorManagement.enabled = true;
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    }

    getRenderer() {
        return this.renderer;
    }
    
    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    setSize(width, height) {
        this.renderer.setSize(width, height);
    }

    setCamera(camera) {
        this.renderPass.camera = camera;
    }

    getDomElement() {
        return this.renderer.domElement;
    }

    getTarget() {
        const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
        return new THREE.WebGLRenderTarget(size.width, size.height, {
            samples: 5,
            type: THREE.FloatType,
        });
    }

    getPass() {
        return this.renderPass;
    }

    createPass(scene, camera) {
        console.log("ismobile", isMobile)
        this.renderPass = new SSAARenderPass(scene, camera);
        this.renderPass.clearColor = new THREE.Color(0x000000); 
        this.renderPass.clearAlpha = 1; 
        this.renderPass.sampleLevel = isMobile.phone ? 2 : 4;
        this.renderPass.unbiased = true;
    }
}