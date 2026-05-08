import * as THREE from 'three';

class Particle {
    constructor(scene) {
        this.scene = scene;
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00, 
            transparent: true, 
            opacity: 1 
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.active = false;
        this.velocity = new THREE.Vector3();
        this.life = 0;
        this.maxLife = 1.0; 
    }

    spawn(position) {
        this.mesh.position.copy(position);
        
        // Random outward velocity
        this.velocity.set(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30
        );
        
        this.mesh.scale.set(1, 1, 1);
        this.mesh.material.opacity = 1;
        this.life = this.maxLife;
        this.active = true;
        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (!this.active) return;

        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
            this.scene.remove(this.mesh);
            return;
        }

        // Move
        this.mesh.position.addScaledVector(this.velocity, deltaTime);
        
        // Gravity effect
        this.velocity.y -= 15 * deltaTime;

        // Fade & shrink
        const progress = this.life / this.maxLife;
        this.mesh.material.opacity = progress;
        this.mesh.scale.setScalar(progress);
    }
}

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.poolSize = 100; // Enough for a few simultaneous explosions
        
        for (let i = 0; i < this.poolSize; i++) {
            this.particles.push(new Particle(scene));
        }
    }

    explode(position) {
        const explosionSize = 15;
        let spawned = 0;
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!p.active) {
                p.spawn(position);
                spawned++;
                if (spawned >= explosionSize) break;
            }
        }
    }

    update(deltaTime) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update(deltaTime);
        }
    }
}