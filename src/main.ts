import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { InputManager } from './InputManager';
import { Tank } from './Tank';
import { Ufo } from './Ufo';
import { CameraController } from './CameraController';
import { ObjectPool } from './ObjectPool';
import { ParticleSystem } from './ParticleSystem';
import { AudioManager } from './AudioManager';
import { PowerUp } from './PowerUp';
import { eventBus } from './EventBus';
import { DamageNumberManager } from './DamageNumberManager';
import { WaveManager } from './WaveManager';

// --- Game State & Economy ---
const GAME_STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAMEOVER: 'GAMEOVER'
};
let currentState = GAME_STATE.MENU;

let score = 0;
import { playerProfile } from './PlayerProfileStore';

const ui = {
    wave: document.getElementById('wave') as HTMLElement,
    score: document.getElementById('score') as HTMLElement,
    credits: document.getElementById('credits') as HTMLElement,
    nanobytes: document.getElementById('nanobytes') as HTMLElement,
    menu: document.getElementById('menu') as HTMLElement,
    gameOver: document.getElementById('game-over') as HTMLElement,
    finalScore: document.getElementById('final-score') as HTMLElement,
    startBtn: document.getElementById('start-btn') as HTMLElement,
    restartBtn: document.getElementById('restart-btn') as HTMLElement,
    bossUi: document.getElementById('boss-ui') as HTMLElement,
    bossHp: document.getElementById('boss-hp-bar') as HTMLElement,
    upgFireLvl: document.getElementById('upg-fire-lvl') as HTMLElement,
    btnUpgFire: document.getElementById('btn-upg-fire') as HTMLElement,
    upgSpeedLvl: document.getElementById('upg-speed-lvl') as HTMLElement,
    btnUpgSpeed: document.getElementById('btn-upg-speed') as HTMLElement,
    btnDaily: document.getElementById('daily-reward-btn') as HTMLButtonElement
};

function updateUI() {
    if (ui.score) ui.score.innerText = score.toString();
    if (ui.credits) ui.credits.innerText = playerProfile.get().credits.toString();
    if (ui.nanobytes) ui.nanobytes.innerText = playerProfile.get().nanobytes.toString();
    
    // Update Menu Upgrades
    if (currentState === GAME_STATE.MENU || currentState === GAME_STATE.GAMEOVER) {
        const upg = playerProfile.get().upgrades;
        if (ui.upgFireLvl) ui.upgFireLvl.innerText = upg.fireRate.toString();
        if (ui.btnUpgFire) {
            const cost = 100 * Math.pow(2, upg.fireRate);
            ui.btnUpgFire.innerText = upg.fireRate >= 5 ? 'MAX' : `BUY (${cost} C)`;
            ui.btnUpgFire.style.opacity = (upg.fireRate >= 5 || playerProfile.get().credits < cost) ? '0.5' : '1';
        }
        
        if (ui.upgSpeedLvl) ui.upgSpeedLvl.innerText = upg.speed.toString();
        if (ui.btnUpgSpeed) {
            const cost = 100 * Math.pow(2, upg.speed);
            ui.btnUpgSpeed.innerText = upg.speed >= 5 ? 'MAX' : `BUY (${cost} C)`;
            ui.btnUpgSpeed.style.opacity = (upg.speed >= 5 || playerProfile.get().credits < cost) ? '0.5' : '1';
        }
    }
}

function saveData() {
    if (score > playerProfile.get().highScore) {
        playerProfile.get().highScore = score;
    }
    playerProfile.save();
}

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205); 
scene.fog = new THREE.FogExp2(0x020205, 0.008);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- Post-Processing ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.21;
bloomPass.strength = 1.2;
bloomPass.radius = 0.55;

const outputPass = new OutputPass();

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x00f2ff, 1.0);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

// --- Environment (Neon Grid) ---
const gridHelper = new THREE.GridHelper(1000, 100, 0x00f2ff, 0x111111);
gridHelper.position.y = -0.05;
scene.add(gridHelper);

const groundGeo = new THREE.PlaneGeometry(1000, 1000);
const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x050505, 
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Game Objects ---
const audioManager = new AudioManager();
const inputManager = new InputManager(renderer.domElement);
const tank = new Tank(scene, inputManager, () => {
    audioManager.playLaser();
    cameraController.addTrauma(0.15);
});
const cameraController = new CameraController(camera, tank);
const ufos: Ufo[] = [];
const ufoPool = new ObjectPool<Ufo>(() => new Ufo(scene));
const particleSystem = new ParticleSystem(scene);
const powerUp = new PowerUp(scene);
const damageNumberManager = new DamageNumberManager(camera);
const waveManager = new WaveManager((type: string) => {
    const ufo = ufoPool.get();
    ufo.reset(type);
    ufos.push(ufo);
});

