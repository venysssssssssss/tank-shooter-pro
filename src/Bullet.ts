import * as THREE from 'three';

export class Bullet {
    scene: THREE.Scene;
    speed: number;
    active: boolean;
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    boundingBox: THREE.Box3;
    
    // Reusable vector to prevent garbage collection allocation in frame loop
    private _stepVec = new THREE.Vector3();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.speed = 180;
        this.active = false;

        // Laser Geometry (Long and thin)
        const geometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 2.0,
            toneMapped: false
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.visible = false;
        
        this.velocity = new THREE.Vector3();
        this.boundingBox = new THREE.Box3();

        this.scene.add(this.mesh);
    }

    reset(position: THREE.Vector3, rotationEuler: THREE.Euler): void {
        this.active = true;
        this.mesh.visible = true;
        this.mesh.position.copy(position);
        
        this.velocity.set(0, 0, -1);
        this.velocity.applyEuler(rotationEuler);
        this.velocity.normalize().multiplyScalar(this.speed);
        
        // Point the laser in the direction of travel
        this._stepVec.copy(position).add(this.velocity);
        this.mesh.lookAt(this._stepVec);
        this.mesh.rotateX(Math.PI / 2); // Adjust for cylinder orientation
        
        this.boundingBox.setFromObject(this.mesh);
    }

    setVisualColor(colorHex: number): void {
        const mat = this.mesh.material as THREE.MeshStandardMaterial;
        mat.color.setHex(colorHex);
        mat.emissive.setHex(colorHex);
    }

    update(deltaTime: number): void {
        if (!this.active) return;

        this._stepVec.copy(this.velocity).multiplyScalar(deltaTime);
        this.mesh.position.add(this._stepVec);
        this.boundingBox.setFromObject(this.mesh);

        // Remove bullet if it goes too far
        if (this.mesh.position.length() > 500) {
            this.destroy();
        }
    }

    destroy(): void {
        if (!this.active) return;
        this.active = false;
        this.mesh.visible = false;
    }
}