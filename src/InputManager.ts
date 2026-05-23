import * as THREE from 'three';

export class InputManager {
    keys: {
        forward: boolean;
        backward: boolean;
        left: boolean;
        right: boolean;
        shootKey: boolean;
        shootMouse: boolean;
        ability: boolean;
        movementX: number; // Mouse movement offset since last frame
        movementY: number; // Mouse movement offset since last frame
        isLocked: boolean; // Tracks pointer lock state
        mouseNDC: THREE.Vector2; // Center of screen when locked, screen NDC when unlocked
        readonly shoot: boolean;
    };

    constructor(domElement: HTMLElement) {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shootKey: false,
            shootMouse: false,
            ability: false,
            movementX: 0,
            movementY: 0,
            isLocked: false,
            mouseNDC: new THREE.Vector2(0, 0),
            get shoot() { return this.shootKey || this.shootMouse; }
        };

        this.initInput(domElement);
    }

    initInput(domElement: HTMLElement): void {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.forward = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.backward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    break;
                case 'Space':
                    this.keys.shootKey = true;
                    break;
                case 'KeyQ':
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.ability = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.forward = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.backward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'Space':
                    this.keys.shootKey = false;
                    break;
                case 'KeyQ':
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.ability = false;
                    break;
            }
        });

        // Request pointer lock on clicking the game canvas
        domElement.addEventListener('click', () => {
            if (!this.keys.isLocked) {
                domElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.keys.isLocked = document.pointerLockElement === domElement;
            // Center NDC when locked
            if (this.keys.isLocked) {
                this.keys.mouseNDC.set(0, 0);
            }
        });

        // Track mouse movement offsets when pointer is locked
        document.addEventListener('mousemove', (e) => {
            if (this.keys.isLocked) {
                this.keys.movementX += e.movementX;
                this.keys.movementY += e.movementY;
                this.keys.mouseNDC.set(0, 0); // Always center when locked
            } else {
                // Free mouse coordinates fallback
                this.keys.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
                this.keys.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.keys.shootMouse = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.keys.shootMouse = false;
            }
        });
    }
}