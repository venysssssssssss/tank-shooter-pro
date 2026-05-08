import * as THREE from 'three';
import { keys } from './input.js';
import { Bullet } from './Bullet.js';

export class Tank {
    constructor(scene) {
        this.scene = scene;
        this.bullets = [];
        this.shootTimer = 0.25;
        this.shootDelay = 0.25; // s

        this.moveSpeed = 30;
        this.turnSpeed = 3;
        this.cameraPitch = 0;

        // Group to hold all tank parts
        this.mesh = new THREE.Group();

        // Tank Body
        const bodyGeo = new THREE.BoxGeometry(3, 1, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x4CAF50,
            roughness: 0.8,
            flatShading: true
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // Tank Turret Base
        const turretGeo = new THREE.BoxGeometry(2, 0.8, 2);
        const turretMat = new THREE.MeshStandardMaterial({ 
            color: 0x388E3C,
            roughness: 0.7,
            flatShading: true
        });
        this.turret = new THREE.Mesh(turretGeo, turretMat);
        this.turret.position.y = 1.4;
        this.turret.castShadow = true;
        this.mesh.add(this.turret);

        // Tank Barrel Pivot
        this.barrelPivot = new THREE.Group();
        this.barrelPivot.position.set(0, 1.4, 0); // Center of turret
        this.mesh.add(this.barrelPivot);

        // Tank Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.2, 0.2, 3);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x1B5E20,
            metalness: 0.5
        });
        this.barrel = new THREE.Mesh(barrelGeo, barrelMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.set(0, 0, -1.5); // Offset forward from pivot
        this.barrel.castShadow = true;
        this.barrelPivot.add(this.barrel);

        this.scene.add(this.mesh);
    }

    update() {
        // Rotation from mouse
        if (keys.isLocked) {
            this.mesh.rotation.y -= keys.movementX * 0.003;
            this.cameraPitch -= keys.movementY * 0.003;
            
            // Clamp pitch (so we can't look too far up or down)
            this.cameraPitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 8, this.cameraPitch));

            // Reset mouse movement after applying
            keys.movementX = 0;
            keys.movementY = 0;
        } else {
            // Fallback keyboard rotation
            if (keys.left) this.mesh.rotation.y += this.turnSpeed * deltaTime;
            if (keys.right) this.mesh.rotation.y -= this.turnSpeed * deltaTime;
        }

        // Apply pitch to barrel visually
        this.barrelPivot.rotation.x = this.cameraPitch;

        // Movement relative to current rotation
        if (keys.forward) {
            this.mesh.translateZ(-this.moveSpeed * deltaTime);
        }
        if (keys.backward) {
            this.mesh.translateZ(this.moveSpeed * deltaTime);
        }
        
        // Keep tank on the ground
        this.mesh.position.y = 0;

        // Shooting
        if (keys.shoot) {
            if (this.shootTimer > this.shootDelay) {
                this.shoot();
                this.shootTimer = 0;
            }
        }

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(deltaTime);
            if (!b.active) {
                this.bullets.splice(i, 1);
            }
        }
    }

    shoot() {
        // Calculate spawn position (end of the barrel)
        const spawnPos = new THREE.Vector3(0, 0, -3);
        spawnPos.applyMatrix4(this.barrelPivot.matrixWorld);

        // Calculate rotation including pitch
        const rot = new THREE.Euler(this.cameraPitch, this.mesh.rotation.y, 0, 'YXZ');
        const bullet = new Bullet(this.scene, spawnPos, rot);
        this.bullets.push(bullet);
    }
}     this.bullets.push(bullet);
    }
}