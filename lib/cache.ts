import { setTimeout as setNodeTimeout } from 'node:timers/promises';

type CacheValue = {
  expiresAt: number;
  value: unknown;
};

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

class MemoryCache implements CacheAdapter {
  private store = new Map<string, CacheValue>();

  constructor(private readonly maxEntries = 500) {}

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // LRU: move to end
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    this.prune();
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  private prune() {
    if (this.store.size <= this.maxEntries) return;
    const overflow = this.store.size - this.maxEntries;
    const keys = this.store.keys();
    for (let i = 0; i < overflow; i++) {
      const next = keys.next();
      if (next.done) break;
      this.store.delete(next.value);
    }
  }
}

class RedisCacheStub implements CacheAdapter {
  constructor(private readonly url: string) {
    void url;
  }

  async get<T>(_key: string): Promise<T | null> {
    // TODO: Implement Redis adapter when infrastructure is available
    return null;
  }

  async set<T>(_key: string, _value: T, _ttlSeconds: number): Promise<void> {
    // noop stub
  }

  async del(_key: string): Promise<void> {
    // noop stub
  }
}

const redisUrl = process.env.REDIS_URL;
const adapter: CacheAdapter = redisUrl ? new RedisCacheStub(redisUrl) : new MemoryCache();

export async function cacheGet<T>(key: string): Promise<T | null> {
  return adapter.get<T>(key);
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  return adapter.set(key, value, ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  return adapter.del(key);
}

export async function sleep(ms: number) {
  await setNodeTimeout(ms);
}
