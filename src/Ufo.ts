import * as THREE from 'three';
import { eventBus } from './EventBus';
import { ENEMY_BALANCE } from './config/balance';

export enum UfoState {
    SPAWN,
    CHASE,
    ATTACK
}

export class Ufo {
    scene: THREE.Scene;
    active: boolean;
    speed: number;
    time: number;
    hp: number;
    maxHp: number;
    type: string;
    state: UfoState;
    stateTimer: number;
    mesh: THREE.Group;
    coreMat: THREE.MeshStandardMaterial;
    core: THREE.Mesh;
    ringMat: THREE.MeshStandardMaterial;
    ring: THREE.Mesh;
    boundingBox: THREE.Box3;
    target: THREE.Vector3;
    velocity: THREE.Vector3;
    baseDirection: THREE.Vector3;

    // Firing cooldown for Snipers / Spawner triggers
    actionTimer: number = 0;
    preferredDistance: number = 30;
    flashTimer: number = 0;

    // Reuse vectors to prevent per-frame garbage collection allocation
    private _desiredDir = new THREE.Vector3();
    private _separationForce = new THREE.Vector3();
    private _tempVec = new THREE.Vector3();
    private _toPlayer = new THREE.Vector3();
    private _radial = new THREE.Vector3();
    private _tangent = new THREE.Vector3();
    private _stepVec = new THREE.Vector3();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.active = false;
        this.speed = 24;
        this.time = 0;
        this.hp = 1;
        this.maxHp = 1;
        this.type = 'NORMAL';
        this.state = UfoState.SPAWN;
        this.stateTimer = 0;

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

    reset(forceType: string | null = null): void {
        this.active = true;
        this.mesh.visible = true;
        this.time = Math.random() * 10;
        this.state = UfoState.SPAWN;
        this.stateTimer = 0;
        this.actionTimer = 0;

        // Set default scales back to 1.0 before modifying
        this.mesh.scale.set(1.0, 1.0, 1.0);

        if (forceType === 'BOSS') {
            this.type = 'BOSS';
            this.mesh.scale.set(6.0, 6.0, 6.0);
            this.coreMat.color.setHex(0x00f2ff);
            this.coreMat.emissive.setHex(0x00f2ff);
            this.ringMat.color.setHex(0xff00ff);
            this.ringMat.emissive.setHex(0xff00ff);
        } else if (forceType === 'TANK') {
            this.type = 'TANK';
            this.mesh.scale.set(2.0, 2.0, 2.0);
            this.coreMat.color.setHex(0xff6600);
            this.coreMat.emissive.setHex(0xff6600);
            this.ringMat.color.setHex(0xff6600);
            this.ringMat.emissive.setHex(0xff6600);
        } else if (forceType === 'KAMIKAZE') {
            this.type = 'KAMIKAZE';
            this.mesh.scale.set(0.8, 0.8, 0.8);
            this.coreMat.color.setHex(0xff0000);
            this.coreMat.emissive.setHex(0xff0000);
            this.ringMat.color.setHex(0xff0000);
            this.ringMat.emissive.setHex(0xff0000);
        } else if (forceType === 'SNIPER') {
            this.type = 'SNIPER';
            this.mesh.scale.set(1.0, 0.6, 1.0); // Flat, aerodynamic look
            this.coreMat.color.setHex(0x8800ff); // Dark Purple core
            this.coreMat.emissive.setHex(0x8800ff);
            this.ringMat.color.setHex(0xff00ff); // Magenta outer ring
            this.ringMat.emissive.setHex(0xff00ff);
        } else if (forceType === 'SPAWNER') {
            this.type = 'SPAWNER';
            this.mesh.scale.set(1.8, 1.8, 1.8);
            this.coreMat.color.setHex(0x00ff88); // Neon Green core
            this.coreMat.emissive.setHex(0x00ff88);
            this.ringMat.color.setHex(0x00f2ff); // Cyan ring
            this.ringMat.emissive.setHex(0x00f2ff);
        } else {
            this.type = 'NORMAL';
            this.mesh.scale.set(1.2, 1.2, 1.2);
            this.coreMat.color.setHex(0xff00ff);
            this.coreMat.emissive.setHex(0xff00ff);
            this.ringMat.color.setHex(0x00f2ff);
            this.ringMat.emissive.setHex(0x00f2ff);
        }

        // Apply config-based balance stats
        const config = ENEMY_BALANCE[this.type] || ENEMY_BALANCE.NORMAL;
        this.maxHp = config.maxHp;
        this.hp = config.maxHp;
        this.speed = config.baseSpeed + (config.speedVariance > 0 ? Math.random() * config.speedVariance : 0);
        this.preferredDistance = config.preferredDistance;

        const angle = Math.random() * Math.PI * 2;
        const radius = this.type === 'BOSS' ? 110 : 70 + Math.random() * 15;
        this.mesh.position.set(
            Math.cos(angle) * radius,
            (this.type === 'BOSS' ? 25 : 8) + Math.random() * 10,
            Math.sin(angle) * radius
        );
        
        // Initial target
        this.target.set(
            (Math.random() - 0.5) * 50,
            this.mesh.position.y,
            (Math.random() - 0.5) * 50
        );

        this.baseDirection.subVectors(this.target, this.mesh.position).normalize();
        this.velocity.copy(this.baseDirection).multiplyScalar(this.speed);
    }

