import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Tank } from '../src/Tank';
import { LightTank, MediumTank, HeavyTank } from '../src/tanks/TankClasses';
import { playerProfile } from '../src/PlayerProfileStore';
import { RewardSystem } from '../src/core/RewardSystem';

describe('Tank Core Logic and Mechanics', () => {
    let scene: THREE.Scene;
    let mockInputManager: any;
    let shootCount: number;
    let onShoot: () => void;

    beforeEach(() => {
        scene = new THREE.Scene();
        shootCount = 0;
        onShoot = () => { shootCount++; };
        mockInputManager = {
            keys: {
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
            }
        };

        // Reset player profile data
        const profile = playerProfile.get();
        profile.credits = 0;
        profile.nanobytes = 0;
        profile.xp = 0;
        profile.level = 1;
        profile.upgrades = {
            maxHp: 0,
            damage: 0,
            fireRate: 0,
            speed: 0
        };
        playerProfile.save();
    });

    it('should initialize with correct default properties', () => {
        const stats = new MediumTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        expect(tank.maxHealth).toBe(100);
        expect(tank.currentHealth).toBe(100);
        expect(tank.invulnerable).toBe(false);
        expect(tank.invulnerableTimer).toBe(0);
        expect(tank.abilityCooldown).toBe(0);
        expect(tank.abilityActive).toBe(false);
    });

    it('should apply health upgrades correctly from player profile', () => {
        playerProfile.get().upgrades.maxHp = 2; // +40 hp
        const stats = new MediumTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        expect(tank.maxHealth).toBe(140);
        expect(tank.currentHealth).toBe(140);
    });

    it('should take damage and enter invulnerability state', () => {
        const stats = new MediumTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        
        const isDead = tank.takeDamage(30);
        expect(isDead).toBe(false);
        expect(tank.currentHealth).toBe(70);
        expect(tank.invulnerableTimer).toBe(1.0);

        // Subsequent hits while invulnerable should do nothing
        const hitAgain = tank.takeDamage(20);
        expect(hitAgain).toBe(false);
        expect(tank.currentHealth).toBe(70);
    });

    it('should die when health drops to 0 or below', () => {
        const stats = new MediumTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        const isDead = tank.takeDamage(100);
        expect(isDead).toBe(true);
        expect(tank.currentHealth).toBe(0);
    });

    it('should heal correctly but not exceed maxHealth', () => {
        const stats = new MediumTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        tank.takeDamage(50); // health = 50
        
        tank.heal(20);
        expect(tank.currentHealth).toBe(70);
        
        tank.heal(50);
        expect(tank.currentHealth).toBe(100); // capped at maxHealth
    });

    it('should block damage using power-up shield', () => {
        const stats = new MediumTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        tank.applyPowerUp('SHIELD');
        
        expect(tank.powerUpType).toBe('SHIELD');
        
        const isDead = tank.takeDamage(40);
        expect(isDead).toBe(false);
        expect(tank.currentHealth).toBe(100); // undamaged
        expect(tank.powerUpType).toBeNull(); // shield consumed
        expect(tank.invulnerableTimer).toBe(0.5); // short frame
    });

    it('should activate Medium Tank energy shield ability', () => {
        const stats = new MediumTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        
        mockInputManager.keys.ability = true;
        tank.update(0.1); // trigger ability
        
        expect(tank.abilityActive).toBe(true);
        expect(tank.abilityActiveTimer).toBe(4.0);
        expect(tank.abilityCooldown).toBe(15.0);

        // Shield should absorb damage
        const isDead = tank.takeDamage(50);
        expect(isDead).toBe(false);
        expect(tank.currentHealth).toBe(100);

        // Cooldown ticks down
        tank.updateAbilities(1.0);
        expect(tank.abilityActiveTimer).toBe(3.0);
        expect(tank.abilityCooldown).toBe(14.0);
    });

    it('should activate Heavy Tank overcharge ability', () => {
        const stats = new HeavyTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        
        mockInputManager.keys.ability = true;
        tank.update(0.1);
        
        expect(tank.abilityActive).toBe(true);
        expect(tank.damageMultiplier).toBe(2.0);
        expect(tank.fireRateMultiplier).toBe(1.5);
        expect(tank.speedMultiplier).toBe(0.6);

        // Deactivates after duration
        tank.updateAbilities(6.1);
        expect(tank.abilityActive).toBe(false);
        expect(tank.damageMultiplier).toBe(1.0);
    });

    it('should activate Light Tank dash ability', () => {
        const stats = new LightTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        
        mockInputManager.keys.ability = true;
        tank.update(0.1);
        
        expect(tank.abilityActive).toBe(true);
        expect(tank.invulnerable).toBe(true);

        tank.updateAbilities(0.35);
        expect(tank.abilityActive).toBe(false);
        expect(tank.invulnerable).toBe(false);
    });

    it('should prevent ability activation on cooldown', () => {
        const stats = new LightTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        
        mockInputManager.keys.ability = true;
        tank.update(0.1); // Activates ability
        expect(tank.abilityActive).toBe(true);

        tank.updateAbilities(0.35); // Expires ability, CD is now ~5.65
        expect(tank.abilityActive).toBe(false);
        expect(tank.abilityCooldown).toBeGreaterThan(5.0);

        // Trigger ability key again while on cooldown
        mockInputManager.keys.ability = false;
        tank.update(0.1);
        mockInputManager.keys.ability = true;
        tank.update(0.1);

        expect(tank.abilityActive).toBe(false); // Does not activate
    });

    it('should not activate ability repeatedly by holding key', () => {
        const stats = new LightTank();
        const tank = new Tank(scene, mockInputManager, onShoot, stats);
        
        // Key held down
        mockInputManager.keys.ability = true;
        tank.update(0.1); // first activation
        expect(tank.abilityActive).toBe(true);

        tank.updateAbilities(0.35); // duration finishes, ability deactivates
        expect(tank.abilityActive).toBe(false);

        // Force cooldown to 0 while key is still held down
        tank.abilityCooldown = 0;
        
        tank.update(0.1); // should NOT activate again because key was already down
        expect(tank.abilityActive).toBe(false);

        // Key released and pressed again
        mockInputManager.keys.ability = false;
        tank.update(0.1);
        mockInputManager.keys.ability = true;
        tank.update(0.1);
        expect(tank.abilityActive).toBe(true); // successfully activates again
    });
});

