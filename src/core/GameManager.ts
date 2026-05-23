import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { InputManager } from '../InputManager';
import { Bullet } from '../Bullet';
import { Tank } from '../Tank';
import { Ufo } from '../Ufo';
import { CameraController } from '../CameraController';
import { ObjectPool } from '../ObjectPool';
import { ParticleSystem } from '../ParticleSystem';
import { AudioManager } from '../AudioManager';
import { PowerUp } from '../PowerUp';
import { DamageNumberManager } from '../DamageNumberManager';
import { WaveManager } from '../WaveManager';
import { eventBus } from '../EventBus';
import { playerProfile } from '../PlayerProfileStore';
import { BaseTank, MediumTank, LightTank, HeavyTank } from '../tanks/TankClasses';

export type GameState = 'menu' | 'playing' | 'gameover';

export class GameManager {
    state: GameState = 'menu';
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    bloomPass: UnrealBloomPass;
    bloomEnabled: boolean = true;
    
    // Core game components
    inputManager: InputManager;
    audioManager: AudioManager;
    tank!: Tank;
    cameraController!: CameraController;
    particleSystem: ParticleSystem;
    powerUp: PowerUp;
    damageNumberManager: DamageNumberManager;
    waveManager: WaveManager;
    
    ufos: Ufo[] = [];
    ufoPool: ObjectPool<Ufo>;

    // Enemy projectiles
    enemyBullets: Bullet[] = [];
    enemyBulletPool: ObjectPool<Bullet>;
    
    // Clock & Timers
    clock = new THREE.Clock();
    hitstopTimer = 0;
    combo = 0;
    comboTimer = 0;
    score = 0;
    
    // Raycasting for 3rd person aim
    raycaster = new THREE.Raycaster();
    groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    aimPoint = new THREE.Vector3(0, 0, 0);
    aimCursor!: THREE.Mesh;

    // Scenario additions
    pillarRings: THREE.Mesh[] = [];
    dustPoints!: THREE.Points;
    dustVelocities: number[] = [];
    
    // Performance metrics
    fpsTimer = 0;
    framesCount = 0;
    avgFps = 60;
    
    // DOM elements cache
    ui: Record<string, HTMLElement | null> = {};

