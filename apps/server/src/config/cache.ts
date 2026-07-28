// Lightweight in-memory cache system for global queries
interface CacheEntry {
    value: any;
    expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry>();

export const getCache = async (key: string): Promise<any | null> => {
    const entry = memoryStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
        memoryStore.delete(key);
        return null; // Expired
    }

    return entry.value;
};

export const setCache = async (key: string, value: any, ttlSeconds: number = 900): Promise<void> => {
    // Basic memory bounding logic: if map gets too large, purge the oldest items.
    if (memoryStore.size > 500) {
        // Find 50 oldest or expired keys and remove them
        let count = 0;
        const now = Date.now();
        for (const [k, v] of memoryStore.entries()) {
            if (count > 50) break;
            if (now > v.expiresAt || Math.random() < 0.2) {
                memoryStore.delete(k);
                count++;
            }
        }
    }

    memoryStore.set(key, {
        value,
        expiresAt: Date.now() + (ttlSeconds * 1000)
    });
};
