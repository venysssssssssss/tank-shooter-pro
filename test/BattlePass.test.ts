import { describe, it, expect, beforeEach } from 'vitest';
import { BattlePass, PassReward, RewardType } from '../src/economy/BattlePass';

describe('Battle Pass System', () => {
  const mockRewards: PassReward[] = [
    { tier: 1, type: RewardType.SOFT_CURRENCY, amount: 100, isPremium: false },
    { tier: 1, type: RewardType.SKIN, itemId: 'skin_neon_1', isPremium: true },
    { tier: 2, type: RewardType.HARD_CURRENCY, amount: 50, isPremium: false },
    { tier: 2, type: RewardType.SKIN, itemId: 'skin_gold_1', isPremium: true },
    { tier: 3, type: RewardType.DECAL, itemId: 'decal_skull', isPremium: true }
  ];

  it('should unlock free rewards based on XP without premium pass', () => {
    const battlePass = new BattlePass(mockRewards, 1000); // 1000 XP per tier
    expect(battlePass.getCurrentTier()).toBe(0);

    battlePass.addPassXP(1000); // reaches Tier 1
    expect(battlePass.getCurrentTier()).toBe(1);

    const unlocked = battlePass.getUnlockedRewards(false);
    // Should only have the tier 1 free reward
    expect(unlocked.length).toBe(1);
    expect(unlocked[0].type).toBe(RewardType.SOFT_CURRENCY);
    expect(unlocked[0].amount).toBe(100);
  });

  it('should unlock both free and premium rewards when premium pass is active', () => {
    const battlePass = new BattlePass(mockRewards, 1000);
    battlePass.setPremium(true);
    
    battlePass.addPassXP(2000); // reaches Tier 2
    expect(battlePass.getCurrentTier()).toBe(2);

    const unlocked = battlePass.getUnlockedRewards(true);
    // Should have tier 1 (Free + Premium) + tier 2 (Free + Premium) = 4 rewards
    expect(unlocked.length).toBe(4);
    
    // Check if premium skin unlocked
    const hasPremiumSkin = unlocked.some(r => r.itemId === 'skin_neon_1');
    expect(hasPremiumSkin).toBe(true);
    
    // Tier 3 shouldn't be unlocked
    const hasTier3Decal = unlocked.some(r => r.itemId === 'decal_skull');
    expect(hasTier3Decal).toBe(false);
  });
});