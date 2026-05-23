import { eventBus } from './EventBus';

export interface PlayerUpgrades {
    maxHp: number; // levels of upgrade
    damage: number;
    fireRate: number;
    speed: number;
}

export interface PlayerData {
    credits: number; // Soft currency
    premium: number; // Hard currency (Premium)
    nanobytes: number; // Nanobytes currency
    xp: number;
    level: number;
    highScore: number;
    upgrades: PlayerUpgrades;
    inventory: string[]; // Purchased items
    claimedRewards: string[]; // Claimed BattlePass reward IDs (e.g., "BP_1_FREE", "BP_5_PREM")
    battlePassXp: number;
    isPremiumPassActive: boolean;
}

export class PlayerProfileStore {
    private static STORAGE_KEY = 'neon_player_data';
    private data: PlayerData;

    constructor() {
        this.data = this.load();
    }

    private load(): PlayerData {
        const raw = localStorage.getItem(PlayerProfileStore.STORAGE_KEY);
        const defaultData = this.getDefaultData();
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                // Deep merge upgrades to protect against partial old data
                const upgrades = { ...defaultData.upgrades, ...(parsed.upgrades || {}) };
                const inventory = Array.isArray(parsed.inventory) ? parsed.inventory : defaultData.inventory;
                const claimedRewards = Array.isArray(parsed.claimedRewards) ? parsed.claimedRewards : defaultData.claimedRewards;
                
                return {
                    ...defaultData,
                    ...parsed,
                    upgrades,
                    inventory,
                    claimedRewards
                };
            } catch (e) {
                console.error("Save data corrupted", e);
            }
        }
        return defaultData;
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
            },
            inventory: [],
            claimedRewards: [],
            battlePassXp: 0,
            isPremiumPassActive: false
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
        
        let xpNeeded = this.data.level * 100;
        
        while (this.data.xp >= xpNeeded) {
            this.data.xp -= xpNeeded;
            this.data.level++;
            xpNeeded = this.data.level * 100;
            // Statically typed event bus emitter
            eventBus.emit('PLAYER_LEVELED_UP', { level: this.data.level });
        }
        
        // Parallel BattlePass XP progress (BP gains 50% of earned XP)
        this.addBattlePassXp(Math.floor(amount * 0.5));
        
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

    // --- Inventory & Shop logic ---
    addItemToInventory(itemId: string): void {
        if (!this.data.inventory.includes(itemId)) {
            this.data.inventory.push(itemId);
            this.save();
        }
    }

    hasItem(itemId: string): boolean {
        return this.data.inventory.includes(itemId);
    }

    // --- BattlePass logic ---
    addBattlePassXp(amount: number): void {
        this.data.battlePassXp += amount;
        this.save();
    }

    claimReward(rewardKey: string): void {
        if (!this.data.claimedRewards.includes(rewardKey)) {
            this.data.claimedRewards.push(rewardKey);
            this.save();
        }
    }

    isRewardClaimed(rewardKey: string): boolean {
        return this.data.claimedRewards.includes(rewardKey);
    }
}
export const playerProfile = new PlayerProfileStore();
