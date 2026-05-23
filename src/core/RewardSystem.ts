import { playerProfile } from '../PlayerProfileStore';

export interface KillReward {
    score: number;
    credits: number;
    nanobytes: number;
    xp: number;
}

export class RewardSystem {
    getRewardForType(ufoType: string, comboMultiplier: number = 1): KillReward {
        let score = 100;
        let credits = 5;
        let nanobytes = 0;
        let xp = 50;

        switch (ufoType) {
            case 'BOSS':
                score = 3000;
                credits = 150;
                nanobytes = 5;
                xp = 1000;
                break;
            case 'TANK':
                score = 500;
                credits = 25;
                xp = 150;
                break;
            case 'SPAWNER':
                score = 400;
                credits = 30;
                xp = 200;
                break;
            case 'SNIPER':
                score = 250;
                credits = 15;
                xp = 100;
                break;
            case 'KAMIKAZE':
                score = 150;
                credits = 10;
                xp = 75;
                break;
            case 'NORMAL':
            default:
                score = 100;
                credits = 5;
                xp = 50;
                break;
        }

        // Apply combo multiplier to score, credits, and XP (nanobytes are fixed)
        return {
            score: Math.floor(score * comboMultiplier),
            credits: Math.floor(credits * comboMultiplier),
            nanobytes: nanobytes,
            xp: Math.floor(xp * comboMultiplier)
        };
    }

    applyReward(reward: KillReward): void {
        if (reward.credits > 0) {
            playerProfile.addCredits(reward.credits);
        }
        if (reward.xp > 0) {
            playerProfile.addXP(reward.xp);
        }
        if (reward.nanobytes > 0) {
            playerProfile.addNanobytes(reward.nanobytes);
        }
    }
}
