import * as THREE from 'three';

export class PowerUp {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.type = 'TRIPLE'; // Only one for now: TRIPLE SHOT

        const geometry = new THREE.OctahedronGeometry(1.5, 0);
        this.material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 2.0,
            toneMapped: false
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.visible = false;
        this.boundingBox = new THREE.Box3();
        
        this.scene.add(this.mesh);
    }

    spawn(position) {
        this.active = true;
        this.mesh.visible = true;
        this.mesh.position.copy(position);
        this.mesh.position.y = 2;
    }

    update(deltaTime) {
        if (!this.active) return;
        this.mesh.rotation.y += 3 * deltaTime;
        this.mesh.rotation.x += 1 * deltaTime;
        this.mesh.position.y = 2 + Math.sin(Date.now() * 0.005) * 0.5;
        this.boundingBox.setFromObject(this.mesh);
    }

    collect() {
        this.active = false;
        this.mesh.visible = false;
        return this.type;
    }
}