describe('RewardSystem and Economy', () => {
    it('should calculate kill rewards correctly', () => {
        const rewardSystem = new RewardSystem();
        
        // Normal enemy reward
        const normalReward = rewardSystem.getRewardForType('NORMAL');
        expect(normalReward.score).toBe(100);
        expect(normalReward.credits).toBe(5);
        expect(normalReward.nanobytes).toBe(0);
        expect(normalReward.xp).toBe(50);

        // Boss enemy reward
        const bossReward = rewardSystem.getRewardForType('BOSS');
        expect(bossReward.score).toBe(3000);
        expect(bossReward.credits).toBe(150);
        expect(bossReward.nanobytes).toBe(5);
        expect(bossReward.xp).toBe(1000);
        
        // Combo multiplier
        const comboReward = rewardSystem.getRewardForType('TANK', 2);
        expect(comboReward.score).toBe(1000); // 500 * 2
        expect(comboReward.credits).toBe(50); // 25 * 2
        expect(comboReward.xp).toBe(300); // 150 * 2
        expect(comboReward.nanobytes).toBe(0); // fixed
    });

    it('should apply rewards to player profile', () => {
        const rewardSystem = new RewardSystem();
        
        // Reset player profile data
        const profile = playerProfile.get();
        profile.credits = 10;
        profile.nanobytes = 1;
        profile.xp = 0;
        profile.level = 1;
        playerProfile.save();

        const reward = {
            score: 500,
            credits: 25,
            nanobytes: 2,
            xp: 120
        };

        rewardSystem.applyReward(reward);
        
        expect(playerProfile.get().credits).toBe(35);
        expect(playerProfile.get().nanobytes).toBe(3);
        expect(playerProfile.get().xp).toBe(20); // 120 xp leads to level up: 120 - 100 = 20
        expect(playerProfile.get().level).toBe(2);
    });
});
