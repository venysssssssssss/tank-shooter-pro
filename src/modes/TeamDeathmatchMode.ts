import { IGameMode } from './GameModeManager';

export class TeamDeathmatchMode implements IGameMode {
  private targetKills: number;
  private teamScores: Map<string, number> = new Map();
  private playerTeams: Map<string, string> = new Map(); // playerId -> teamName

  constructor(targetKills: number = 20) {
    this.targetKills = targetKills;
  }

  assignTeam(playerId: string, team: string) {
    this.playerTeams.set(playerId, team);
    if (!this.teamScores.has(team)) {
      this.teamScores.set(team, 0);
    }
  }

  onKill(killerId: string, victimId: string): void {
    const killerTeam = this.playerTeams.get(killerId);
    const victimTeam = this.playerTeams.get(victimId);

    // If killer is not on a team, or friendly fire happened
    if (!killerTeam || killerTeam === victimTeam) return;

    const currentScore = this.teamScores.get(killerTeam) || 0;
    this.teamScores.set(killerTeam, currentScore + 1);
  }

  getScore(teamOrPlayerId: string): number {
    // Treat the argument as a team name for scores
    return this.teamScores.get(teamOrPlayerId) || 0;
  }

  checkWinCondition(): string | null {
    for (const [teamName, score] of this.teamScores.entries()) {
      if (score >= this.targetKills) {
        return teamName; // Return team name as winner
      }
    }
    return null;
  }
}