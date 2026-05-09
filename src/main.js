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
let highScore = parseInt(localStorage.getItem('neon_highscore')) || 0;

const ui = {
    score: document.getElementById('score'),
    credits: document.getElementById('credits'),
    menu: document.getElementById('menu'),
    gameOver: document.getElementById('game-over'),
    finalScore: document.getElementById('final-score'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn')
};

function updateUI() {
    ui.score.innerText = score;
    ui.credits.innerText = credits;
}

function saveData() {
    localStorage.setItem('neon_credits', credits);
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
                score += 100;
                credits += 5;
                updateUI();
                
                bullet.destroy();
                ufoHit = true;
                break;
            }
        }

        if (ufoHit) {
            audioManager.playExplosion();
            cameraController.addTrauma(0.4);
            particleSystem.explode(ufo.mesh.position, 0xff00ff);
            
            // Random Powerup Spawn
            if (Math.random() < 0.15 && !powerUp.active) {
                powerUp.spawn(ufo.mesh.position);
            }

            ufo.destroy();
            ufoPool.release(ufo);
            ufos.splice(i, 1);
        }
    }
}

// --- Main Loop ---
const clock = new THREE.Clock();

function animate(time) {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    if (currentState === GAME_STATE.PLAYING) {
        tank.update(deltaTime);
        spawnUfos(time);

        powerUp.update(deltaTime);
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
        particleSystem.update(deltaTime);
        cameraController.update(deltaTime);
        
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
