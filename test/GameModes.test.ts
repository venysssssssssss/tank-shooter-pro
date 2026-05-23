import { describe, it, expect } from 'vitest';
import { GameModeManager, MatchState } from '../src/modes/GameModeManager';
import { FreeForAllMode } from '../src/modes/FreeForAllMode';
import { TeamDeathmatchMode } from '../src/modes/TeamDeathmatchMode';

describe('GameModeManager and FreeForAllMode', () => {
  it('should manage match state correctly', () => {
    const manager = new GameModeManager();
    const mode = new FreeForAllMode(5); // 5 kills to win
    manager.setMode(mode);

    expect(manager.getState()).toBe(MatchState.WAITING);

    manager.startMatch();
    expect(manager.getState()).toBe(MatchState.PLAYING);

    manager.endMatch();
    expect(manager.getState()).toBe(MatchState.FINISHED);
  });

  it('should track individual kills and declare a winner in FFA', () => {
    const manager = new GameModeManager();
    const mode = new FreeForAllMode(2); // 2 kills to win
    manager.setMode(mode);
    manager.startMatch();

    manager.registerKill('player1', 'player2');
    expect(mode.getScore('player1')).toBe(1);
    expect(manager.getState()).toBe(MatchState.PLAYING);

    manager.registerKill('player1', 'player3');
    expect(mode.getScore('player1')).toBe(2);
    
    // 2 kills reached, match should automatically finish
    expect(manager.getState()).toBe(MatchState.FINISHED);
    expect(manager.getWinner()).toBe('player1');
  });
});

describe('TeamDeathmatchMode', () => {
  it('should track team kills and declare a winning team', () => {
    const manager = new GameModeManager();
    const mode = new TeamDeathmatchMode(3); // 3 kills to win
    
    mode.assignTeam('player1', 'Red');
    mode.assignTeam('player2', 'Red');
    mode.assignTeam('player3', 'Blue');
    mode.assignTeam('player4', 'Blue');

    manager.setMode(mode);
    manager.startMatch();

    manager.registerKill('player1', 'player3'); // Red scores
    manager.registerKill('player2', 'player4'); // Red scores
    manager.registerKill('player3', 'player1'); // Blue scores
    manager.registerKill('player1', 'player2'); // Friendly fire (no score or negative score)

    expect(mode.getScore('Red')).toBe(2);
    expect(mode.getScore('Blue')).toBe(1);
    expect(manager.getState()).toBe(MatchState.PLAYING);

    manager.registerKill('player2', 'player3'); // Red scores again
    expect(mode.getScore('Red')).toBe(3);
    
    expect(manager.getState()).toBe(MatchState.FINISHED);
    expect(manager.getWinner()).toBe('Red');
  });
});