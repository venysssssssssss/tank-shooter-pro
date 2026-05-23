import * as THREE from 'three';

export class PowerUp {
    scene: THREE.Scene;
    active: boolean;
    type: string | null;
    material: THREE.MeshStandardMaterial;
    mesh: THREE.Mesh;
    boundingBox: THREE.Box3;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.active = false;
        this.type = null;

        const geometry = new THREE.OctahedronGeometry(1.5, 0);
        this.material = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 1.0,
            toneMapped: false
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.visible = false;
        this.boundingBox = new THREE.Box3();

        this.scene.add(this.mesh);
    }

    spawn(position: THREE.Vector3, type: string): void {
        this.active = true;
        this.type = type;
        this.mesh.visible = true;
        this.mesh.position.copy(position);
        this.mesh.position.y = 2;

        if (type === 'TRIPLE') {
            this.material.color.setHex(0x00ff00);
            this.material.emissive.setHex(0x00ff00);
        } else if (type === 'SHIELD') {
            this.material.color.setHex(0x0000ff);
            this.material.emissive.setHex(0x0000ff);
        } else if (type === 'SLOW') {
            this.material.color.setHex(0xffaa00);
            this.material.emissive.setHex(0xffaa00);
        } else if (type === 'REGEN') {
            this.material.color.setHex(0xff0088);
            this.material.emissive.setHex(0xff0088);
        }
    }

    update(deltaTime: number): void {
        if (!this.active) return;
        this.mesh.rotation.y += deltaTime * 2;
        this.mesh.rotation.x += deltaTime;
        this.mesh.position.y = Math.sin(Date.now() * 0.003) * 0.5 + 1.5;
        this.boundingBox.setFromObject(this.mesh);
    }

    collect(): string | null {
        this.active = false;
        this.mesh.visible = false;
        return this.type;
    }
}