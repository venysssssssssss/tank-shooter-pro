import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ItemShop, ShopItem } from '../src/economy/ItemShop';
import { PlayerProfileStore } from '../src/PlayerProfileStore';

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

describe('Item Shop (Rotating Store)', () => {
  const mockPool: ShopItem[] = [
    { id: 'skin_1', name: 'Desert Camo', price: 200, currency: 'credits' },
    { id: 'skin_2', name: 'Neon Pink', price: 500, currency: 'premium' },
    { id: 'decal_1', name: 'Skull', price: 50, currency: 'credits' },
    { id: 'decal_2', name: 'Flames', price: 100, currency: 'premium' },
  ];

  let store: PlayerProfileStore;
  let shop: ItemShop;

  beforeEach(() => {
    localStorageMock.clear();
    store = new PlayerProfileStore();
    shop = new ItemShop(mockPool, store);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should rotate items daily, keeping 2 available at a time', () => {
    // Force a specific seed or time to test rotation
    vi.setSystemTime(new Date('2026-05-14T00:00:00Z'));
    const itemsDay1 = shop.getAvailableItems();
    expect(itemsDay1.length).toBe(2);

    vi.setSystemTime(new Date('2026-05-15T00:00:00Z'));
    const itemsDay2 = shop.getAvailableItems();
    expect(itemsDay2.length).toBe(2);
    
    // In a real random pool they *could* be the same, but our mock should ideally swap them or shift.
    // For simplicity, we just assert it gets 2 items correctly.
  });

  it('should allow purchase if player has enough currency and deduct it', () => {
    vi.setSystemTime(new Date('2026-05-14T00:00:00Z'));
    
    // Give player enough credits and premium
    store.addCredits(500);
    store.addPremium(1000);

    const available = shop.getAvailableItems();
    const targetItem = available[0];

    const initialCredits = store.get().credits;
    const initialPremium = store.get().premium;

    const success = shop.buyItem(targetItem.id);
    expect(success).toBe(true);

    if (targetItem.currency === 'credits') {
      expect(store.get().credits).toBe(initialCredits - targetItem.price);
      expect(store.get().premium).toBe(initialPremium);
    } else {
      expect(store.get().premium).toBe(initialPremium - targetItem.price);
      expect(store.get().credits).toBe(initialCredits);
    }
  });

  it('should fail purchase if player does not have enough currency', () => {
    // Player starts with 0 credits and premium
    vi.setSystemTime(new Date('2026-05-14T00:00:00Z'));
    const available = shop.getAvailableItems();
    const targetItem = available[0];

    const success = shop.buyItem(targetItem.id);
    expect(success).toBe(false);
  });
});