eventBus.on('WAVE_STARTED', (data: any) => {
    if (ui.wave) ui.wave.innerText = data.wave.toString();
});

// --- Game Logic ---
let hitstopTimer = 0;
let combo = 0;
let comboTimer = 0;

function resetGame() {
    score = 0;
    updateUI();
    tank.mesh.position.set(0, 0, 0);
    tank.velocity = 0;
    ufos.forEach(ufo => {
        ufo.destroy();
        ufoPool.release(ufo);
    });
    ufos.length = 0;
    waveManager.start();
    currentState = GAME_STATE.PLAYING;
    if (ui.menu) ui.menu.style.display = 'none';
    if (ui.gameOver) ui.gameOver.style.display = 'none';
    audioManager.playClick();
    audioManager.startMusic();
}

if (ui.startBtn) ui.startBtn.addEventListener('click', () => resetGame());
if (ui.restartBtn) ui.restartBtn.addEventListener('click', () => resetGame());

if (ui.btnUpgFire) ui.btnUpgFire.addEventListener('click', () => {
    if (playerProfile.buyUpgrade('fireRate')) updateUI();
});
if (ui.btnUpgSpeed) ui.btnUpgSpeed.addEventListener('click', () => {
    if (playerProfile.buyUpgrade('speed')) updateUI();
});

if (ui.btnDaily) {
    const lastClaim = localStorage.getItem('neon_daily_reward');
    const now = Date.now();
    const canClaim = !lastClaim || (now - parseInt(lastClaim)) > 86400000;
    
    if (!canClaim) {
        ui.btnDaily.disabled = true;
        ui.btnDaily.style.opacity = '0.5';
        ui.btnDaily.innerText = 'REWARD CLAIMED';
    }

    ui.btnDaily.addEventListener('click', () => {
        if (!ui.btnDaily.disabled) {
            playerProfile.get().credits += 500;
            playerProfile.save();
            localStorage.setItem('neon_daily_reward', Date.now().toString());
            ui.btnDaily.disabled = true;
            ui.btnDaily.style.opacity = '0.5';
            ui.btnDaily.innerText = 'REWARD CLAIMED';
            updateUI();
            audioManager.playClick();
            eventBus.emit('DAILY_REWARD_CLAIMED', { credits: 500 });
        }
    });
}

