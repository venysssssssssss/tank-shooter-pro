import { eventBus } from './EventBus';

export interface WaveConfig {
    id: number;
    name: string;
    totalEnemies: number;
    spawnRate: number; // ms
    types: { type: string, weight: number }[];
    bossWave: boolean;
}

export class WaveManager {
    private currentWaveIndex: number = 0;
    private enemiesSpawned: number = 0;
    private enemiesKilled: number = 0;
    private lastSpawnTime: number = 0;
    private timeSinceWaveStart: number = 0;
    public active: boolean = false;
    private spawnCallback: (type: string) => void;

    private waves: WaveConfig[] = [
        {
            id: 1,
            name: "Initial Incursion",
            totalEnemies: 10,
            spawnRate: 2000,
            types: [{ type: 'NORMAL', weight: 1.0 }],
            bossWave: false
        },
        {
            id: 2,
            name: "Scout Fleet",
            totalEnemies: 20,
            spawnRate: 1500,
            types: [{ type: 'NORMAL', weight: 0.6 }, { type: 'KAMIKAZE', weight: 0.4 }],
            bossWave: false
        },
        {
            id: 3,
            name: "Heavy Resistance",
            totalEnemies: 25,
            spawnRate: 1200,
            types: [{ type: 'NORMAL', weight: 0.4 }, { type: 'TANK', weight: 0.4 }, { type: 'KAMIKAZE', weight: 0.2 }],
            bossWave: false
        },
        {
            id: 4,
            name: "Boss Encounter",
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
            if (this.enemiesKilled >= this.getCurrentWave().totalEnemies) {
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
        this.timeSinceWaveStart = 0;
        this.lastSpawnTime = performance.now();
        this.active = true;
        const wave = this.getCurrentWave();
        eventBus.emit('WAVE_STARTED', { wave: wave.id, name: wave.name });
    }

    private completeWave() {
        this.active = false;
        eventBus.emit('WAVE_COMPLETED', { wave: this.getCurrentWave().id });
        this.currentWaveIndex++;
        
        setTimeout(() => {
            this.startWave();
        }, 3000);
    }

    getCurrentWave(): WaveConfig {
        if (this.currentWaveIndex >= this.waves.length) {
            const baseWave = this.waves[(this.currentWaveIndex - 1) % (this.waves.length - 1)]; 
            return {
                id: this.currentWaveIndex + 1,
                name: `Incursion ${this.currentWaveIndex + 1}`,
                totalEnemies: baseWave.totalEnemies + 5 * (this.currentWaveIndex - this.waves.length + 1),
                spawnRate: Math.max(500, baseWave.spawnRate * 0.9),
                types: baseWave.types,
                bossWave: false
            };
        }
        return this.waves[this.currentWaveIndex];
    }

    update(time: number, normalDelta: number) {
        if (!this.active) return;
        this.timeSinceWaveStart += normalDelta;

        const wave = this.getCurrentWave();

        if (this.enemiesSpawned < wave.totalEnemies) {
            if (time - this.lastSpawnTime > wave.spawnRate) {
                this.lastSpawnTime = time;
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
