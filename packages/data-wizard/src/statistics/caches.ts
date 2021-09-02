/**
 * Cache some statistics to improve performance
 */
const CACHES: WeakMap<any[], Map<string, any>> = new WeakMap();

/**
 * cache the value for target and key
 * @param target - target
 * @param key - key
 * @param value - value
 */
export function set<T>(target: any[], key: string, value: T) {
  // TODO: If target is object, the equal condition needs special handling
  if (!CACHES.get(target)) {
    CACHES.set(target, new Map());
  }
  CACHES.get(target)!.set(key, value);
  return value;
}

/**
 * get the cached value for target and key
 * @param target - target
 * @param key - key
 */
export function get<T>(target: any[], key: string): T | undefined {
  const cache = CACHES.get(target);
  if (!cache) return undefined;
  return cache.get(key);
}
