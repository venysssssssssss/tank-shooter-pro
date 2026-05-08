import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { Tank } from './Tank.js';
import { Ufo } from './Ufo.js';
import { CameraController } from './CameraController.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0b2e); 
scene.fog = new THREE.Fog(0x1a0b2e, 100, 300); // Extended fog for visibility

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(100, 150, 50);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 150;
dirLight.shadow.camera.bottom = -150;
dirLight.shadow.camera.left = -150;
dirLight.shadow.camera.right = 150;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 500;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// --- Environment ---
const groundGeo = new THREE.PlaneGeometry(800, 800, 64, 64);
const pos = groundGeo.attributes.position;
for(let i=0; i<pos.count; i++) {
    pos.setZ(i, (Math.random() - 0.5) * 3); // More pronounced terrain
}
groundGeo.computeVertexNormals();

const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x3e2723, 
    roughness: 0.9,
    flatShading: true
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Game Objects ---
const inputManager = new InputManager(renderer.domElement);
const tank = new Tank(scene, inputManager);
const cameraController = new CameraController(camera, tank);
const ufos = [];

let score = 0;
const scoreElement = document.getElementById('score');
const controlsHint = document.querySelector('.controls');

// --- Game Logic ---
let lastUfoSpawn = 0;
const ufoSpawnRate = 1500; // Faster spawn

function spawnUfos(time) {
    if (time - lastUfoSpawn > ufoSpawnRate) {
        ufos.push(new Ufo(scene));
        lastUfoSpawn = time;
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
                scoreElement.innerText = score;
                
                bullet.destroy();
                ufoHit = true;
                break;
            }
        }

        if (ufoHit) {
            ufo.destroy();
            ufos.splice(i, 1);
        }
    }
}


// --- Main Loop ---
const clock = new THREE.Clock();

function animate(time) {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    if (inputManager.keys.isLocked) {
        controlsHint.style.display = 'none';
    } else {
        controlsHint.style.display = 'block';
        controlsHint.innerHTML = "Click canvas to play<br>Mouse to Look & Shoot<br>WASD to Move";
    }

    // Update entities
    tank.update(deltaTime);
    
    spawnUfos(time);

    for (let i = ufos.length - 1; i >= 0; i--) {
        const ufo = ufos[i];
        ufo.update(deltaTime);
        if (!ufo.active) {
            ufoPool.release(ufo);
            ufos.splice(i, 1);
        }
    }

    checkCollisions();

    cameraController.update(deltaTime);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(0);t);
});

animate(0);