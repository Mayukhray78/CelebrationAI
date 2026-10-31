/**
 * Lightweight in-memory TTL (Time-To-Live) cache for backend optimization.
 * Reduces redundant Gemini API calls and enables instant responses for duplicate requests.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;
  private defaultTtlMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxEntries = 200, defaultTtlMs = 5 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;

    // Periodic cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);

    // Unref so cleanup interval doesn't hold process open in test runners
    if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  public set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    // Evict oldest entry if size limit reached
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances for plans and health checks
export const planCache = new MemoryCache<any>(100, 10 * 60 * 1000); // 10 minutes TTL
export const healthCache = new MemoryCache<any>(5, 30 * 1000); // 30 seconds TTL
