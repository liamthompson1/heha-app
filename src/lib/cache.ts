interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry>();

/** Default max-age before a cached value is considered stale (2 minutes). */
export const DEFAULT_MAX_AGE_MS = 2 * 60 * 1000;

export function get<T>(key: string): T | undefined {
  const entry = store.get(key);
  return entry ? (entry.value as T) : undefined;
}

/** Returns the cached value only if it was stored within `maxAge` ms. */
export function getFresh<T>(key: string, maxAge = DEFAULT_MAX_AGE_MS): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > maxAge) return undefined;
  return entry.value as T;
}

/** Returns true if the cached value exists but is older than `maxAge`. */
export function isStale(key: string, maxAge = DEFAULT_MAX_AGE_MS): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp > maxAge;
}

export function set<T>(key: string, value: T): void {
  store.set(key, { value, timestamp: Date.now() });
}

export function del(key: string): void {
  store.delete(key);
}

export function clear(): void {
  store.clear();
}
