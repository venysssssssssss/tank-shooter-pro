import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { InputManager } from './InputManager.js';
import { Tank } from './Tank.js';
import { Ufo } from './Ufo.js';
import { CameraController } from './CameraController.js';
import { ObjectPool } from './ObjectPool.js';
import { ParticleSystem } from './ParticleSystem.js';
import { AudioManager } from './AudioManager.js';
import { PowerUp } from './PowerUp.js';

// --- Game State & Economy ---
const GAME_STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAMEOVER: 'GAMEOVER'
};
let currentState = GAME_STATE.MENU;

let score = 0;
let credits = parseInt(localStorage.getItem('neon_credits')) || 0;
let nanobytes = parseInt(localStorage.getItem('neon_nanobytes')) || 0;
let highScore = parseInt(localStorage.getItem('neon_highscore')) || 0;

const ui = {
    score: document.getElementById('score'),
    credits: document.getElementById('credits'),
    nanobytes: document.getElementById('nanobytes'),
    menu: document.getElementById('menu'),
    gameOver: document.getElementById('game-over'),
    finalScore: document.getElementById('final-score'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    bossUi: document.getElementById('boss-ui'),
    bossHp: document.getElementById('boss-hp-bar')
};

function updateUI() {
    ui.score.innerText = score;
    ui.credits.innerText = credits;
    ui.nanobytes.innerText = nanobytes;
}

function saveData() {
    localStorage.setItem('neon_credits', credits);
    localStorage.setItem('neon_nanobytes', nanobytes);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neon_highscore', highScore);
    }
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
const ufos = [];
const ufoPool = new ObjectPool(() => new Ufo(scene));
const particleSystem = new ParticleSystem(scene);
const powerUp = new PowerUp(scene);

// --- Game Logic ---
let lastUfoSpawn = 0;
let ufoSpawnRate = 2000;
let hitstopTimer = 0;
let combo = 0;
let comboTimer = 0;
let bossActive = false;

function resetGame() {
    score = 0;
    ufoSpawnRate = 2000;
    updateUI();
    tank.mesh.position.set(0, 0, 0);
    ufos.forEach(ufo => {
        ufo.destroy();
        ufoPool.release(ufo);
    });
    ufos.length = 0;
    currentState = GAME_STATE.PLAYING;
    ui.menu.style.display = 'none';
    ui.gameOver.style.display = 'none';
    audioManager.playClick();
    audioManager.startMusic();
}

ui.startBtn.addEventListener('click', () => resetGame());
ui.restartBtn.addEventListener('click', () => resetGame());

function spawnUfos(time) {
    if (time - lastUfoSpawn > ufoSpawnRate) {
        const ufo = ufoPool.get();
        ufo.reset();
        ufos.push(ufo);
        lastUfoSpawn = time;
        ufoSpawnRate = Math.max(800, 2000 - (score / 500) * 100);
    }
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
            if (ufo.takeDamage(1)) {
                audioManager.playExplosion();
                cameraController.addTrauma(ufo.type === 'TANK' || ufo.type === 'BOSS' ? 0.8 : 0.4);
                
                let color = 0xff00ff;
                if (ufo.type === 'TANK') color = 0xff6600;
                else if (ufo.type === 'KAMIKAZE') color = 0xff0000;
                else if (ufo.type === 'BOSS') color = 0x00f2ff;

                particleSystem.explode(ufo.mesh.position, color);
                
                hitstopTimer = (ufo.type === 'TANK' || ufo.type === 'BOSS') ? 0.08 : 0.03; 
                combo += 1;
                comboTimer = 3.0;
                
                if (ufo.type === 'BOSS') {
                    score += 2000;
                    credits += 100;
                    nanobytes += 5; // Boss drops premium currency
                    bossActive = false;
                    ui.bossUi.style.display = 'none';
                } else if (ufo.type === 'TANK') {
                    score += 500;
                    credits += 25;
                } else {
                    score += 100;
                    credits += 5;
                }
                
                updateUI();
                
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
                    ui.bossHp.style.width = `${(ufo.hp / ufo.maxHp) * 100}%`;
                }
                particleSystem.explode(ufo.mesh.position, 0xffffff); // mini spark
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
                ui.finalScore.innerText = score;
                ui.gameOver.style.display = 'block';
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

function animate(time) {
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
        spawnUfos(time);

        powerUp.update(normalDelta);
        if (powerUp.active && tank.mesh.position.distanceTo(powerUp.mesh.position) < 4) {
            tank.applyPowerUp(powerUp.collect());
            audioManager.playClick();
        }

        for (let i = ufos.length - 1; i >= 0; i--) {
            const ufo = ufos[i];
            ufo.update(deltaTime);
            if (!ufo.active) {
                ufoPool.release(ufo);
                ufos.splice(i, 1);
            }
        }

        checkCollisions();
        particleSystem.update(normalDelta);
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
