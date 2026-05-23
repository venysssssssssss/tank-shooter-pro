import { PlayerProfileStore } from '../PlayerProfileStore';

export interface ShopItem {
    id: string;
    name: string;
    price: number;
    currency: 'credits' | 'premium';
}

export class ItemShop {
    private pool: ShopItem[];
    private profileStore: PlayerProfileStore;

    constructor(pool: ShopItem[], profileStore: PlayerProfileStore) {
        this.pool = pool;
        this.profileStore = profileStore;
    }

    getAvailableItems(): ShopItem[] {
        // Rotate items daily based on current UTC day
        const now = new Date();
        const daySeed = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
        
        // Simple deterministic pseudo-random rotation for 2 items
        const numItems = this.pool.length;
        if (numItems <= 2) return this.pool;

        const index1 = daySeed % numItems;
        let index2 = (daySeed * 7) % numItems; // Just a simple multiplier
        if (index1 === index2) {
            index2 = (index2 + 1) % numItems;
        }

        return [this.pool[index1], this.pool[index2]];
    }

    buyItem(itemId: string): boolean {
        // If already owned, prevent duplicate purchases
        if (this.profileStore.hasItem(itemId)) return false;

        const available = this.getAvailableItems();
        const item = available.find(i => i.id === itemId);

        if (!item) return false; // Item not available today

        let success = false;
        if (item.currency === 'credits') {
            success = this.profileStore.spendCredits(item.price);
        } else if (item.currency === 'premium') {
            success = this.profileStore.spendPremium(item.price);
        }

        if (success) {
            // Deliver item to player inventory
            this.profileStore.addItemToInventory(itemId);
            return true;
        }

        return false;
    }
}