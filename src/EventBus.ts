export type EventHandler<T = any> = (data: T) => void;

export interface GameEvents {
    'WAVE_STARTED': { wave: number; enemyCount?: number };
    'PLAYER_LEVELED_UP': { level: number };
    'UPGRADE_PURCHASED': { type: string; level: number };
    'DAILY_REWARD_CLAIMED': { credits: number };
    'ENEMY_KILLED': { type: string; score: number; credits: number };
    'PLAYER_HIT': { shielded: boolean };
    'GAME_OVER': { score: number };
    'STATE_CHANGE': { from: string; to: string };
    'SCORE_ADD': number;
    'ENEMY_SHOOT': { position: any; target: any };
    'ENEMY_SPAWN_REQUEST': { position: any; type: string };
    'GAME_STARTED': any;
    'WAVE_COMPLETED': { wave: number };
    'MATCH_STARTED': any;
    'MATCH_FINISHED': { winner: string | null };
}

class TypedEventBus {
    private listeners: Map<keyof GameEvents, EventHandler[]> = new Map();

    on<K extends keyof GameEvents>(event: K, handler: EventHandler<GameEvents[K]>): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(handler);
    }

    off<K extends keyof GameEvents>(event: K, handler: EventHandler<GameEvents[K]>): void {
        if (!this.listeners.has(event)) return;
        const handlers = this.listeners.get(event)!;
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
        if (!this.listeners.has(event)) return;
        for (const handler of this.listeners.get(event)!) {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        }
    }

    clear(): void {
        this.listeners.clear();
    }
}

export const eventBus = new TypedEventBus();
