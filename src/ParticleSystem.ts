import * as THREE from 'three';

class Particle {
    scene: THREE.Scene;
    active: boolean;
    life: number;
    maxLife: number;
    mesh: THREE.Mesh;
    material: THREE.MeshStandardMaterial;
    velocity: THREE.Vector3;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.active = false;
        this.life = 0;
        this.maxLife = 1;

        const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        this.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 2.0,
            toneMapped: false
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.visible = false;
        this.velocity = new THREE.Vector3();
        
        this.scene.add(this.mesh);
    }

    reset(position: THREE.Vector3, color: number): void {
        this.active = true;
        this.mesh.visible = true;
        this.mesh.position.copy(position);
        this.life = 0;
        this.maxLife = 0.5 + Math.random() * 0.5;
        
        this.material.color.setHex(color);
        this.material.emissive.setHex(color);
        this.material.emissiveIntensity = 2.0;

        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.2) * Math.PI;
        this.velocity.set(
            Math.cos(angle) * Math.cos(elevation),
            Math.sin(elevation) + 1.0,
            Math.sin(angle) * Math.cos(elevation)
        ).normalize().multiplyScalar(10 + Math.random() * 20);
    }

    update(deltaTime: number): void {
        if (!this.active) return;
        
        this.life += deltaTime;
        if (this.life >= this.maxLife) {
            this.active = false;
            this.mesh.visible = false;
            return;
        }

        const step = this.velocity.clone().multiplyScalar(deltaTime);
        this.mesh.position.add(step);
        
        this.velocity.y -= 30 * deltaTime; // gravity
        
        this.mesh.rotation.x += deltaTime * 5;
        this.mesh.rotation.y += deltaTime * 5;
        
        const progress = this.life / this.maxLife;
        this.material.emissiveIntensity = 2.0 * (1 - progress);
        this.mesh.scale.setScalar(1 - progress);
    }
}

class ScorchMark {
    scene: THREE.Scene;
    active: boolean;
    life: number;
    mesh: THREE.Mesh;
    mat: THREE.MeshStandardMaterial;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.active = false;
        this.life = 0;

        const geo = new THREE.PlaneGeometry(5, 5);
        this.mat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.8,
            roughness: 1.0,
            depthWrite: false
        });
        
        this.mesh = new THREE.Mesh(geo, this.mat);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0.01; // slightly above ground
        this.mesh.visible = false;
        
        this.scene.add(this.mesh);
    }

    spawn(position: THREE.Vector3): void {
        this.active = true;
        this.life = 0;
        this.mesh.position.x = position.x;
        this.mesh.position.z = position.z;
        this.mesh.rotation.z = Math.random() * Math.PI * 2;
        this.mat.opacity = 0.8;
        this.mesh.visible = true;
        this.mesh.scale.setScalar(0.5 + Math.random() * 1.5);
    }

    update(deltaTime: number): void {
        if (!this.active) return;
        this.life += deltaTime;
        if (this.life > 5) { // Fade out after 5s
            this.mat.opacity = Math.max(0, 0.8 - (this.life - 5) * 0.5);
            if (this.mat.opacity <= 0) {
                this.active = false;
                this.mesh.visible = false;
            }
        }
    }
}

export class ParticleSystem {
    particles: Particle[];
    scorches: ScorchMark[];

    constructor(scene: THREE.Scene) {
        this.particles = [];
        for (let i = 0; i < 200; i++) {
            this.particles.push(new Particle(scene));
        }
        
        this.scorches = [];
        for (let i = 0; i < 20; i++) {
            this.scorches.push(new ScorchMark(scene));
        }
    }

    explode(position: THREE.Vector3, color: number = 0x00f2ff): void {
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

    update(deltaTime: number): void {
        for (const p of this.particles) {
            p.update(deltaTime);
        }
        for (const s of this.scorches) {
            s.update(deltaTime);
        }
    }
}