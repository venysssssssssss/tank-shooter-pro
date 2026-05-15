import * as THREE from 'three';

interface DamageNumber {
    element: HTMLElement;
    worldPos: THREE.Vector3;
    life: number;
    maxLife: number;
    velocity: THREE.Vector3;
}

export class DamageNumberManager {
    private camera: THREE.Camera;
    private numbers: DamageNumber[] = [];
    private container: HTMLElement;

    constructor(camera: THREE.Camera) {
        this.camera = camera;
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.overflow = 'hidden';
        this.container.style.zIndex = '100'; // Make sure it is above canvas but below UI maybe?
        document.body.appendChild(this.container);
    }

    spawn(amount: number, worldPos: THREE.Vector3, color: string = '#ff0055', isCrit: boolean = false) {
        const el = document.createElement('div');
        el.innerText = amount.toString();
        el.style.position = 'absolute';
        el.style.color = color;
        el.style.fontWeight = 'bold';
        el.style.fontFamily = 'monospace';
        el.style.fontSize = isCrit ? '36px' : '24px';
        el.style.textShadow = `0 0 5px ${color}, 0 0 10px ${color}`;
        el.style.userSelect = 'none';
        el.style.transform = 'translate(-50%, -50%)';
        this.container.appendChild(el);

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 5 + 5,
            (Math.random() - 0.5) * 5
        );

        this.numbers.push({
            element: el,
            worldPos: worldPos.clone(),
            life: 1.0,
            maxLife: 1.0,
            velocity: velocity
        });
    }

    update(deltaTime: number) {
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;

        for (let i = this.numbers.length - 1; i >= 0; i--) {
            const num = this.numbers[i];
            num.life -= deltaTime;

            if (num.life <= 0) {
                this.container.removeChild(num.element);
                this.numbers.splice(i, 1);
                continue;
            }

            // Physics update
            num.worldPos.addScaledVector(num.velocity, deltaTime);
            num.velocity.y -= 15 * deltaTime; // gravity
            num.velocity.x *= (1 - 2 * deltaTime); // drag
            num.velocity.z *= (1 - 2 * deltaTime); // drag

            // Project to 2D
            const screenPos = num.worldPos.clone().project(this.camera);
            
            if (screenPos.z > 1.0) {
                num.element.style.display = 'none'; // behind camera
            } else {
                num.element.style.display = 'block';
                const x = (screenPos.x * widthHalf) + widthHalf;
                const y = -(screenPos.y * heightHalf) + heightHalf;
                
                const scale = 0.5 + 0.5 * (num.life / num.maxLife);
                const alpha = Math.max(0, Math.min(1, num.life * 2));
                
                num.element.style.left = `${x}px`;
                num.element.style.top = `${y}px`;
                num.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
                num.element.style.opacity = alpha.toString();
            }
        }
    }
}
