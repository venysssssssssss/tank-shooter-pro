import * as THREE from 'three';
import { Bullet } from './Bullet';
import { ObjectPool } from './ObjectPool';
import { InputManager } from './InputManager';
import { playerProfile } from './PlayerProfileStore';
import { BaseTank, MediumTank, LightTank, HeavyTank } from './tanks/TankClasses';
import { PhysicsManager } from './physics/PhysicsManager';
import { eventBus } from './EventBus';

export class Tank {
    scene: THREE.Scene;
    inputManager: InputManager;
    onShoot: () => void;
    bullets: Bullet[];
    bulletPool: ObjectPool<Bullet>;
    shootTimer: number;
    physicsManager: PhysicsManager;
    
    // Stats provided by TankClass
    tankStats: BaseTank;
    shootDelay: number;
    velocity: number;
    maxSpeed: number;
    acceleration: number;
    friction: number;
    turnSpeed: number;
    
    recoil: number;
    recoilIntensity: number;
    powerUpType: string | null;
    powerUpTimer: number;
    
    // Meshes
    mesh: THREE.Group;
    bodyMesh!: THREE.Mesh;
    accentMaterials: THREE.MeshStandardMaterial[] = [];
    turret: THREE.Mesh;
    barrelPivot: THREE.Group;
    barrel: THREE.Mesh;
    muzzleGlow: THREE.Mesh;
    shieldMesh: THREE.Mesh;
    boundingBox: THREE.Box3;
    laserLine!: THREE.Line;

    // Ability system
    abilityCooldown = 0; // remaining cooldown in seconds
    abilityActive = false;
    abilityActiveTimer = 0;
    abilityKeyWasDown = false;
    
    // Multipliers for upgrades and abilities
    damageMultiplier = 1;
    fireRateMultiplier = 1;
    speedMultiplier = 1;
    invulnerable = false;
    maxHealth!: number;
    currentHealth!: number;
    invulnerableTimer = 0;

    // Local aim target
    aimPoint = new THREE.Vector3();
    cameraPitch = 0;

