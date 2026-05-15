import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';
import { PlayerProfileStore } from '../src/PlayerProfileStore';

// Mock simple do localStorage para testes
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) { return store[key] || null; },
    setItem(key: string, value: string) { store[key] = value.toString(); },
    removeItem(key: string) { delete store[key]; },
    clear() { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('PlayerProfileStore - Progression and Economy', () => {
  let store: PlayerProfileStore;

  beforeEach(() => {
    localStorageMock.clear();
    store = new PlayerProfileStore();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should increase XP and level up correctly', () => {
    expect(store.get().level).toBe(1);
    expect(store.get().xp).toBe(0);

    store.addXP(150); // Assumindo que 100 XP sobe para lvl 2.
    
    expect(store.get().level).toBe(2);
    expect(store.get().xp).toBe(50); // Sobra 50
  });

  it('should handle multiple level ups if XP is very high', () => {
    store.addXP(350); // lvl 1(0->100), lvl 2(0->200) -> lvl 3, sobra 50. Total 350.
    // Lvl 1 -> 2: Custa 100. Sobra 250.
    // Lvl 2 -> 3: Custa 200. Sobra 50.
    expect(store.get().level).toBe(3);
    expect(store.get().xp).toBe(50);
  });

  it('should add and deduct soft currency (credits)', () => {
    store.addCredits(100);
    expect(store.get().credits).toBe(100);

    const success = store.spendCredits(40);
    expect(success).toBe(true);
    expect(store.get().credits).toBe(60);

    const fail = store.spendCredits(100); // Não tem saldo
    expect(fail).toBe(false);
    expect(store.get().credits).toBe(60);
  });

  it('should add and deduct hard currency (premium)', () => {
    store.addPremium(50);
    expect(store.get().premium).toBe(50);

    const success = store.spendPremium(30);
    expect(success).toBe(true);
    expect(store.get().premium).toBe(20);

    const fail = store.spendPremium(50);
    expect(fail).toBe(false);
    expect(store.get().premium).toBe(20);
  });
});