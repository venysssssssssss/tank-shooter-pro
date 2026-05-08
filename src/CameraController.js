import * as THREE from 'three';

export class CameraController {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        this.cameraOffset = new THREE.Vector3(0, 5, 12);
        this.lookTarget = new THREE.Vector3();
    }

    update(deltaTime) {
        // Framerate-independent lerp: factor = 1 - exp(-speed * deltaTime)
        // A speed of 10 approximates the old 0.15 at 60FPS
        const lerpFactor = 1 - Math.exp(-10 * deltaTime);

        const offset = this.cameraOffset.clone();
        offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.target.cameraPitch);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.target.mesh.rotation.y);
        
        const targetCameraPos = this.target.mesh.position.clone().add(offset);
        this.camera.position.lerp(targetCameraPos, lerpFactor);

        this.lookTarget.set(0, 0, -50);
        this.lookTarget.applyEuler(new THREE.Euler(this.target.cameraPitch, this.target.mesh.rotation.y, 0, 'YXZ'));
        this.lookTarget.add(this.target.mesh.position);
        
        this.camera.lookAt(this.lookTarget);
    }
}