function checkCollisions() {
    for (let i = ufos.length - 1; i >= 0; i--) {
        const ufo = ufos[i];
        let ufoHit = false;

        for (let j = tank.bullets.length - 1; j >= 0; j--) {
            const bullet = tank.bullets[j];

            if (bullet.active && ufo.boundingBox.intersectsBox(bullet.boundingBox)) {
                bullet.destroy();
                ufoHit = true;
                break;
            }
        }

        if (ufoHit) {
            const damageDealt = tank.powerUpType === 'TRIPLE' ? 25 : 50;
            const isCrit = Math.random() > 0.8;
            const finalDamage = isCrit ? damageDealt * 2 : damageDealt;

            if (ufo.takeDamage(1)) {
                audioManager.playExplosion();
                cameraController.addTrauma(ufo.type === 'TANK' || ufo.type === 'BOSS' ? 0.8 : 0.4);
                
                let color = 0xff00ff;
                let colorStr = '#ff00ff';
                if (ufo.type === 'TANK') { color = 0xff6600; colorStr = '#ff6600'; }
                else if (ufo.type === 'KAMIKAZE') { color = 0xff0000; colorStr = '#ff0000'; }
                else if (ufo.type === 'BOSS') { color = 0x00f2ff; colorStr = '#00f2ff'; }

                particleSystem.explode(ufo.mesh.position, color);
                if (damageNumberManager) damageNumberManager.spawn(finalDamage, ufo.mesh.position, colorStr, isCrit);
                
                hitstopTimer = (ufo.type === 'TANK' || ufo.type === 'BOSS') ? 0.08 : 0.03; 
                combo += 1;
                comboTimer = 3.0;
                
                if (ufo.type === 'BOSS') {
                    score += 2000;
                    playerProfile.get().credits += 100;
                    playerProfile.get().nanobytes += 5; // Boss drops premium currency
                    playerProfile.addXp(500);
                    if (ui.bossUi) ui.bossUi.style.display = 'none';
                } else if (ufo.type === 'TANK') {
                    score += 500;
                    playerProfile.get().credits += 25;
                    playerProfile.addXp(150);
                } else {
                    score += 100;
                    playerProfile.get().credits += 5;
                    playerProfile.addXp(50);
                }
                
                updateUI();
                eventBus.emit('ENEMY_KILLED', { type: ufo.type, score, credits: playerProfile.get().credits });
                
                const powerUpChance = ufo.type === 'TANK' || ufo.type === 'BOSS' ? 1.0 : 0.15;
                if (Math.random() < powerUpChance && !powerUp.active) {
                    const types = ['TRIPLE', 'SHIELD', 'SLOW'];
                    const type = types[Math.floor(Math.random() * types.length)];
                    powerUp.spawn(ufo.mesh.position, type);
                }

                ufo.destroy();
                ufoPool.release(ufo);
                ufos.splice(i, 1);
            } else {
                if (ufo.type === 'BOSS') {
                    if (ui.bossHp) ui.bossHp.style.width = `${(ufo.hp / ufo.maxHp) * 100}%`;
                }
                particleSystem.explode(ufo.mesh.position, 0xffffff); // mini spark
                if (damageNumberManager) damageNumberManager.spawn(finalDamage, ufo.mesh.position, '#ffffff', isCrit);
                audioManager.playClick(); // small hit sound
            }
            continue;
        }

        // Tank vs UFO Collision (Player Death)
        if (tank.boundingBox && ufo.boundingBox.intersectsBox(tank.boundingBox)) {
            if (tank.powerUpType === 'SHIELD') {
                tank.powerUpType = null; // Consume shield
                audioManager.playExplosion();
                cameraController.addTrauma(0.5);
                particleSystem.explode(ufo.mesh.position, 0xff00ff);
                eventBus.emit('PLAYER_HIT', { shielded: true });
                ufo.destroy();
                ufoPool.release(ufo);
                ufos.splice(i, 1);
            } else {
                // Game Over
                currentState = GAME_STATE.GAMEOVER;
                audioManager.playExplosion();
                audioManager.stopMusic();
                cameraController.addTrauma(1.0);
                particleSystem.explode(tank.mesh.position, 0xff0000);
                eventBus.emit('PLAYER_HIT', { shielded: false });
                eventBus.emit('GAME_OVER', { score });
                if (ui.finalScore) ui.finalScore.innerText = score.toString();
                if (ui.gameOver) ui.gameOver.style.display = 'block';
                document.exitPointerLock();
                saveData();
            }
        }
    }
}

// --- Main Loop ---
const clock = new THREE.Clock();
let fpsTimer = 0;
let framesCount = 0;

function animate(time: number) {
    requestAnimationFrame(animate);
    const normalDelta = clock.getDelta();
    let deltaTime = normalDelta;

    // Post-processing optimization
    fpsTimer += normalDelta;
    framesCount++;
    if (fpsTimer > 1.0) {
        if (framesCount < 40) {
            composer.removePass(bloomPass); // Disable bloom if low FPS
        }
        fpsTimer = 0;
        framesCount = 0;
    }

    if (hitstopTimer > 0) {
        hitstopTimer -= normalDelta;
        composer.render();
        return;
    }

    if (currentState === GAME_STATE.PLAYING) {
        if (comboTimer > 0) {
            comboTimer -= normalDelta;
            if (comboTimer <= 0) combo = 0;
        }
        
        audioManager.setCombo(combo);

        if (tank.powerUpType === 'SLOW') {
            deltaTime *= 0.3; // 30% speed for enemies
        }

        tank.update(normalDelta); // Tank moves at normal speed
        waveManager.update(time, deltaTime);

        powerUp.update(normalDelta);
        if (powerUp.active && tank.mesh.position.distanceTo(powerUp.mesh.position) < 4) {
            const collectedType = powerUp.collect();
            if (collectedType) {
                tank.applyPowerUp(collectedType);
                audioManager.playClick();
            }
        }

        for (let i = ufos.length - 1; i >= 0; i--) {
            const ufo = ufos[i];
            ufo.update(deltaTime, tank.mesh.position);
            if (!ufo.active) {
                ufoPool.release(ufo);
                ufos.splice(i, 1);
            }
        }

        checkCollisions();
        particleSystem.update(normalDelta);
        damageNumberManager.update(normalDelta);
        cameraController.update(normalDelta, combo); // Pass normal time and combo for FOV
        
        if (time % 1000 < 20) saveData();
    }

    composer.render();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

updateUI();
animate(0);