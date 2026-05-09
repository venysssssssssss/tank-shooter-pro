import * as THREE from 'three';

export class Ufo {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.speed = 24;
        this.time = 0;

        this.mesh = new THREE.Group();
        this.mesh.visible = false;

        // Dark Hull
        const hullGeo = new THREE.CylinderGeometry(3, 1, 0.8, 12);
        const hullMat = new THREE.MeshStandardMaterial({ 
            color: 0x0a0a0a,
            metalness: 0.9,
            roughness: 0.1,
            flatShading: true
        });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.castShadow = true;
        this.mesh.add(hull);

        // Pulsating Magenta Core
        const coreGeo = new THREE.SphereGeometry(1.2, 12, 12);
        this.coreMat = new THREE.MeshStandardMaterial({
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 2.0,
            toneMapped: false
        });
        this.core = new THREE.Mesh(coreGeo, this.coreMat);
        this.core.position.y = 0.5;
        this.mesh.add(this.core);

        // Neon Ring
        const ringGeo = new THREE.TorusGeometry(3.5, 0.1, 8, 24);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x00f2ff,
            emissive: 0x00f2ff,
            emissiveIntensity: 1.0,
            toneMapped: false
        });
        this.ring = new THREE.Mesh(ringGeo, ringMat);
        this.ring.rotation.x = Math.PI / 2;
        this.mesh.add(this.ring);

        this.boundingBox = new THREE.Box3();
        this.target = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        
        this.mesh.scale.set(1.2, 1.2, 1.2);
        this.scene.add(this.mesh);
    }

    reset() {
        this.active = true;
        this.mesh.visible = true;
        this.time = Math.random() * 10;

        const angle = Math.random() * Math.PI * 2;
        const radius = 120 + Math.random() * 60;
        this.mesh.position.set(
            Math.cos(angle) * radius,
            15 + Math.random() * 25,
            Math.sin(angle) * radius
        );

        this.target.set(
            (Math.random() - 0.5) * 100,
            15 + Math.random() * 20,
            (Math.random() - 0.5) * 100
        );

        this.speed = 28 + Math.random() * 32;
        this.velocity.subVectors(this.target, this.mesh.position).normalize().multiplyScalar(this.speed);
    }

    update(deltaTime) {
        if (!this.active) return;

        this.time += deltaTime;
        const step = this.velocity.clone().multiplyScalar(deltaTime);
        this.mesh.position.add(step);
        
        // Wobble & Core Pulse
        this.mesh.rotation.z = Math.sin(this.time * 3) * 0.15;
        this.mesh.rotation.y += 2 * deltaTime;
        
        this.coreMat.emissiveIntensity = 2.0 + Math.sin(this.time * 8) * 1.0;
        this.ring.rotation.z -= 4 * deltaTime;

        this.boundingBox.setFromObject(this.mesh);

        if (this.mesh.position.length() > 300) {
            this.destroy();
        }
    }

    destroy() {
        if (!this.active) return;
        this.active = false;
        this.mesh.visible = false;
    }
}
