export enum RewardType {
    SOFT_CURRENCY,
    HARD_CURRENCY,
    SKIN,
    DECAL
}

export interface PassReward {
    tier: number;
    type: RewardType;
    amount?: number;
    itemId?: string;
    isPremium: boolean;
}

export class BattlePass {
    private currentTier: number = 0;
    private passXP: number = 0;
    private isPremiumActive: boolean = false;
    private rewards: PassReward[];
    private xpPerTier: number;

    constructor(rewards: PassReward[], xpPerTier: number = 1000) {
        this.rewards = rewards;
        this.xpPerTier = xpPerTier;
    }

    setPremium(isActive: boolean) {
        this.isPremiumActive = isActive;
    }

    addPassXP(amount: number) {
        this.passXP += amount;
        this.currentTier = Math.floor(this.passXP / this.xpPerTier);
    }

    getCurrentTier(): number {
        return this.currentTier;
    }

    getUnlockedRewards(includePremium: boolean = this.isPremiumActive): PassReward[] {
        return this.rewards.filter(reward => {
            if (reward.tier > this.currentTier) return false;
            if (reward.isPremium && !includePremium) return false;
            return true;
        });
    }
}