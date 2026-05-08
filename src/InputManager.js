export class InputManager {
    constructor(domElement) {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shootKey: false,
            shootMouse: false,
            movementX: 0,
            movementY: 0,
            isLocked: false,
            get shoot() { return this.shootKey || this.shootMouse; }
        };

        this.initInput(domElement);
    }

    initInput(domElement) {
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
            }
        });

        domElement.addEventListener('click', () => {
            if (!this.keys.isLocked) {
                domElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.keys.isLocked = document.pointerLockElement === domElement;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.keys.isLocked) {
                this.keys.movementX += e.movementX;
                this.keys.movementY += e.movementY;
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.keys.isLocked) {
                this.keys.shootMouse = true;
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.keys.shootMouse = false;
            }
        });
    }
}