    getColor(): number {
        if (this.type === 'TANK') return 0xff6600;
        if (this.type === 'KAMIKAZE') return 0xff0000;
        if (this.type === 'BOSS') return 0x00f2ff;
        if (this.type === 'SNIPER') return 0x8800ff;
        if (this.type === 'SPAWNER') return 0x00ff88;
        return 0xff00ff;
    }

    separate(neighbors: Ufo[]): THREE.Vector3 {
        this._separationForce.set(0, 0, 0);
        let count = 0;
        
        for (let i = 0; i < neighbors.length; i++) {
            const other = neighbors[i];
            if (other === this || !other.active) continue;
            
            const dist = this.mesh.position.distanceTo(other.mesh.position);
            const minSeparateDist = 12 * (this.type === 'BOSS' ? 2.5 : this.type === 'TANK' || this.type === 'SPAWNER' ? 1.5 : 1.0);
            
            if (dist > 0 && dist < minSeparateDist) {
                this._tempVec.copy(this.mesh.position).sub(other.mesh.position);
                // Weight force inversely proportional to distance
                this._tempVec.normalize().divideScalar(dist);
                this._separationForce.add(this._tempVec);
                count++;
            }
        }
        
        if (count > 0) {
            this._separationForce.divideScalar(count).normalize().multiplyScalar(this.speed * 0.4);
        }
        
        return this._separationForce;
    }

