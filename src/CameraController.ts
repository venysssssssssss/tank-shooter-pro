import * as THREE from 'three';

export class CameraController {
    camera: THREE.PerspectiveCamera;
    target: any; // Using any to avoid circular dependencies for now or we can import Tank
    cameraOffset: THREE.Vector3;
    lookTarget: THREE.Vector3;
    trauma: number;
    shakeIntensity: number;
    baseFov: number;

    constructor(camera: THREE.PerspectiveCamera, target: any) {
        this.camera = camera;
        this.target = target;
        this.cameraOffset = new THREE.Vector3(0, 45, 30);
        this.lookTarget = new THREE.Vector3();
        
        // Screenshake
        this.trauma = 0;
        this.shakeIntensity = 2.5;
        this.baseFov = 65;
    }

    addTrauma(amount: number): void {
        this.trauma = Math.min(this.trauma + amount, 1.0);
    }

    update(deltaTime: number, combo: number = 0): void {
        const lerpFactor = 1 - Math.exp(-10 * deltaTime);
        
        const offset = this.cameraOffset.clone();
        offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.target.cameraPitch);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.target.mesh.rotation.y);
        
        const targetPos = this.target.mesh.position.clone().add(offset);
        this.camera.position.lerp(targetPos, lerpFactor);
        
        this.lookTarget.lerp(this.target.mesh.position, lerpFactor);
        this.camera.lookAt(this.lookTarget);

        // FOV effect based on combo
        const targetFov = this.baseFov + (combo * 0.5);
        this.camera.fov += (targetFov - this.camera.fov) * lerpFactor * 0.5;
        this.camera.updateProjectionMatrix();

        // Screenshake
        if (this.trauma > 0) {
            const shake = this.trauma * this.trauma * this.shakeIntensity;
            this.camera.position.x += (Math.random() - 0.5) * shake;
            this.camera.position.y += (Math.random() - 0.5) * shake;
            this.camera.position.z += (Math.random() - 0.5) * shake;
            
            this.trauma -= deltaTime * 0.8;
            if (this.trauma < 0) this.trauma = 0;
        }
    }
}