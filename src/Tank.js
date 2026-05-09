import * as THREE from 'three';
import { Bullet } from './Bullet.js';
import { ObjectPool } from './ObjectPool.js';

export class Tank {
    constructor(scene, inputManager, onShoot) {
        this.scene = scene;
        this.inputManager = inputManager;
        this.onShoot = onShoot;
        this.bullets = [];
        this.bulletPool = new ObjectPool(() => new Bullet(this.scene));
        this.shootTimer = 0.25;
        this.shootDelay = 0.2; // Faster fire rate

        this.moveSpeed = 35;
        this.turnSpeed = 3.5;
        this.cameraPitch = 0;
        
        this.recoil = 0;
        this.recoilIntensity = 0.8;
        this.powerUpType = null;
        this.powerUpTimer = 0;

        // Group to hold all tank parts
        this.mesh = new THREE.Group();

        // Tank Body (Gunmetal with Neon Accents)
        const bodyGeo = new THREE.BoxGeometry(3, 1.2, 4.5);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x111111,
            roughness: 0.4,
            metalness: 0.9
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // Neon Accents (Cyan)
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x00f2ff,
            emissive: 0x00f2ff,
            emissiveIntensity: 1.5,
            toneMapped: false
        });
        
        const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 4.6), accentMat);
        stripeL.position.set(1.4, 1.0, 0);
        this.mesh.add(stripeL);
        
        const stripeR = stripeL.clone();
        stripeR.position.x = -1.4;
        this.mesh.add(stripeR);

        // Tank Turret
        const turretGeo = new THREE.BoxGeometry(2.2, 1.0, 2.2);
        const turretMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.3,
            metalness: 0.8
        });
        this.turret = new THREE.Mesh(turretGeo, turretMat);
        this.turret.position.y = 1.7;
        this.turret.castShadow = true;
        this.mesh.add(this.turret);

        // Tank Barrel Pivot
        this.barrelPivot = new THREE.Group();
        this.barrelPivot.position.set(0, 1.7, 0);
        this.mesh.add(this.barrelPivot);

        // Tank Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.5, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            metalness: 0.9,
            roughness: 0.2
        });
        this.barrel = new THREE.Mesh(barrelGeo, barrelMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.set(0, 0, -1.75);
        this.barrel.castShadow = true;
        this.barrelPivot.add(this.barrel);
        
        // Muzzle Glow
        const muzzleGlowGeo = new THREE.SphereGeometry(0.3, 8, 8);
        this.muzzleGlow = new THREE.Mesh(muzzleGlowGeo, accentMat);
        this.muzzleGlow.position.set(0, 0, -3.5);
        this.muzzleGlow.visible = false;
        this.barrelPivot.add(this.muzzleGlow);

        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (this.powerUpTimer > 0) {
            this.powerUpTimer -= deltaTime;
            if (this.powerUpTimer <= 0) this.powerUpType = null;
        }

        if (this.inputManager.keys.isLocked) {
            this.mesh.rotation.y -= this.inputManager.keys.movementX * 0.003;
            this.cameraPitch -= this.inputManager.keys.movementY * 0.003;
            this.cameraPitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 8, this.cameraPitch));
            this.inputManager.keys.movementX = 0;
            this.inputManager.keys.movementY = 0;
        }

        this.barrelPivot.rotation.x = this.cameraPitch;

        if (this.inputManager.keys.forward) this.mesh.translateZ(-this.moveSpeed * deltaTime);
        if (this.inputManager.keys.backward) this.mesh.translateZ(this.moveSpeed * deltaTime);
        
        // Recoil logic
        if (this.recoil > 0) {
            this.recoil -= deltaTime * 5;
            this.barrel.position.z = -1.75 + Math.sin(this.recoil * 10) * this.recoilIntensity;
            this.muzzleGlow.visible = this.recoil > 0.15;
        } else {
            this.recoil = 0;
            this.barrel.position.z = -1.75;
            this.muzzleGlow.visible = false;
        }

        this.shootTimer += deltaTime;
        if (this.inputManager.keys.shoot && this.shootTimer > this.shootDelay) {
            this.shoot();
            this.shootTimer = 0;
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(deltaTime);
            if (!b.active) {
                this.bulletPool.release(b);
                this.bullets.splice(i, 1);
            }
        }
    }

    shoot() {
        this.recoil = 0.3;
        if (this.onShoot) this.onShoot();
        
        const count = this.powerUpType === 'TRIPLE' ? 3 : 1;
        for (let i = 0; i < count; i++) {
            const spread = (i - (count - 1) / 2) * 0.2;
            const spawnPos = new THREE.Vector3(spread * 2, 0, -3.8);
            spawnPos.applyMatrix4(this.barrelPivot.matrixWorld);
            const rot = new THREE.Euler(this.cameraPitch, this.mesh.rotation.y + spread, 0, 'YXZ');
            const bullet = this.bulletPool.get();
            bullet.reset(spawnPos, rot);
            this.bullets.push(bullet);
        }
    }

    applyPowerUp(type) {
        this.powerUpType = type;
        this.powerUpTimer = 10;
    }
}
