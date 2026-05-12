import * as THREE from 'three';

export class Ufo {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.speed = 24;
        this.time = 0;
        this.hp = 1;
        this.type = 'NORMAL';

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

        // Pulsating Core
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
        this.ringMat = new THREE.MeshStandardMaterial({
            color: 0x00f2ff,
            emissive: 0x00f2ff,
            emissiveIntensity: 1.0,
            toneMapped: false
        });
        this.ring = new THREE.Mesh(ringGeo, this.ringMat);
        this.ring.rotation.x = Math.PI / 2;
        this.mesh.add(this.ring);

        this.boundingBox = new THREE.Box3();
        this.target = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.baseDirection = new THREE.Vector3();
        
        this.scene.add(this.mesh);
    }

    reset(forceType = null) {
        this.active = true;
        this.mesh.visible = true;
        this.time = Math.random() * 10;
        this.maxHp = 1;

        if (forceType === 'BOSS') {
            this.type = 'BOSS';
            this.hp = 50;
            this.maxHp = 50;
            this.mesh.scale.set(6.0, 6.0, 6.0);
            this.coreMat.color.setHex(0x00f2ff);
            this.coreMat.emissive.setHex(0x00f2ff);
            this.ringMat.color.setHex(0xff00ff);
            this.ringMat.emissive.setHex(0xff00ff);
            this.speed = 8;
        } else {
            const rand = Math.random();
            if (rand < 0.15) {
                this.type = 'TANK';
                this.hp = 5;
                this.mesh.scale.set(2.0, 2.0, 2.0);
                this.coreMat.color.setHex(0xff6600);
                this.coreMat.emissive.setHex(0xff6600);
                this.ringMat.color.setHex(0xff6600);
                this.ringMat.emissive.setHex(0xff6600);
                this.speed = 10 + Math.random() * 10;
            } else if (rand < 0.35) {
                this.type = 'KAMIKAZE';
                this.hp = 1;
                this.mesh.scale.set(0.8, 0.8, 0.8);
                this.coreMat.color.setHex(0xff0000);
                this.coreMat.emissive.setHex(0xff0000);
                this.ringMat.color.setHex(0xff0000);
                this.ringMat.emissive.setHex(0xff0000);
                this.speed = 50 + Math.random() * 30;
            } else {
                this.type = 'NORMAL';
                this.hp = 1;
                this.mesh.scale.set(1.2, 1.2, 1.2);
                this.coreMat.color.setHex(0xff00ff);
                this.coreMat.emissive.setHex(0xff00ff);
                this.ringMat.color.setHex(0x00f2ff);
                this.ringMat.emissive.setHex(0x00f2ff);
                this.speed = 28 + Math.random() * 32;
            }
        }

        const angle = Math.random() * Math.PI * 2;
        const radius = this.type === 'BOSS' ? 200 : 120 + Math.random() * 60;
        this.mesh.position.set(
            Math.cos(angle) * radius,
            (this.type === 'BOSS' ? 40 : 10) + Math.random() * 20,
            Math.sin(angle) * radius
        );

        if (this.type === 'KAMIKAZE' || this.type === 'BOSS') {
            // Dive towards center
            this.target.set(0, 0, 0);
        } else {
            this.target.set(
                (Math.random() - 0.5) * 100,
                15 + Math.random() * 20,
                (Math.random() - 0.5) * 100
            );
        }

        this.baseDirection.subVectors(this.target, this.mesh.position).normalize();
        this.velocity.copy(this.baseDirection).multiplyScalar(this.speed);
    }

    update(deltaTime) {
        if (!this.active) return;

        this.time += deltaTime;

        if (this.type === 'KAMIKAZE') {
            // Zig-zag motion
            const zigzag = new THREE.Vector3(-this.baseDirection.z, 0, this.baseDirection.x);
            zigzag.multiplyScalar(Math.sin(this.time * 10) * 30);
            this.velocity.copy(this.baseDirection).multiplyScalar(this.speed).add(zigzag);
        }

        const step = this.velocity.clone().multiplyScalar(deltaTime);
        this.mesh.position.add(step);
        
        // Wobble & Core Pulse
        if (this.type !== 'KAMIKAZE') {
            this.mesh.rotation.z = Math.sin(this.time * 3) * 0.15;
        } else {
            this.mesh.rotation.z = Math.sin(this.time * 10) * 0.3;
        }
        this.mesh.rotation.y += 2 * deltaTime;
        
        this.coreMat.emissiveIntensity = 2.0 + Math.sin(this.time * 8) * 1.0;
        this.ring.rotation.z -= 4 * deltaTime;

        this.boundingBox.setFromObject(this.mesh);

        if (this.mesh.position.length() > 300 || this.mesh.position.y < -5) {
            this.destroy();
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }

    destroy() {
        if (!this.active) return;
        this.active = false;
        this.mesh.visible = false;
    }
}
