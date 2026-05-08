import * as THREE from 'three';

export class Ufo {
    constructor(scene) {
        this.scene = scene;
        this.active = true;
        this.speed = 24 + Math.random() * 24;
        this.time = 0;

        // Low poly UFO shape
        this.mesh = new THREE.Group();

        const baseGeometry = new THREE.CylinderGeometry(3, 1, 0.8, 12);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.2,
            flatShading: true
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        this.mesh.add(base);

        const domeGeometry = new THREE.SphereGeometry(1.5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.8,
            flatShading: true
        });
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = 0.4;
        this.mesh.add(dome);

        // Spawn closer to make them visible
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * 40; // Closer spawn
        this.mesh.position.set(
            Math.cos(angle) * radius,
            15 + Math.random() * 20, // Height
            Math.sin(angle) * radius
        );

        // Move across the map
        this.target = new THREE.Vector3(
            (Math.random() - 0.5) * 80,
            15 + Math.random() * 20,
            (Math.random() - 0.5) * 80
        );

        this.velocity = new THREE.Vector3().subVectors(this.target, this.mesh.position).normalize().multiplyScalar(this.speed);

        this.boundingBox = new THREE.Box3();
        
        // Slightly bigger scale for visibility
        this.mesh.scale.set(1.5, 1.5, 1.5);

        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (!this.active) return;

        this.time += deltaTime;
        const step = this.velocity.clone().multiplyScalar(deltaTime);
        this.mesh.position.add(step);
        
        // Wobble effect
        this.mesh.rotation.z = Math.sin(this.time * 5) * 0.2;
        this.mesh.rotation.x = Math.cos(this.time * 4) * 0.2;
        this.mesh.rotation.y += 3 * deltaTime;

        this.boundingBox.setFromObject(this.mesh);

        // Remove if it goes out of bounds
        if (this.mesh.position.length() > 250) {
            this.destroy();
        }
    }

    destroy() {
        if (!this.active) return;
        this.active = false;
        this.scene.remove(this.mesh);
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }
}