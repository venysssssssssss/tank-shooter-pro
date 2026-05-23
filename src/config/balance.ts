export interface EnemyConfig {
    maxHp: number;
    baseSpeed: number;
    speedVariance: number;
    preferredDistance: number;
}

export const ENEMY_BALANCE: Record<string, EnemyConfig> = {
    BOSS: {
        maxHp: 3000,
        baseSpeed: 12,
        speedVariance: 0,
        preferredDistance: 45
    },
    TANK: {
        maxHp: 400,
        baseSpeed: 18,
        speedVariance: 8,
        preferredDistance: 15
    },
    KAMIKAZE: {
        maxHp: 50,
        baseSpeed: 70,
        speedVariance: 20,
        preferredDistance: 0
    },
    SNIPER: {
        maxHp: 80,
        baseSpeed: 22,
        speedVariance: 8,
        preferredDistance: 35
    },
    SPAWNER: {
        maxHp: 200,
        baseSpeed: 14,
        speedVariance: 6,
        preferredDistance: 40
    },
    NORMAL: {
        maxHp: 100,
        baseSpeed: 35,
        speedVariance: 15,
        preferredDistance: 25
    }
};