    constructor(canvas: HTMLCanvasElement) {
        // 1. Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020205); 
        this.scene.fog = new THREE.FogExp2(0x020205, 0.006); // Reduced fog density to improve map/UFO visibility

        // 2. Camera setup
        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

        // 3. Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            canvas,
            antialias: false, 
            powerPreference: "high-performance" 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 4. Post-processing setup
        const renderScene = new RenderPass(this.scene, this.camera);
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight), 
            1.2, 0.55, 0.21
        );
        this.bloomPass.threshold = 0.21;
        this.bloomPass.strength = 1.2;
        this.bloomPass.radius = 0.55;

        const outputPass = new OutputPass();
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(outputPass);

        // 5. Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Key Light (Cyan)
        const dirLight = new THREE.DirectionalLight(0x00f2ff, 1.0);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);

        // Fill Light (Magenta)
        const fillLight = new THREE.DirectionalLight(0xff00ff, 0.45);
        fillLight.position.set(-50, 50, -50);
        this.scene.add(fillLight);

        // 6. Environment (Neon Grid & Ambient barriers)
        this.createEnvironment();

        // 7. Core systems
        this.audioManager = new AudioManager();
        this.inputManager = new InputManager(this.renderer.domElement);
        this.particleSystem = new ParticleSystem(this.scene);
        this.powerUp = new PowerUp(this.scene);
        this.damageNumberManager = new DamageNumberManager(this.camera);
        
        this.ufoPool = new ObjectPool<Ufo>(() => new Ufo(this.scene));
        this.waveManager = new WaveManager((type: string) => {
            const ufo = this.ufoPool.get();
            ufo.reset(type);
            this.ufos.push(ufo);
        });

        // Pools for enemy bullets
        this.enemyBulletPool = new ObjectPool<Bullet>(() => new Bullet(this.scene));

        // 8. Aim Cursor Mesh (Neon circle on the ground)
        this.createAimCursor();

        // Initialize Tank (default to MediumTank, can change in selection)
        this.selectTankClass(new MediumTank());

        // Cache UI
        this.cacheUIElements();
        this.setupEventHandlers();
        
        // Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    createEnvironment(): void {
        const gridHelper = new THREE.GridHelper(1000, 100, 0x00f2ff, 0x111111);
        gridHelper.position.y = -0.05;
        this.scene.add(gridHelper);

        const groundGeo = new THREE.PlaneGeometry(1000, 1000);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x050505, 
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Beautiful energy barriers/props around the arena center to make it "vivo e bonito"
        const pillarMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a14,
            roughness: 0.2,
            metalness: 0.8
        });
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.8
        });

        const pillarPositions = [
            [-50, -50], [-50, 50], [50, -50], [50, 50]
        ];

        pillarPositions.forEach(([x, z]) => {
            const group = new THREE.Group();
            group.position.set(x, 0, z);

            const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 12, 8), pillarMat);
            base.position.y = 6;
            base.castShadow = true;
            base.receiveShadow = true;
            group.add(base);

            const rings = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.15, 8, 24), glowMat);
            rings.rotation.x = Math.PI / 2;
            rings.position.y = 6;
            group.add(rings);
            this.pillarRings.push(rings); // Store reference for rotation

            const rings2 = rings.clone() as THREE.Mesh;
            rings2.position.y = 10;
            group.add(rings2);
            this.pillarRings.push(rings2); // Store reference for rotation

            this.scene.add(group);
        });

        // 2. Holographic Boundary Walls (at x = ±60 and z = ±60)
        const wallMat = new THREE.MeshBasicMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.1,
            wireframe: true,
            side: THREE.DoubleSide
        });
        const wallLength = 120;
        const wallHeight = 15;

        // North wall
        const wallN = new THREE.Mesh(new THREE.PlaneGeometry(wallLength, wallHeight, 24, 4), wallMat);
        wallN.position.set(0, wallHeight / 2, -60);
        this.scene.add(wallN);

        // South wall
        const wallS = new THREE.Mesh(new THREE.PlaneGeometry(wallLength, wallHeight, 24, 4), wallMat);
        wallS.position.set(0, wallHeight / 2, 60);
        this.scene.add(wallS);

        // East wall
        const wallE = new THREE.Mesh(new THREE.PlaneGeometry(wallLength, wallHeight, 24, 4), wallMat);
        wallE.rotation.y = Math.PI / 2;
        wallE.position.set(60, wallHeight / 2, 0);
        this.scene.add(wallE);

        // West wall
        const wallW = new THREE.Mesh(new THREE.PlaneGeometry(wallLength, wallHeight, 24, 4), wallMat);
        wallW.rotation.y = -Math.PI / 2;
        wallW.position.set(-60, wallHeight / 2, 0);
        this.scene.add(wallW);

        // Glowing Top Lines for Boundary
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.7
        });

        const createTopLine = (p1: THREE.Vector3, p2: THREE.Vector3) => {
            const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            const line = new THREE.Line(geo, lineMat);
            this.scene.add(line);
        };

        createTopLine(new THREE.Vector3(-60, wallHeight, -60), new THREE.Vector3(60, wallHeight, -60));
        createTopLine(new THREE.Vector3(-60, wallHeight, 60), new THREE.Vector3(60, wallHeight, 60));
        createTopLine(new THREE.Vector3(-60, wallHeight, -60), new THREE.Vector3(-60, wallHeight, 60));
        createTopLine(new THREE.Vector3(60, wallHeight, -60), new THREE.Vector3(60, wallHeight, 60));

        // 3. Floating Ambient Neon Dust Particles
        const dustGeo = new THREE.BufferGeometry();
        const dustCount = 200;
        const dustPositions = new Float32Array(dustCount * 3);
        
        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = (Math.random() - 0.5) * 120;
            dustPositions[i * 3 + 1] = Math.random() * 30;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
            
            // Random vx, vy, vz
            this.dustVelocities.push(
                (Math.random() - 0.5) * 1.5, // vx
                -(Math.random() * 1.5 + 0.5), // vy (drifting downwards)
                (Math.random() - 0.5) * 1.5  // vz
            );
        }
        
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
        const dustMat = new THREE.PointsMaterial({
            color: 0x00f2ff,
            size: 0.35,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.dustPoints = new THREE.Points(dustGeo, dustMat);
        this.scene.add(this.dustPoints);
    }

    createAimCursor(): void {
        const ringGeo = new THREE.RingGeometry(1.2, 1.4, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00f2ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        });
        this.aimCursor = new THREE.Mesh(ringGeo, ringMat);
        this.aimCursor.rotation.x = -Math.PI / 2;
        this.aimCursor.position.y = 0.05; // Slightly above ground
        this.scene.add(this.aimCursor);
    }

    selectTankClass(tankClass: BaseTank): void {
        // Cleanup old tank if exists
        if (this.tank) {
            this.tank.destroy();
        }

        // Set aimCursor color theme to match class
        let classColor = 0x00f2ff;
        if (tankClass instanceof LightTank) classColor = 0xff00ff;
        else if (tankClass instanceof HeavyTank) classColor = 0xff8800;
        (this.aimCursor.material as THREE.MeshBasicMaterial).color.setHex(classColor);

        this.tank = new Tank(this.scene, this.inputManager, () => {
            this.audioManager.playLaser();
            this.cameraController.addTrauma(0.15);
        }, tankClass);

        this.cameraController = new CameraController(this.camera, this.tank);
    }

    cacheUIElements(): void {
        const ids = [
            'wave', 'score', 'credits', 'nanobytes', 'menu', 'game-over', 
            'final-score', 'start-btn', 'restart-btn', 'boss-ui', 'boss-hp-bar',
            'upg-fire-lvl', 'btn-upg-fire', 'upg-speed-lvl', 'btn-upg-speed', 
            'daily-reward-btn', 'revive-btn'
        ];
        ids.forEach(id => {
            this.ui[id] = document.getElementById(id);
        });
    }

    setupEventHandlers(): void {
        eventBus.on('WAVE_STARTED', (data) => {
            if (this.ui.wave) this.ui.wave.innerText = data.wave.toString();
            const currentWave = this.waveManager.getCurrentWave();
            if (currentWave.bossWave) {
                if (this.ui['boss-ui']) {
                    this.ui['boss-ui'].style.display = 'block';
                    if (this.ui['boss-hp-bar']) this.ui['boss-hp-bar'].style.width = '100%';
                }
            } else {
                if (this.ui['boss-ui']) this.ui['boss-ui'].style.display = 'none';
            }
        });

        // Setup revive button click
        if (this.ui['revive-btn']) {
            this.ui['revive-btn'].addEventListener('click', () => {
                this.revivePlayer();
            });
        }

        // Setup enemy projectile spawning handler
        eventBus.on('ENEMY_SHOOT', (data) => {
            const bullet = this.enemyBulletPool.get();
            const dir = new THREE.Vector3().subVectors(data.target, data.position).normalize();
            const rot = new THREE.Euler(0, Math.atan2(dir.x, dir.z) + Math.PI, 0);
            
            bullet.reset(data.position, rot);
            bullet.velocity.copy(dir).multiplyScalar(75); // slower projectile for dodging
            bullet.setVisualColor(0x8800ff); // Purple lasers for enemies
            this.enemyBullets.push(bullet);
        });

        // Setup enemy minion spawning handler
        eventBus.on('ENEMY_SPAWN_REQUEST', (data) => {
            const ufo = this.ufoPool.get();
            ufo.reset(data.type);
            ufo.mesh.position.copy(data.position);
            // Spawn height slight override
            ufo.mesh.position.y = 8;
            this.ufos.push(ufo);
            
            // Spawn portal particle effect
            this.particleSystem.explode(data.position, 0x00ff88, 15);
        });
    }

    updateUI(): void {
        if (this.ui.score) this.ui.score.innerText = this.score.toString();
        if (this.ui.credits) this.ui.credits.innerText = playerProfile.get().credits.toString();
        if (this.ui.nanobytes) this.ui.nanobytes.innerText = playerProfile.get().nanobytes.toString();
        
        const upg = playerProfile.get().upgrades;
        if (this.ui['upg-fire-lvl']) this.ui['upg-fire-lvl'].innerText = upg.fireRate.toString();
        if (this.ui['btn-upg-fire']) {
            const cost = 100 * Math.pow(2, upg.fireRate);
            this.ui['btn-upg-fire'].innerText = upg.fireRate >= 5 ? 'MAX' : `BUY (${cost} C)`;
            (this.ui['btn-upg-fire'] as HTMLButtonElement).style.opacity = (upg.fireRate >= 5 || playerProfile.get().credits < cost) ? '0.5' : '1';
        }
        
        if (this.ui['upg-speed-lvl']) this.ui['upg-speed-lvl'].innerText = upg.speed.toString();
        if (this.ui['btn-upg-speed']) {
            const cost = 100 * Math.pow(2, upg.speed);
            this.ui['btn-upg-speed'].innerText = upg.speed >= 5 ? 'MAX' : `BUY (${cost} C)`;
            (this.ui['btn-upg-speed'] as HTMLButtonElement).style.opacity = (upg.speed >= 5 || playerProfile.get().credits < cost) ? '0.5' : '1';
        }
    }

    saveData(): void {
        if (this.score > playerProfile.get().highScore) {
            playerProfile.get().highScore = this.score;
        }
        playerProfile.save();
    }

    resetGame(): void {
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.updateUI();
        this.tank.mesh.position.set(0, 0, 0);
        this.tank.velocity = 0;
        
        this.ufos.forEach(ufo => {
            ufo.destroy();
            this.ufoPool.release(ufo);
        });
        this.ufos.length = 0;

        this.enemyBullets.forEach(eb => {
            eb.destroy();
            this.enemyBulletPool.release(eb);
        });
        this.enemyBullets.length = 0;
        
        this.waveManager.start();
        this.state = 'playing';
        if (this.ui.menu) this.ui.menu.style.display = 'none';
        if (this.ui['game-over']) this.ui['game-over'].style.display = 'none';
        this.audioManager.playClick();
        this.audioManager.startMusic();
    }

    revivePlayer(): void {
        let success = false;
        if (playerProfile.get().nanobytes >= 2) {
            success = playerProfile.spendPremium(2);
        } else if (playerProfile.get().credits >= 200) {
            success = playerProfile.spendCredits(200);
        }
        
        if (success) {
            this.state = 'playing';
            if (this.ui['game-over']) this.ui['game-over'].style.display = 'none';
            this.tank.mesh.position.set(0, 0, 0);
            this.tank.velocity = 0;
            this.audioManager.playClick();
            this.audioManager.startMusic();
            this.updateUI();
        }
    }

    onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    updateAimPoint(): void {
        // Raycast from camera using mouse coordinates to find intersection with y=0 plane
        this.raycaster.setFromCamera(this.inputManager.keys.mouseNDC, this.camera);
        this.raycaster.ray.intersectPlane(this.groundPlane, this.aimPoint);
        
        // Update aim cursor mesh position
        this.aimCursor.position.copy(this.aimPoint);
        this.aimCursor.position.y = 0.05; // Keep slightly above grid

        // Rotate cursor ring to add visual flair
        this.aimCursor.rotation.z += 0.01;
    }

    start(): void {
        this.clock.getDelta(); // reset clock
        this.animate(0);
    }

    animate = (time: number): void => {
        requestAnimationFrame(this.animate);
        const normalDelta = this.clock.getDelta();
        let deltaTime = normalDelta;

        // Post-processing optimization with hysteresis
        this.fpsTimer += normalDelta;
        this.framesCount++;
        if (this.fpsTimer > 1.0) {
            this.avgFps = this.framesCount;
            if (this.avgFps < 35 && this.bloomEnabled) {
                this.composer.removePass(this.bloomPass);
                this.bloomEnabled = false;
                console.log("Optimizing performance: disabling bloom");
            } else if (this.avgFps > 50 && !this.bloomEnabled) {
                // Reinsert bloom after RenderPass
                this.composer.insertPass(this.bloomPass, 1);
                this.bloomEnabled = true;
                console.log("Performance recovered: enabling bloom");
            }
            this.fpsTimer = 0;
            this.framesCount = 0;
        }

        if (this.hitstopTimer > 0) {
            this.hitstopTimer -= normalDelta;
            this.composer.render();
            return;
        }

        if (this.state === 'playing') {
            // Update aim raycasting
            this.updateAimPoint();

            // Pass aimPoint to tank update
            this.tank.updateAim(this.aimPoint);

            if (this.comboTimer > 0) {
                this.comboTimer -= normalDelta;
                if (this.comboTimer <= 0) {
                    this.combo = 0;
                }
            }
            
            this.audioManager.setCombo(this.combo);

            if (this.tank.powerUpType === 'SLOW') {
                deltaTime *= 0.3; // 30% speed for enemies
            }

            this.tank.update(normalDelta); // Tank moves at normal speed
            this.waveManager.update(time, deltaTime);

            this.powerUp.update(normalDelta);
            if (this.powerUp.active && this.tank.mesh.position.distanceTo(this.powerUp.mesh.position) < 4) {
                const collectedType = this.powerUp.collect();
                if (collectedType) {
                    this.tank.applyPowerUp(collectedType);
                    this.audioManager.playClick();
                }
            }

            // Update UFO positions (passing array of neighbors for separation steering)
            for (let i = this.ufos.length - 1; i >= 0; i--) {
                const ufo = this.ufos[i];
                ufo.update(deltaTime, this.tank.mesh.position, this.ufos);
                if (!ufo.active) {
                    this.ufoPool.release(ufo);
                    this.ufos.splice(i, 1);
                }
            }

            // Update enemy bullet positions
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                const eb = this.enemyBullets[i];
                eb.update(normalDelta);
                if (!eb.active) {
                    this.enemyBulletPool.release(eb);
                    this.enemyBullets.splice(i, 1);
                }
            }

            this.checkCollisions();
            this.particleSystem.update(normalDelta);
            this.damageNumberManager.update(normalDelta);
            this.cameraController.update(normalDelta, this.combo);

            // 7. Update environmental floating dust particles
            const dustPosAttr = this.dustPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
            const positions = dustPosAttr.array as Float32Array;
            const dustCount = positions.length / 3;
            for (let i = 0; i < dustCount; i++) {
                positions[i * 3] += this.dustVelocities[i * 3] * normalDelta;
                positions[i * 3 + 1] += this.dustVelocities[i * 3 + 1] * normalDelta;
                positions[i * 3 + 2] += this.dustVelocities[i * 3 + 2] * normalDelta;
                
                // Reset dust particle if it goes out of bounds or falls below ground
                if (positions[i * 3 + 1] <= 0 || Math.abs(positions[i * 3]) > 60 || Math.abs(positions[i * 3 + 2]) > 60) {
                    positions[i * 3] = (Math.random() - 0.5) * 120;
                    positions[i * 3 + 1] = 30; // spawn back at top
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
                }
            }
            dustPosAttr.needsUpdate = true;

            // 8. Rotate pillar torus rings in alternating directions
            this.pillarRings.forEach((ring, index) => {
                const rotDirection = index % 2 === 0 ? 1 : -1;
                ring.rotation.z += rotDirection * normalDelta * 1.5;
            });
            
            if (time % 1000 < 20) this.saveData();
        }

        this.composer.render();
    };

    onPlayerHit(): void {
        const isShielded = this.tank.powerUpType === 'SHIELD' || 
                           (this.tank.tankStats instanceof MediumTank && this.tank.abilityActive);
        
        if (this.tank.invulnerable) {
            // Invulnerable (e.g. Light Tank dashing)
            return;
        }

        if (isShielded) {
            if (this.tank.powerUpType === 'SHIELD') {
                this.tank.powerUpType = null; // Consume powerup shield
            }
            this.audioManager.playExplosion();
            this.cameraController.addTrauma(0.5);
            this.particleSystem.explode(this.tank.mesh.position, 0xff00ff, 15);
            eventBus.emit('PLAYER_HIT', { shielded: true });
        } else {
            // Game Over
            this.state = 'gameover';
            this.audioManager.playExplosion();
            this.audioManager.stopMusic();
            this.cameraController.addTrauma(1.0);
            this.particleSystem.explode(this.tank.mesh.position, 0xff0000, 40);
            eventBus.emit('PLAYER_HIT', { shielded: false });
            eventBus.emit('GAME_OVER', { score: this.score });
            if (this.ui['final-score']) this.ui['final-score'].innerText = this.score.toString();
            if (this.ui['game-over']) this.ui['game-over'].style.display = 'block';
            this.saveData();
        }
    }

    checkCollisions(): void {
        // Collide player bullets with enemies
        for (let i = this.ufos.length - 1; i >= 0; i--) {
            const ufo = this.ufos[i];
            let ufoHit = false;

            for (let j = this.tank.bullets.length - 1; j >= 0; j--) {
                const bullet = this.tank.bullets[j];

                if (bullet.active && ufo.boundingBox.intersectsBox(bullet.boundingBox)) {
                    bullet.destroy();
                    ufoHit = true;
                    break;
                }
            }

            if (ufoHit) {
                const damageDealt = this.tank.powerUpType === 'TRIPLE' ? 25 : this.tank.tankStats.damage;
                const isCrit = Math.random() > 0.8;
                const finalDamage = isCrit ? damageDealt * 2 : damageDealt;

                // BUG FIX 2: Apply finalDamage instead of 1
                if (ufo.takeDamage(finalDamage)) {
                    this.audioManager.playExplosion();
                    this.cameraController.addTrauma(ufo.type === 'TANK' || ufo.type === 'BOSS' ? 0.8 : 0.4);
                    
                    const color = ufo.getColor();
                    let colorStr = '#ff00ff';
                    if (ufo.type === 'TANK') colorStr = '#ff6600';
                    else if (ufo.type === 'KAMIKAZE') colorStr = '#ff0000';
                    else if (ufo.type === 'BOSS') colorStr = '#00f2ff';
                    else if (ufo.type === 'SNIPER') colorStr = '#8800ff';
                    else if (ufo.type === 'SPAWNER') colorStr = '#00ff88';

                    this.particleSystem.explode(ufo.mesh.position, color, ufo.type === 'BOSS' ? 50 : 20);
                    if (this.damageNumberManager) this.damageNumberManager.spawn(finalDamage, ufo.mesh.position, colorStr, isCrit);
                    
                    this.hitstopTimer = (ufo.type === 'TANK' || ufo.type === 'BOSS') ? 0.08 : 0.03; 
                    this.combo += 1;
                    this.comboTimer = 3.0;
                    
                    if (ufo.type === 'BOSS') {
                        this.score += 3000;
                        playerProfile.get().credits += 150;
                        playerProfile.get().nanobytes += 5; // Boss drops premium currency
                        playerProfile.addXP(1000);
                        if (this.ui['boss-ui']) this.ui['boss-ui'].style.display = 'none';
                    } else if (ufo.type === 'TANK') {
                        this.score += 500;
                        playerProfile.get().credits += 25;
                        playerProfile.addXP(150);
                    } else if (ufo.type === 'SNIPER') {
                        this.score += 250;
                        playerProfile.get().credits += 15;
                        playerProfile.addXP(100);
                    } else if (ufo.type === 'SPAWNER') {
                        this.score += 400;
                        playerProfile.get().credits += 30;
                        playerProfile.addXP(200);
                    } else if (ufo.type === 'KAMIKAZE') {
                        this.score += 150;
                        playerProfile.get().credits += 10;
                        playerProfile.addXP(75);
                    } else {
                        this.score += 100;
                        playerProfile.get().credits += 5;
                        playerProfile.addXP(50);
                    }
                    
                    this.updateUI();
                    eventBus.emit('ENEMY_KILLED', { type: ufo.type, score: this.score, credits: playerProfile.get().credits });
                    
                    const powerUpChance = ufo.type === 'TANK' || ufo.type === 'BOSS' ? 1.0 : 0.15;
                    if (Math.random() < powerUpChance && !this.powerUp.active) {
                        const types = ['TRIPLE', 'SHIELD', 'SLOW'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        this.powerUp.spawn(ufo.mesh.position, type);
                    }

                    ufo.destroy();
                    this.ufoPool.release(ufo);
                    this.ufos.splice(i, 1);
                } else {
                    if (ufo.type === 'BOSS') {
                        if (this.ui['boss-hp-bar']) this.ui['boss-hp-bar'].style.width = `${(ufo.hp / ufo.maxHp) * 100}%`;
                    }
                    this.particleSystem.explode(ufo.mesh.position, 0xffffff, 3); // mini spark
                    if (this.damageNumberManager) this.damageNumberManager.spawn(finalDamage, ufo.mesh.position, '#ffffff', isCrit);
                    this.audioManager.playClick(); // small hit sound
                }
                continue;
            }

            // Tank vs UFO Collision
            if (this.tank.boundingBox && ufo.boundingBox.intersectsBox(this.tank.boundingBox)) {
                ufo.destroy();
                this.ufoPool.release(ufo);
                this.ufos.splice(i, 1);
                
                this.onPlayerHit();
            }
        }

        // Collide enemy bullets with player tank
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            if (eb.active && this.tank.boundingBox && eb.boundingBox.intersectsBox(this.tank.boundingBox)) {
                eb.destroy();
                this.enemyBulletPool.release(eb);
                this.enemyBullets.splice(i, 1);
                
                this.onPlayerHit();
            }
        }
    }
}
