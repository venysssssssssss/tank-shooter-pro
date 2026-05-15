import { eventBus } from './EventBus';

export interface PlayerUpgrades {
    maxHp: number; // levels of upgrade
    damage: number;
    fireRate: number;
    speed: number;
}

export interface PlayerData {
    credits: number; // Soft currency
    premium: number; // Hard currency
    nanobytes: number;
    xp: number;
    level: number;
    highScore: number;
    upgrades: PlayerUpgrades;
}

export class PlayerProfileStore {
    private static STORAGE_KEY = 'neon_player_data';
    private data: PlayerData;

    constructor() {
        this.data = this.load();
    }

    private load(): PlayerData {
        const raw = localStorage.getItem(PlayerProfileStore.STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                // ensure all fields exist (migration)
                return { ...this.getDefaultData(), ...parsed };
            } catch (e) {
                console.error("Save data corrupted", e);
            }
        }
        return this.getDefaultData();
    }

    private getDefaultData(): PlayerData {
        return {
            credits: 0,
            premium: 0,
            nanobytes: 0,
            xp: 0,
            level: 1,
            highScore: 0,
            upgrades: {
                maxHp: 0,
                damage: 0,
                fireRate: 0,
                speed: 0
            }
        };
    }

    save() {
        localStorage.setItem(PlayerProfileStore.STORAGE_KEY, JSON.stringify(this.data));
    }

    get() {
        return this.data;
    }

    addXP(amount: number) {
        this.data.xp += amount;
        
        // Loop while XP is greater than or equal to what's needed for the next level.
        // For testing we use 100 * level.
        let xpNeeded = this.data.level * 100;
        
        while (this.data.xp >= xpNeeded) {
            this.data.xp -= xpNeeded;
            this.data.level++;
            xpNeeded = this.data.level * 100;
            eventBus.emit('PLAYER_LEVELED_UP', { level: this.data.level });
        }
        this.save();
    }

    addCredits(amount: number) {
        this.data.credits += amount;
        this.save();
    }

    spendCredits(amount: number): boolean {
        if (this.data.credits >= amount) {
            this.data.credits -= amount;
            this.save();
            return true;
        }
        return false;
    }

    addPremium(amount: number) {
        this.data.premium += amount;
        this.save();
    }

    spendPremium(amount: number): boolean {
        if (this.data.premium >= amount) {
            this.data.premium -= amount;
            this.save();
            return true;
        }
        return false;
    }

    buyUpgrade(type: keyof PlayerUpgrades): boolean {
        const level = this.data.upgrades[type];
        if (level >= 5) return false; // max level
        const cost = 100 * Math.pow(2, level);
        if (this.data.credits >= cost) {
            this.data.credits -= cost;
            this.data.upgrades[type]++;
            this.save();
            eventBus.emit('UPGRADE_PURCHASED', { type, level: this.data.upgrades[type] });
            return true;
        }
        return false;
    }
}
export const playerProfile = new PlayerProfileStore();
