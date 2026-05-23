import { PlayerProfileStore } from '../PlayerProfileStore';

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
    private profileStore: PlayerProfileStore;
    private rewards: PassReward[];
    private xpPerTier: number;

    constructor(profileStore: PlayerProfileStore, rewards: PassReward[], xpPerTier: number = 1000) {
        this.profileStore = profileStore;
        this.rewards = rewards;
        this.xpPerTier = xpPerTier;
    }

    getCurrentTier(): number {
        const pd = this.profileStore.get();
        return Math.floor(pd.battlePassXp / this.xpPerTier);
    }

    addPassXP(amount: number): void {
        this.profileStore.addBattlePassXp(amount);
    }

    getXpProgressInCurrentTier(): number {
        const pd = this.profileStore.get();
        return pd.battlePassXp % this.xpPerTier;
    }

    getXpPerTier(): number {
        return this.xpPerTier;
    }

    setPremium(isActive: boolean) {
        const pd = this.profileStore.get();
        pd.isPremiumPassActive = isActive;
        this.profileStore.save();
    }

    isPremiumActive(): boolean {
        return this.profileStore.get().isPremiumPassActive;
    }

    getRewardKey(tier: number, isPremium: boolean): string {
        return `BP_${tier}_${isPremium ? 'PREM' : 'FREE'}`;
    }

    canClaimReward(tier: number, isPremium: boolean): boolean {
        const currentTier = this.getCurrentTier();
        if (tier > currentTier) return false; // Tier not unlocked yet
        
        if (isPremium && !this.isPremiumActive()) return false; // Premium not owned
        
        const rewardKey = this.getRewardKey(tier, isPremium);
        if (this.profileStore.isRewardClaimed(rewardKey)) return false; // Already claimed

        return true;
    }

    claimReward(tier: number, isPremium: boolean): boolean {
        if (!this.canClaimReward(tier, isPremium)) return false;

        const reward = this.rewards.find(r => r.tier === tier && r.isPremium === isPremium);
        if (!reward) return false;

        // Deliver reward to player profile
        if (reward.type === RewardType.SOFT_CURRENCY && reward.amount) {
            this.profileStore.addCredits(reward.amount);
        } else if (reward.type === RewardType.HARD_CURRENCY && reward.amount) {
            this.profileStore.addPremium(reward.amount);
        } else if ((reward.type === RewardType.SKIN || reward.type === RewardType.DECAL) && reward.itemId) {
            this.profileStore.addItemToInventory(reward.itemId);
        }

        // Mark as claimed
        const rewardKey = this.getRewardKey(tier, isPremium);
        this.profileStore.claimReward(rewardKey);
        
        return true;
    }

    getUnlockedRewards(includePremium: boolean = this.isPremiumActive()): PassReward[] {
        const currentTier = this.getCurrentTier();
        return this.rewards.filter(reward => {
            if (reward.tier > currentTier) return false;
            if (reward.isPremium && !includePremium) return false;
            return true;
        });
    }
}