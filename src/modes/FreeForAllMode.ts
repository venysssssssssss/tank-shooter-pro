import { IGameMode } from './GameModeManager';

export class FreeForAllMode implements IGameMode {
  private scores: Map<string, number> = new Map();
  private targetKills: number;

  constructor(targetKills: number = 10) {
    this.targetKills = targetKills;
  }

  onKill(killerId: string, victimId: string): void {
    if (killerId === victimId) return; // Suicides don't count
    const currentScore = this.scores.get(killerId) || 0;
    this.scores.set(killerId, currentScore + 1);
  }

  getScore(playerId: string): number {
    return this.scores.get(playerId) || 0;
  }

  checkWinCondition(): string | null {
    for (const [playerId, score] of this.scores.entries()) {
      if (score >= this.targetKills) {
        return playerId;
      }
    }
    return null;
  }
}