import { GameManager } from './core/GameManager';
import { LightTank, MediumTank, HeavyTank, BaseTank } from './tanks/TankClasses';
import { playerProfile } from './PlayerProfileStore';
import { eventBus } from './EventBus';

// Initialize core GameManager
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new GameManager(canvas);

// Select default tank stats
let selectedTankClass: BaseTank = new MediumTank();

// --- UI Elements for Bootstrapping ---
const bootUi = {
    startBtn: document.getElementById('start-btn') as HTMLButtonElement,
    restartBtn: document.getElementById('restart-btn') as HTMLButtonElement,
    btnUpgFire: document.getElementById('btn-upg-fire') as HTMLButtonElement,
    btnUpgSpeed: document.getElementById('btn-upg-speed') as HTMLButtonElement,
    btnDaily: document.getElementById('daily-reward-btn') as HTMLButtonElement,
    
    // Class selection
    btnClassLight: document.getElementById('btn-class-light') as HTMLButtonElement,
    btnClassMedium: document.getElementById('btn-class-medium') as HTMLButtonElement,
    btnClassHeavy: document.getElementById('btn-class-heavy') as HTMLButtonElement,
    classDesc: document.getElementById('class-desc') as HTMLElement
};

// Setup upgrades buying listeners
if (bootUi.btnUpgFire) {
    bootUi.btnUpgFire.addEventListener('click', () => {
        if (playerProfile.buyUpgrade('fireRate')) {
            // Apply upgrade values to active tank
            const upgrades = playerProfile.get().upgrades;
            game.tank.shootDelay = Math.max(0.05, game.tank.tankStats.shootDelay - (upgrades.fireRate * 0.03));
            game.updateUI();
            game.audioManager.playClick();
        }
    });
}

if (bootUi.btnUpgSpeed) {
    bootUi.btnUpgSpeed.addEventListener('click', () => {
        if (playerProfile.buyUpgrade('speed')) {
            // Apply upgrade values to active tank
            const upgrades = playerProfile.get().upgrades;
            game.tank.maxSpeed = game.tank.tankStats.maxSpeed + (upgrades.speed * 4);
            game.tank.acceleration = game.tank.tankStats.acceleration + (upgrades.speed * 8);
            game.updateUI();
            game.audioManager.playClick();
        }
    });
}

// Setup Class selection listeners
function updateClassActiveState(activeBtn: HTMLButtonElement, desc: string, tankClass: BaseTank) {
    [bootUi.btnClassLight, bootUi.btnClassMedium, bootUi.btnClassHeavy].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
    if (bootUi.classDesc) bootUi.classDesc.innerText = desc;
    
    selectedTankClass = tankClass;
    game.selectTankClass(selectedTankClass);
    game.audioManager.playClick();
}

if (bootUi.btnClassLight) {
    bootUi.btnClassLight.addEventListener('click', () => {
        updateClassActiveState(
            bootUi.btnClassLight,
            "Light chassis. Very fast movement. Phase Dash ability (dash forward, invulnerable).",
            new LightTank()
        );
    });
}

if (bootUi.btnClassMedium) {
    bootUi.btnClassMedium.addEventListener('click', () => {
        updateClassActiveState(
            bootUi.btnClassMedium,
            "Medium chassis. Standard attributes. Energy Shield ability (blocks damage).",
            new MediumTank()
        );
    });
}

if (bootUi.btnClassHeavy) {
    bootUi.btnClassHeavy.addEventListener('click', () => {
        updateClassActiveState(
            bootUi.btnClassHeavy,
            "Heavy chassis. Slow but powerful. Overcharge ability (+100% damage, +50% fire rate).",
            new HeavyTank()
        );
    });
}

// Daily Reward functionality
if (bootUi.btnDaily) {
    const lastClaim = localStorage.getItem('neon_daily_reward');
    const now = Date.now();
    const canClaim = !lastClaim || (now - parseInt(lastClaim)) > 86400000;
    
    if (!canClaim) {
        bootUi.btnDaily.disabled = true;
        bootUi.btnDaily.style.opacity = '0.5';
        bootUi.btnDaily.innerText = 'REWARD CLAIMED';
    }

    bootUi.btnDaily.addEventListener('click', () => {
        if (!bootUi.btnDaily.disabled) {
            playerProfile.get().credits += 500;
            playerProfile.save();
            localStorage.setItem('neon_daily_reward', Date.now().toString());
            bootUi.btnDaily.disabled = true;
            bootUi.btnDaily.style.opacity = '0.5';
            bootUi.btnDaily.innerText = 'REWARD CLAIMED';
            game.updateUI();
            game.audioManager.playClick();
            eventBus.emit('DAILY_REWARD_CLAIMED', { credits: 500 });
        }
    });
}

// Start trigger
if (bootUi.startBtn) {
    bootUi.startBtn.addEventListener('click', () => {
        game.resetGame();
    });
}

// Restart trigger
if (bootUi.restartBtn) {
    bootUi.restartBtn.addEventListener('click', () => {
        game.resetGame();
    });
}

// Initial UI load
game.updateUI();

// Start GameManager animate loop
game.start();