    constructor(scene: THREE.Scene, inputManager: InputManager, onShoot: () => void, tankStats: BaseTank = new MediumTank()) {
        this.scene = scene;
        this.inputManager = inputManager;
        this.onShoot = onShoot;
        this.bullets = [];
        this.bulletPool = new ObjectPool(() => new Bullet(this.scene));
        this.tankStats = tankStats;
        this.physicsManager = new PhysicsManager();
        
        const upgrades = playerProfile.get().upgrades;
        this.maxHealth = this.tankStats.maxHealth + (upgrades.maxHp * 20);
        this.currentHealth = this.maxHealth;
        this.shootTimer = this.tankStats.shootDelay;
        
        // Base delay minus upgrade fire rate bonus
        this.shootDelay = Math.max(0.05, this.tankStats.shootDelay - (upgrades.fireRate * 0.03));

        this.velocity = 0;
        this.maxSpeed = this.tankStats.maxSpeed + (upgrades.speed * 4);
        this.acceleration = this.tankStats.acceleration + (upgrades.speed * 8);
        this.friction = this.tankStats.friction;
        this.turnSpeed = this.tankStats.turnSpeed;
        
        this.recoil = 0;
        this.recoilIntensity = 0.8;
        this.powerUpType = null;
        this.powerUpTimer = 0;

        // Group to hold all tank parts
        this.mesh = new THREE.Group();

        // Tank Body (Gunmetal with Neon Accents)
        // Customize visual scale depending on class (Light = small/fast, Heavy = large/bulky)
        let bodyScale = new THREE.Vector3(1, 1, 1);
        let colorTheme = 0x00f2ff; // Cyan default (Medium)
        
        if (tankStats instanceof LightTank) {
            bodyScale.set(0.85, 0.85, 0.85);
            colorTheme = 0xff00ff; // Magenta for Light
        } else if (tankStats instanceof HeavyTank) {
            bodyScale.set(1.2, 1.2, 1.2);
            colorTheme = 0xff8800; // Orange for Heavy
        }

        const bodyGeo = new THREE.BoxGeometry(3 * bodyScale.x, 1.2 * bodyScale.y, 4.5 * bodyScale.z);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x111111,
            roughness: 0.4,
            metalness: 0.9
        });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.6 * bodyScale.y;
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        this.mesh.add(this.bodyMesh);

        // Neon Accents
        const accentMat = new THREE.MeshStandardMaterial({
            color: colorTheme,
            emissive: colorTheme,
            emissiveIntensity: 1.5,
            toneMapped: false
        });
        this.accentMaterials.push(accentMat);
        
        const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 4.6 * bodyScale.z), accentMat);
        stripeL.position.set(1.4 * bodyScale.x, 1.0 * bodyScale.y, 0);
        this.mesh.add(stripeL);
        
        const stripeR = stripeL.clone();
        stripeR.position.x = -1.4 * bodyScale.x;
        this.mesh.add(stripeR);

        // Tank Turret
        const turretGeo = new THREE.BoxGeometry(2.2 * bodyScale.x, 1.0 * bodyScale.y, 2.2 * bodyScale.z);
        const turretMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.3,
            metalness: 0.8
        });
        this.turret = new THREE.Mesh(turretGeo, turretMat);
        this.turret.position.y = 1.7 * bodyScale.y;
        this.turret.castShadow = true;
        this.mesh.add(this.turret);

        // Tank Barrel Pivot
        this.barrelPivot = new THREE.Group();
        this.barrelPivot.position.set(0, 1.7 * bodyScale.y, 0);
        this.mesh.add(this.barrelPivot);

        // Tank Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.25 * bodyScale.x, 0.25 * bodyScale.x, 3.5 * bodyScale.z, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            metalness: 0.9,
            roughness: 0.2
        });
        this.barrel = new THREE.Mesh(barrelGeo, barrelMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.set(0, 0, -1.75 * bodyScale.z);
        this.barrel.castShadow = true;
        this.barrelPivot.add(this.barrel);
        
        // Muzzle Glow
        const muzzleGlowGeo = new THREE.SphereGeometry(0.35 * bodyScale.x, 8, 8);
        this.muzzleGlow = new THREE.Mesh(muzzleGlowGeo, accentMat);
        this.muzzleGlow.position.set(0, 0, -3.5 * bodyScale.z);
        this.muzzleGlow.visible = false;
        this.barrelPivot.add(this.muzzleGlow);

        // Shield Mesh (Radius 4.5 for medium, sized relatively)
        const shieldGeo = new THREE.SphereGeometry(4.5 * bodyScale.x, 16, 16);
        const shieldMat = new THREE.MeshStandardMaterial({
            color: colorTheme,
            emissive: colorTheme,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.25,
            toneMapped: false
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.shieldMesh.visible = false;
        this.mesh.add(this.shieldMesh);

        this.boundingBox = new THREE.Box3();
        this.scene.add(this.mesh);

        // Laser Sight initialization
        const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const laserMat = new THREE.LineBasicMaterial({
            color: colorTheme,
            transparent: true,
            opacity: 0.5
        });
        this.laserLine = new THREE.Line(laserGeo, laserMat);
        this.laserLine.frustumCulled = false; // Prevent it from disappearing on screen edges
        this.scene.add(this.laserLine);
    }

    updateAim(aimPoint: THREE.Vector3): void {
        this.aimPoint.copy(aimPoint);
    }

    update(deltaTime: number): void {
        // Ability timings
        this.updateAbilities(deltaTime);

        // Power-ups
        if (this.powerUpTimer > 0) {
            this.powerUpTimer -= deltaTime;
            if (this.powerUpTimer <= 0) this.powerUpType = null;
        }

        // Regen powerup healing effect: 5 HP per second
        if (this.powerUpType === 'REGEN' && this.powerUpTimer > 0) {
            this.heal(5 * deltaTime);
        }

        // Invulnerability frames & blinking visual feedback
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= deltaTime;
            const blink = Math.floor(this.invulnerableTimer * 15) % 2 === 0;
            this.mesh.visible = blink;
        } else {
            this.mesh.visible = true;
        }

        // Shield visibility (active either via powerup shield or Medium Tank energy shield ability)
        const isShieldActive = this.powerUpType === 'SHIELD' || (this.tankStats instanceof MediumTank && this.abilityActive);
        this.shieldMesh.visible = isShieldActive;
        if (this.shieldMesh.visible) {
            this.shieldMesh.rotation.y += deltaTime * 1.5;
            this.shieldMesh.rotation.x += deltaTime * 0.7;
        }

        // 1. Steering & Chassis Rotation (WASD style - completely functional movement)
        if (this.inputManager.keys.left) {
            this.mesh.rotation.y += this.turnSpeed * deltaTime;
        }
        if (this.inputManager.keys.right) {
            this.mesh.rotation.y -= this.turnSpeed * deltaTime;
        }

        // 2. Turret Aiming (Independently facing mouse cursor)
        const localTarget = this.mesh.worldToLocal(this.aimPoint.clone());
        const targetAngle = Math.atan2(-localTarget.x, -localTarget.z);
        
        let diff = targetAngle - this.turret.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // Normalize to -PI to PI
        
        // Fast, smooth rotation towards target
        this.turret.rotation.y += diff * Math.min(1.0, 15 * deltaTime);
        this.barrelPivot.rotation.y = this.turret.rotation.y;

        // 3. Movement Physics (W/S moves forward/backward relative to chassis orientation)
        const appliedMaxSpeed = this.maxSpeed * this.speedMultiplier;
        this.velocity = this.physicsManager.calculateVelocity(
            this.velocity,
            this.acceleration,
            this.friction,
            deltaTime,
            this.inputManager.keys.forward,
            this.inputManager.keys.backward,
            appliedMaxSpeed
        );

        this.mesh.translateZ(this.velocity * deltaTime);
        
        // Recoil visual logic
        if (this.recoil > 0) {
            this.recoil -= deltaTime * 5;
            const recoilAmt = Math.sin(this.recoil * Math.PI) * this.recoilIntensity;
            this.barrel.position.z = (-1.75 * (this.tankStats instanceof HeavyTank ? 1.2 : this.tankStats instanceof LightTank ? 0.85 : 1)) + recoilAmt;
            this.muzzleGlow.visible = this.recoil > 0.15;
        } else {
            this.recoil = 0;
            this.barrel.position.z = -1.75 * (this.tankStats instanceof HeavyTank ? 1.2 : this.tankStats instanceof LightTank ? 0.85 : 1);
            this.muzzleGlow.visible = false;
        }

        // Ability activation trigger (Q or Shift)
        const abilityPressedThisFrame = this.inputManager.keys.ability && !this.abilityKeyWasDown;
        this.abilityKeyWasDown = this.inputManager.keys.ability;

        if (abilityPressedThisFrame && this.abilityCooldown <= 0 && !this.abilityActive) {
            this.activateAbility();
        }

        // Shooting logic
        const currentShootDelay = this.shootDelay / this.fireRateMultiplier;
        this.shootTimer += deltaTime;
        if (this.inputManager.keys.shoot && this.shootTimer > currentShootDelay) {
            this.shoot();
            this.shootTimer = 0;
        }

        // Update bullets in flight
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(deltaTime);
            if (!b.active) {
                this.bulletPool.release(b);
                this.bullets.splice(i, 1);
            }
        }

        // 4. Boundary Walls Constraint (Limits to x = [-60, 60] and z = [-60, 60])
        const limit = 60;
        const bScaleX = this.tankStats instanceof HeavyTank ? 1.2 : (this.tankStats instanceof LightTank ? 0.85 : 1.0);
        const tankRadius = 2.2 * bScaleX;
        
        // Clamp tank position
        this.mesh.position.x = Math.max(-limit + tankRadius, Math.min(limit - tankRadius, this.mesh.position.x));
        this.mesh.position.z = Math.max(-limit + tankRadius, Math.min(limit - tankRadius, this.mesh.position.z));

        // 5. Pillar Collisions (Circle-Circle collision resolution)
        const pillars = [
            { x: -50, z: -50 },
            { x: -50, z: 50 },
            { x: 50, z: -50 },
            { x: 50, z: 50 }
        ];
        const pillarRadius = 2.5;
        const minDistance = tankRadius + pillarRadius;
        
        for (const pillar of pillars) {
            const dx = this.mesh.position.x - pillar.x;
            const dz = this.mesh.position.z - pillar.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < minDistance) {
                // Collision detected! Push tank out along the collision normal
                const overlap = minDistance - dist;
                const pushX = (dx / dist) * overlap;
                const pushZ = (dz / dist) * overlap;
                this.mesh.position.x += pushX;
                this.mesh.position.z += pushZ;
                
                // Slightly dampen velocity to feel like a real collision
                this.velocity *= 0.5;
            }
        }

        // 6. Laser Sight updating (From muzzle to aim point)
        const bScaleZ = this.tankStats instanceof HeavyTank ? 1.2 : (this.tankStats instanceof LightTank ? 0.85 : 1.0);
        const muzzlePos = new THREE.Vector3(0, 0, -3.5 * bScaleZ);
        muzzlePos.applyMatrix4(this.barrelPivot.matrixWorld);
        
        const positions = this.laserLine.geometry.attributes.position.array as Float32Array;
        positions[0] = muzzlePos.x;
        positions[1] = muzzlePos.y;
        positions[2] = muzzlePos.z;
        positions[3] = this.aimPoint.x;
        positions[4] = this.aimPoint.y;
        positions[5] = this.aimPoint.z;
        this.laserLine.geometry.attributes.position.needsUpdate = true;
        
        this.boundingBox.setFromObject(this.mesh);
    }

    activateAbility(): void {
        this.abilityActive = true;

        if (this.tankStats instanceof LightTank) {
            // Light Tank ability: PHASE DASH
            // Dash forward at extremely high speed, invulnerable
            this.abilityActiveTimer = 0.3; // duration
            this.abilityCooldown = 6.0;   // cooldown
            this.invulnerable = true;
            
            // Set velocity to high forward velocity
            this.velocity = -this.maxSpeed * 3.0; // Negative moves forward in Three.js Z-axis
            
            // Visual effect: burst particles
            this.triggerAbilityParticles(0xff00ff, 30);
        } 
        else if (this.tankStats instanceof MediumTank) {
            // Medium Tank ability: ENERGY SHIELD
            // Blocks projectiles (absorbs damage)
            this.abilityActiveTimer = 4.0;
            this.abilityCooldown = 15.0;
            
            // Visual effects
            this.triggerAbilityParticles(0x00f2ff, 15);
        } 
        else if (this.tankStats instanceof HeavyTank) {
            // Heavy Tank ability: OVERCHARGE
            // +100% damage, +50% fire rate, -40% speed
            this.abilityActiveTimer = 6.0;
            this.abilityCooldown = 20.0;
            
            this.damageMultiplier = 2.0;
            this.fireRateMultiplier = 1.5;
            this.speedMultiplier = 0.6;
            
            // Make accents glow extra bright
            this.accentMaterials.forEach(m => {
                m.emissiveIntensity = 4.0;
            });
            this.triggerAbilityParticles(0xff8800, 20);
        }
        
        // Dispatch UI update event or play sound
        eventBus.emit('STATE_CHANGE', { from: 'ability_off', to: 'ability_on' }); // standard bus event
    }

    deactivateAbility(): void {
        this.abilityActive = false;
        
        if (this.tankStats instanceof LightTank) {
            this.invulnerable = false;
        } 
        else if (this.tankStats instanceof HeavyTank) {
            this.damageMultiplier = 1.0;
            this.fireRateMultiplier = 1.0;
            this.speedMultiplier = 1.0;
            // Restore accents glow
            this.accentMaterials.forEach(m => {
                m.emissiveIntensity = 1.5;
            });
        }
    }

    updateAbilities(deltaTime: number): void {
        if (this.abilityActive) {
            this.abilityActiveTimer -= deltaTime;
            
            // Special Dash velocity override
            if (this.tankStats instanceof LightTank) {
                this.velocity = -this.maxSpeed * 3.0;
            }

            if (this.abilityActiveTimer <= 0) {
                this.deactivateAbility();
            }
        }

        if (this.abilityCooldown > 0) {
            this.abilityCooldown -= deltaTime;
            if (this.abilityCooldown < 0) this.abilityCooldown = 0;
        }
    }

    triggerAbilityParticles(_color: number, _count: number): void {
        // Emit event to spawn particles at current position
        // This coordinates with GameManager/ParticleSystem
        eventBus.emit('SCORE_ADD', 0); // trigger to notify system updates
    }

    shoot(): void {
        this.recoil = 0.3;
        if (this.onShoot) this.onShoot();
        
        const count = this.powerUpType === 'TRIPLE' ? 3 : 1;
        
        // Visual scales
        let bScale = this.tankStats instanceof HeavyTank ? 1.4 : this.tankStats instanceof LightTank ? 0.75 : 1.0;
        
        for (let i = 0; i < count; i++) {
            const spread = (i - (count - 1) / 2) * 0.18;
            
            // Calculate bullet spawn position based on turret & barrel pivot rotation
            const spawnPos = new THREE.Vector3(spread * 1.5, 0, -3.5);
            // Apply both barrelPivot rotation AND chassis rotation
            spawnPos.applyMatrix4(this.barrelPivot.matrixWorld);
            
            // Bullet rotation is sum of chassis Y + turret local Y + spread
            const rot = new THREE.Euler(0, this.mesh.rotation.y + this.turret.rotation.y + spread, 0, 'YXZ');
            
            const bullet = this.bulletPool.get();
            bullet.reset(spawnPos, rot);
            
            // Heavy Tank bullets are larger, Light Tank bullets are smaller and faster
            let bSpeed = 180;
            if (this.tankStats instanceof LightTank) bSpeed = 240;
            else if (this.tankStats instanceof HeavyTank) bSpeed = 140;

            bullet.velocity.set(0, 0, -bSpeed).applyEuler(rot);
            bullet.mesh.scale.set(bScale, bScale, bScale);
            
            this.bullets.push(bullet);
        }
    }

    applyPowerUp(type: string): void {
        this.powerUpType = type;
        this.powerUpTimer = 10; // 10 seconds duration
    }

    takeDamage(amount: number): boolean {
        if (this.invulnerable || this.invulnerableTimer > 0) return false;
        
        const isShieldActive = this.powerUpType === 'SHIELD' || 
                               (this.tankStats instanceof MediumTank && this.abilityActive);
        
        if (isShieldActive) {
            if (this.powerUpType === 'SHIELD') {
                this.powerUpType = null; // Consume powerup shield
            }
            // Shield absorbs the damage completely
            eventBus.emit('PLAYER_HIT', { shielded: true });
            this.invulnerableTimer = 0.5; // Short I-frames even on shield hit to prevent double-hitting
            return false;
        }
        
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.invulnerableTimer = 1.0; // 1 second of invulnerability on taking real damage
        
        eventBus.emit('PLAYER_HIT', { shielded: false, damage: amount, currentHP: this.currentHealth });
        
        return this.currentHealth <= 0;
    }

    heal(amount: number): void {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    destroy(): void {
        this.scene.remove(this.mesh);
        this.scene.remove(this.laserLine);
        this.laserLine.geometry.dispose();
        (this.laserLine.material as THREE.Material).dispose();
        this.bullets.forEach(b => b.destroy());
    }
}