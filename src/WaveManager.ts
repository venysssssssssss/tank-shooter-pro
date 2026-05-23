import { eventBus } from './EventBus';

export interface WaveConfig {
    id: number;
    name: string;
    totalEnemies: number;
    spawnRate: number; // in milliseconds
    types: { type: string, weight: number }[];
    bossWave: boolean;
}

export class WaveManager {
    public currentWaveIndex: number = 0;
    private enemiesSpawned: number = 0;
    private enemiesKilled: number = 0;
    private spawnTimer: number = 0; // accumulated time in seconds for spawning
    public active: boolean = false;
    private spawnCallback: (type: string) => void;

    // Standard hand-crafted initial waves
    private waves: WaveConfig[] = [
        {
            id: 1,
            name: "Initial Incursion",
            totalEnemies: 8,
            spawnRate: 2500,
            types: [{ type: 'NORMAL', weight: 1.0 }],
            bossWave: false
        },
        {
            id: 2,
            name: "Scout Fleet",
            totalEnemies: 15,
            spawnRate: 2000,
            types: [
                { type: 'NORMAL', weight: 0.6 }, 
                { type: 'KAMIKAZE', weight: 0.4 }
            ],
            bossWave: false
        },
        {
            id: 3,
            name: "Cyber Snipers",
            totalEnemies: 20,
            spawnRate: 1600,
            types: [
                { type: 'NORMAL', weight: 0.4 }, 
                { type: 'KAMIKAZE', weight: 0.3 }, 
                { type: 'SNIPER', weight: 0.3 }
            ],
            bossWave: false
        },
        {
            id: 4,
            name: "Heavy Shield Wall",
            totalEnemies: 22,
            spawnRate: 1500,
            types: [
                { type: 'NORMAL', weight: 0.3 }, 
                { type: 'TANK', weight: 0.4 }, 
                { type: 'SNIPER', weight: 0.3 }
            ],
            bossWave: false
        },
        {
            id: 5,
            name: "Boss Mothership",
            totalEnemies: 1,
            spawnRate: 0,
            types: [{ type: 'BOSS', weight: 1.0 }],
            bossWave: true
        }
    ];

    constructor(spawnCallback: (type: string) => void) {
        this.spawnCallback = spawnCallback;
        
        eventBus.on('ENEMY_KILLED', () => {
            if (!this.active) return;
            this.enemiesKilled++;
            
            const currentWave = this.getCurrentWave();
            if (this.enemiesKilled >= currentWave.totalEnemies) {
                this.completeWave();
            }
        });
    }

    start() {
        this.currentWaveIndex = 0;
        this.startWave();
    }

    private startWave() {
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.spawnTimer = 0;
        this.active = true;
        const wave = this.getCurrentWave();
        eventBus.emit('WAVE_STARTED', { wave: wave.id, enemyCount: wave.totalEnemies });
    }

    private completeWave() {
        this.active = false;
        eventBus.emit('STATE_CHANGE', { from: 'wave', to: 'wave_complete' }); // emit to bus
        this.currentWaveIndex++;
        
        setTimeout(() => {
            this.startWave();
        }, 3000);
    }

    getCurrentWave(): WaveConfig {
        if (this.currentWaveIndex >= this.waves.length) {
            const waveNum = this.currentWaveIndex + 1;
            const isBossWave = waveNum % 5 === 0;

            if (isBossWave) {
                const bossCount = Math.floor(waveNum / 5);
                return {
                    id: waveNum,
                    name: bossCount > 1 ? `Twin Motherships (x${bossCount})` : "Mothership Return",
                    totalEnemies: bossCount,
                    spawnRate: bossCount > 1 ? 4000 : 0,
                    types: [{ type: 'BOSS', weight: 1.0 }],
                    bossWave: true
                };
            } else {
                // Procedural generation
                const difficultyMultiplier = waveNum / 5;
                const totalEnemies = Math.round(15 + (difficultyMultiplier * 12));
                const spawnRate = Math.max(400, 2000 - (difficultyMultiplier * 300));
                
                // Gradually increase weights of tougher enemies
                const types = [
                    { type: 'NORMAL', weight: Math.max(0.1, 0.4 - difficultyMultiplier * 0.05) },
                    { type: 'KAMIKAZE', weight: 0.2 },
                    { type: 'TANK', weight: 0.15 + (difficultyMultiplier * 0.03) },
                    { type: 'SNIPER', weight: 0.15 + (difficultyMultiplier * 0.03) },
                    { type: 'SPAWNER', weight: 0.1 + (difficultyMultiplier * 0.02) }
                ];

                // Normalize weights to sum up to 1.0
                const sum = types.reduce((acc, t) => acc + t.weight, 0);
                types.forEach(t => t.weight /= sum);

                return {
                    id: waveNum,
                    name: `Sector Incursion ${waveNum}`,
                    totalEnemies,
                    spawnRate,
                    types,
                    bossWave: false
                };
            }
        }
        return this.waves[this.currentWaveIndex];
    }

    update(_time: number, deltaTime: number) {
        if (!this.active) return;

        const wave = this.getCurrentWave();

        if (this.enemiesSpawned < wave.totalEnemies) {
            // Special instant spawn for boss waves with single boss
            if (wave.bossWave && wave.totalEnemies === 1) {
                this.enemiesSpawned++;
                this.spawnCallback('BOSS');
                return;
            }

            this.spawnTimer += deltaTime;
            const spawnIntervalSeconds = wave.spawnRate / 1000;

            if (this.spawnTimer >= spawnIntervalSeconds) {
                this.spawnTimer -= spawnIntervalSeconds;
                this.enemiesSpawned++;
                
                const rand = Math.random();
                let cumulative = 0;
                let selectedType = 'NORMAL';
                for (const t of wave.types) {
                    cumulative += t.weight;
                    if (rand <= cumulative) {
                        selectedType = t.type;
                        break;
                    }
                }

                this.spawnCallback(selectedType);
            }
        }
    }
}
