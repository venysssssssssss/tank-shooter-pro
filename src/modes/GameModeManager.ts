import { eventBus } from '../EventBus';

export enum MatchState {
  WAITING,
  PLAYING,
  FINISHED
}

export interface IGameMode {
  onKill(killerId: string, victimId: string): void;
  getScore(playerId: string): number;
  checkWinCondition(): string | null; // Returns winner ID or Team if there's a winner
}

export class GameModeManager {
  private state: MatchState = MatchState.WAITING;
  private mode: IGameMode | null = null;
  private winner: string | null = null;

  setMode(mode: IGameMode) {
    this.mode = mode;
  }

  startMatch() {
    this.state = MatchState.PLAYING;
    this.winner = null;
    eventBus.emit('MATCH_STARTED', {});
  }

  endMatch() {
    this.state = MatchState.FINISHED;
    eventBus.emit('MATCH_FINISHED', { winner: this.winner });
  }

  getState(): MatchState {
    return this.state;
  }

  getWinner(): string | null {
    return this.winner;
  }

  registerKill(killerId: string, victimId: string) {
    if (this.state !== MatchState.PLAYING || !this.mode) return;

    this.mode.onKill(killerId, victimId);

    const maybeWinner = this.mode.checkWinCondition();
    if (maybeWinner) {
      this.winner = maybeWinner;
      this.endMatch();
    }
  }
}