import * as THREE from 'three';

interface ParticleData {
    active: boolean;
    life: number;
    maxLife: number;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    rotation: THREE.Vector3;
    rotSpeed: THREE.Vector3;
    color: THREE.Color;
    baseScale: number;
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
    scene: THREE.Scene;
    
    // Instanced Mesh variables
    maxParticles = 600;
    instancedMesh: THREE.InstancedMesh;
    particleData: ParticleData[] = [];
    
    // Scorch marks
    scorches: ScorchMark[] = [];
    
    // Reusable matrices/vectors for frame update to prevent GC
    private _dummyMatrix = new THREE.Matrix4();
    private _dummyPosition = new THREE.Vector3();
    private _dummyRotation = new THREE.Euler();
    private _dummyScale = new THREE.Vector3();
    private _dummyColor = new THREE.Color();
    private _stepVec = new THREE.Vector3();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        
        // 1. Initialize instanced mesh for box particles (single draw call)
        const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.9,
            toneMapped: false
        });
        
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.maxParticles);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        if (this.instancedMesh.instanceColor) {
            this.instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
        }
        this.scene.add(this.instancedMesh);

        // 2. Initialize particle pool states
        for (let i = 0; i < this.maxParticles; i++) {
            this.particleData.push({
                active: false,
                life: 0,
                maxLife: 1,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                rotation: new THREE.Vector3(),
                rotSpeed: new THREE.Vector3(),
                color: new THREE.Color(0xffffff),
                baseScale: 1.0
            });
            
            // Set initial invisible matrix (scale = 0)
            this._dummyMatrix.makeScale(0, 0, 0);
            this.instancedMesh.setMatrixAt(i, this._dummyMatrix);
        }
        
        // 3. Scorch Marks
        for (let i = 0; i < 25; i++) {
            this.scorches.push(new ScorchMark(scene));
        }
    }

    explode(position: THREE.Vector3, colorHex: number = 0x00f2ff, amount: number = 20): void {
        let spawned = 0;
        
        for (let i = 0; i < this.maxParticles; i++) {
            const p = this.particleData[i];
            if (!p.active) {
                p.active = true;
                p.life = 0;
                p.maxLife = 0.4 + Math.random() * 0.5;
                p.position.copy(position);
                p.color.setHex(colorHex);
                p.baseScale = 0.6 + Math.random() * 0.8;

                const angle = Math.random() * Math.PI * 2;
                const elevation = (Math.random() - 0.2) * Math.PI;
                p.velocity.set(
                    Math.cos(angle) * Math.cos(elevation),
                    Math.sin(elevation) + 1.2,
                    Math.sin(angle) * Math.cos(elevation)
                ).normalize().multiplyScalar(12 + Math.random() * 18);

                p.rotation.set(Math.random() * 5, Math.random() * 5, Math.random() * 5);
                p.rotSpeed.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                );

                spawned++;
                if (spawned >= amount) break;
            }
        }
        
        // Spawn 1 scorch mark at position
        for (const s of this.scorches) {
            if (!s.active) {
                s.spawn(position);
                break;
            }
        }
    }

    update(deltaTime: number): void {
        let needsMatrixUpdate = false;
        let needsColorUpdate = false;

        for (let i = 0; i < this.maxParticles; i++) {
            const p = this.particleData[i];
            
            if (p.active) {
                p.life += deltaTime;
                if (p.life >= p.maxLife) {
                    p.active = false;
                    
                    // Collapse scale to 0 (make invisible)
                    this._dummyMatrix.makeScale(0, 0, 0);
                    this.instancedMesh.setMatrixAt(i, this._dummyMatrix);
                    needsMatrixUpdate = true;
                    continue;
                }

                // Physics update
                this._stepVec.copy(p.velocity).multiplyScalar(deltaTime);
                p.position.add(this._stepVec);
                p.velocity.y -= 28 * deltaTime; // gravity pull

                // Rotation update
                p.rotation.addScaledVector(p.rotSpeed, deltaTime);

                // Calculate progress scaling
                const progress = p.life / p.maxLife;
                const scaleVal = p.baseScale * (1.0 - progress);

                // Set dummy matrix
                this._dummyPosition.copy(p.position);
                this._dummyRotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
                this._dummyScale.set(scaleVal, scaleVal, scaleVal);
                
                this._dummyMatrix.compose(this._dummyPosition, new THREE.Quaternion().setFromEuler(this._dummyRotation), this._dummyScale);
                this.instancedMesh.setMatrixAt(i, this._dummyMatrix);
                needsMatrixUpdate = true;

                // Set color decay
                if (this.instancedMesh.instanceColor) {
                    this._dummyColor.copy(p.color).multiplyScalar(1.0 - progress);
                    this.instancedMesh.setColorAt(i, this._dummyColor);
                    needsColorUpdate = true;
                }
            }
        }

        // Notify WebGL about instanced attribute changes
        if (needsMatrixUpdate) {
            this.instancedMesh.instanceMatrix.needsUpdate = true;
        }
        if (needsColorUpdate && this.instancedMesh.instanceColor) {
            this.instancedMesh.instanceColor.needsUpdate = true;
        }

        // Update scorch marks
        for (let i = 0; i < this.scorches.length; i++) {
            this.scorches[i].update(deltaTime);
        }
    }
}