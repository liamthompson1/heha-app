const store = new Map<string, unknown>();

export function get<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function set<T>(key: string, value: T): void {
  store.set(key, value);
}

export function del(key: string): void {
  store.delete(key);
}

export function clear(): void {
  store.clear();
}