    update(deltaTime: number, playerPos: THREE.Vector3, neighbors: Ufo[] = []): void {
        if (!this.active) return;

        this.time += deltaTime;
        this.stateTimer += deltaTime;
        this.actionTimer += deltaTime;

        // 1. Core AI State Machine
        if (this.state === UfoState.SPAWN) {
            if (this.stateTimer > 1.5) {
                this.state = UfoState.CHASE;
            }
        } 
        else if (this.state === UfoState.CHASE) {
            if (playerPos) {
                if (this.type === 'KAMIKAZE') {
                    // Head directly for player
                    this.target.copy(playerPos);
                    this._desiredDir.subVectors(this.target, this.mesh.position).normalize();
                    this.baseDirection.lerp(this._desiredDir, deltaTime * 2.5).normalize();
                } 
                else if (this.type === 'BOSS') {
                    // Hover and orbit at higher altitude
                    this.target.copy(playerPos).add(new THREE.Vector3(0, 30, 0));
                    this._desiredDir.subVectors(this.target, this.mesh.position).normalize();
                    this.baseDirection.lerp(this._desiredDir, deltaTime * 1.2).normalize();
                } 
                else if (this.type === 'SNIPER') {
                    // Maintain sniper range and orbit player
                    this._toPlayer.subVectors(playerPos, this.mesh.position);
                    const dist = this._toPlayer.length();
                    
                    // Orthogonal direction for orbiting
                    this._tangent.set(-this._toPlayer.z, 0, this._toPlayer.x).normalize();
                    
                    // Radial adjustment to maintain preferredDistance
                    this._radial.copy(this._toPlayer).normalize().multiplyScalar((dist - this.preferredDistance) * 0.2);
                    
                    this._desiredDir.copy(this._tangent).add(this._radial).normalize();
                    this.baseDirection.lerp(this._desiredDir, deltaTime * 1.5).normalize();

                    // Shoot at player periodically (every 3 seconds)
                    if (this.actionTimer > 3.0) {
                        this.actionTimer = 0;
                        eventBus.emit('ENEMY_SHOOT', { position: this.mesh.position.clone(), target: playerPos.clone() });
                    }
                }
                else if (this.type === 'SPAWNER') {
                    // Spawn normal UFOs every 6 seconds, fleeing player
                    this._toPlayer.subVectors(this.mesh.position, playerPos); // direction away from player
                    const dist = this._toPlayer.length();
                    
                    if (dist < this.preferredDistance) {
                        this._desiredDir.copy(this._toPlayer).normalize();
                    } else {
                        // Orbit at distance
                        this._tangent.set(-this._toPlayer.z, 0, this._toPlayer.x).normalize();
                        this._desiredDir.copy(this._tangent).normalize();
                    }
                    this.baseDirection.lerp(this._desiredDir, deltaTime * 1.0).normalize();

                    if (this.actionTimer > 6.0) {
                        this.actionTimer = 0;
                        eventBus.emit('ENEMY_SPAWN_REQUEST', { position: this.mesh.position.clone(), type: 'NORMAL' });
                    }
                }
                else if (this.type === 'TANK') {
                    // Slow approach
                    this.target.copy(playerPos);
                    this._desiredDir.subVectors(this.target, this.mesh.position).normalize();
                    this.baseDirection.lerp(this._desiredDir, deltaTime * 1.0).normalize();
                } 
                else {
                    // Normal orbits and weaves around player
                    this.target.copy(playerPos);
                    this.target.x += Math.sin(this.time * 0.8) * this.preferredDistance;
                    this.target.z += Math.cos(this.time * 0.8) * this.preferredDistance;
                    
                    this._desiredDir.subVectors(this.target, this.mesh.position).normalize();
                    this.baseDirection.lerp(this._desiredDir, deltaTime * 1.8).normalize();
                }
            }

            // State transitions (e.g. TANK charges player when in range)
            if (playerPos && this.type === 'TANK' && this.mesh.position.distanceTo(playerPos) < 45) {
                this.state = UfoState.ATTACK;
                this.stateTimer = 0;
            }
        } 
        else if (this.state === UfoState.ATTACK) {
            // Tank rushes forward at high speed
            if (this.type === 'TANK') {
                this.speed = 65;
                if (this.stateTimer > 2.2) {
                    this.state = UfoState.CHASE;
                    this.speed = 20;
                }
            }
        }

        // 2. Apply movement + Steering Separation
        if (this.type === 'KAMIKAZE') {
            // Kamikaze zig-zags wildly towards player
            this._tangent.set(-this.baseDirection.z, 0, this.baseDirection.x).normalize();
            this._tangent.multiplyScalar(Math.sin(this.time * 12) * (this.speed * 0.6));
            
            this.velocity.copy(this.baseDirection).multiplyScalar(this.speed).add(this._tangent);
        } else {
            this.velocity.copy(this.baseDirection).multiplyScalar(this.speed);
        }

        // Add separation steering force
        const sepForce = this.separate(neighbors);
        this.velocity.add(sepForce);

        // Apply position update
        this._stepVec.copy(this.velocity).multiplyScalar(deltaTime);
        this.mesh.position.add(this._stepVec);
        
        // Keep UFOs above ground plane
        const floorHeight = this.type === 'BOSS' ? 25 : this.type === 'SPAWNER' ? 12 : 8;
        if (this.mesh.position.y < floorHeight) {
            this.mesh.position.y += (floorHeight - this.mesh.position.y) * deltaTime * 5;
        }

        // Wobble & Core Pulse visual logic
        if (this.type !== 'KAMIKAZE') {
            this.mesh.rotation.z = Math.sin(this.time * 2.5) * 0.12;
            this.mesh.rotation.x = Math.cos(this.time * 1.8) * 0.08;
        } else {
            this.mesh.rotation.z = Math.sin(this.time * 12) * 0.25;
        }
        this.mesh.rotation.y += 2 * deltaTime;
        
        // Handle hit flash visual override
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
            this.coreMat.color.setHex(0xffffff);
            this.coreMat.emissive.setHex(0xffffff);
            this.coreMat.emissiveIntensity = 8.0;
        } else {
            // Restore original core color based on type
            let origColor = 0xff00ff; // NORMAL
            if (this.type === 'BOSS') origColor = 0x00f2ff;
            else if (this.type === 'TANK') origColor = 0xff6600;
            else if (this.type === 'KAMIKAZE') origColor = 0xff0000;
            else if (this.type === 'SNIPER') origColor = 0x8800ff;
            else if (this.type === 'SPAWNER') origColor = 0x00ff88;
            
            this.coreMat.color.setHex(origColor);
            this.coreMat.emissive.setHex(origColor);
            this.coreMat.emissiveIntensity = 2.0 + Math.sin(this.time * 8) * 1.0;
        }
        
        this.ring.rotation.z -= 4 * deltaTime;

        this.boundingBox.setFromObject(this.mesh);

        // Cleanup out-of-bounds or deep fallen UFOs
        if (this.mesh.position.length() > 500 || this.mesh.position.y < -10) {
            this.destroy();
        }
    }

    takeDamage(amount: number): boolean {
        this.hp -= amount;
        this.flashTimer = 0.15; // Trigger hit flash
        return this.hp <= 0;
    }

    destroy(): void {
        if (!this.active) return;
        this.active = false;
        this.mesh.visible = false;
    }
}
