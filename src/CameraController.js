import * as THREE from 'three';

export class CameraController {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        this.cameraOffset = new THREE.Vector3(0, 5, 12);
        this.lookTarget = new THREE.Vector3();
        
        // Shake logic
        this.trauma = 0;
        this.shakeIntensity = 0.5;
    }

    addTrauma(amount) {
        this.trauma = Math.min(1.0, this.trauma + amount);
    }

    update(deltaTime) {
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

        // Apply Shake
        if (this.trauma > 0) {
            const shake = Math.pow(this.trauma, 2) * this.shakeIntensity;
            this.camera.position.x += (Math.random() - 0.5) * 2 * shake;
            this.camera.position.y += (Math.random() - 0.5) * 2 * shake;
            this.camera.position.z += (Math.random() - 0.5) * 2 * shake;
            
            this.trauma = Math.max(0, this.trauma - deltaTime * 1.5);
        }
    }
}
