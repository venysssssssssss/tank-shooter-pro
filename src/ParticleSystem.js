import * as THREE from 'three';

class Particle {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.life = 0;
        this.maxLife = 1.0;

        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.6);
        this.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 2.0,
            toneMapped: false,
            transparent: true
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.visible = false;
        this.velocity = new THREE.Vector3();
        
        this.scene.add(this.mesh);
    }

    reset(position, color) {
        this.active = true;
        this.mesh.visible = true;
        this.mesh.position.copy(position);
        this.life = 0;
        this.maxLife = 0.5 + Math.random() * 0.8;
        
        this.material.color.set(color);
        this.material.emissive.set(color);
        this.material.opacity = 1.0;

        const angle = Math.random() * Math.PI * 2;
        const speed = 15 + Math.random() * 25;
        this.velocity.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(speed);
        
        this.mesh.lookAt(position.clone().add(this.velocity));
    }

    update(deltaTime) {
        if (!this.active) return;

        this.life += deltaTime;
        const progress = this.life / this.maxLife;

        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.material.opacity = 1.0 - progress;
        this.mesh.scale.setScalar(1.0 - progress * 0.5);

        if (this.life >= this.maxLife) {
            this.active = false;
            this.mesh.visible = false;
        }
    }
}

class ScorchMark {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.life = 0;
        
        const geo = new THREE.PlaneGeometry(6, 6);
        this.mat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.8,
            depthWrite: false
        });
        this.mesh = new THREE.Mesh(geo, this.mat);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0.01; // Slightly above ground
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    spawn(position) {
        this.active = true;
        this.life = 10.0; // 10 seconds
        this.mesh.position.set(position.x, 0.01, position.z);
        this.mesh.rotation.z = Math.random() * Math.PI * 2;
        this.mesh.scale.setScalar(0.5 + Math.random() * 0.5);
        this.mat.opacity = 0.8;
        this.mesh.visible = true;
    }

    update(deltaTime) {
        if (!this.active) return;
        this.life -= deltaTime;
        if (this.life < 2.0) {
            this.mat.opacity = (this.life / 2.0) * 0.8;
        }
        if (this.life <= 0) {
            this.active = false;
            this.mesh.visible = false;
        }
    }
}

export class ParticleSystem {
    constructor(scene) {
        this.particles = [];
        for (let i = 0; i < 200; i++) {
            this.particles.push(new Particle(scene));
        }
        
        this.scorches = [];
        for (let i = 0; i < 20; i++) {
            this.scorches.push(new ScorchMark(scene));
        }
    }

    explode(position, color = 0x00f2ff) {
        let count = 0;
        for (const p of this.particles) {
            if (!p.active) {
                p.reset(position, color);
                count++;
                if (count >= 25) break;
            }
        }
        
        for (const s of this.scorches) {
            if (!s.active) {
                s.spawn(position);
                break;
            }
        }
    }

    update(deltaTime) {
        for (const p of this.particles) {
            p.update(deltaTime);
        }
        for (const s of this.scorches) {
            s.update(deltaTime);
        }
    }
}
