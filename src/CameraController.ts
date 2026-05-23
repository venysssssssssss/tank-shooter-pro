import * as THREE from 'three';

export class CameraController {
    camera: THREE.PerspectiveCamera;
    target: any; // Using any to avoid circular dependencies
    distance: number;
    cameraYaw: number;
    cameraPitch: number;
    lookTarget: THREE.Vector3;
    trauma: number;
    shakeIntensity: number;
    baseFov: number;

    constructor(camera: THREE.PerspectiveCamera, target: any) {
        this.camera = camera;
        this.target = target;
        this.distance = 17; // Follow distance
        this.cameraYaw = 0;
        this.cameraPitch = 0.25; // Look slightly down initially
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
        const lerpFactor = 1 - Math.exp(-12 * deltaTime);
        
        // 1. Orbit controls: Rotate camera offset around the tank based on mouse delta
        if (this.target.inputManager.keys.isLocked) {
            this.cameraYaw -= this.target.inputManager.keys.movementX * 0.0025;
            this.cameraPitch -= this.target.inputManager.keys.movementY * 0.0025;
            
            // Reset mouse inputs
            this.target.inputManager.keys.movementX = 0;
            this.target.inputManager.keys.movementY = 0;
        } else {
            // Unlocked: keep camera aligned behind tank
            let diff = this.target.mesh.rotation.y - this.cameraYaw;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            this.cameraYaw += diff * lerpFactor;
        }

        // Cap camera pitch to prevent flipping upside down
        this.cameraPitch = Math.max(-0.2, Math.min(0.75, this.cameraPitch));

        // 2. Position camera based on yaw, pitch, and tank position
        const offset = new THREE.Vector3(0, 4.5, this.distance);
        offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.cameraPitch);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
        
        const targetPos = this.target.mesh.position.clone().add(offset);
        this.camera.position.lerp(targetPos, lerpFactor);
        
        // 3. Look target (tank center + forward camera look-ahead vector)
        const cameraDir = new THREE.Vector3(0, 0, -1)
            .applyAxisAngle(new THREE.Vector3(1, 0, 0), this.cameraPitch)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
            
        const targetLookPos = this.target.mesh.position.clone()
            .add(new THREE.Vector3(0, 1.8, 0))
            .addScaledVector(cameraDir, 8.0); // look 8 units ahead of the tank in camera direction
        
        this.lookTarget.lerp(targetLookPos, lerpFactor);
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