import { eventBus } from './EventBus';

export class Analytics {
    static init() {
        eventBus.on('GAME_STARTED', () => {
            console.log('[Analytics] event: game_started');
        });
        
        eventBus.on('ENEMY_KILLED', (data: any) => {
            console.log(`[Analytics] event: enemy_killed | type: ${data.type}`);
        });

        eventBus.on('WAVE_STARTED', (data: any) => {
            console.log(`[Analytics] event: wave_started | wave: ${data.wave} | name: ${data.name}`);
        });

        eventBus.on('WAVE_COMPLETED', (data: any) => {
            console.log(`[Analytics] event: wave_completed | wave: ${data.wave}`);
        });

        eventBus.on('UPGRADE_PURCHASED', (data: any) => {
            console.log(`[Analytics] event: upgrade_purchased | type: ${data.type} | level: ${data.level}`);
        });
        
        eventBus.on('PLAYER_HIT', (data: any) => {
            console.log(`[Analytics] event: player_hit | shielded: ${data.shielded}`);
        });
        
        eventBus.on('GAME_OVER', (data: any) => {
            console.log(`[Analytics] event: game_over | score: ${data.score}`);
        });

        eventBus.on('DAILY_REWARD_CLAIMED', (data: any) => {
            console.log(`[Analytics] event: daily_reward_claimed | amount: ${data.credits}`);
        });
    }
}
