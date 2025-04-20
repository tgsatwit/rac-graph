/**
 * Caching utilities for improving performance
 */

// Cache TTL in milliseconds
const DEFAULT_TTL = 1000 * 60 * 15; // 15 minutes

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

/**
 * A simple in-memory cache with TTL support
 */
class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // Return undefined if item doesn't exist
    if (!item) return undefined;
    
    // Return undefined if item is expired
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * Set an item in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options (TTL)
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || DEFAULT_TTL;
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove all expired items from the cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get the number of items in the cache
   */
  get size(): number {
    return this.cache.size;
  }
}

// Export a singleton instance
export const memoryCache = new MemoryCache();

/**
 * Decorator for caching the results of a function
 * @param ttl Time to live in milliseconds
 * @returns Decorated function that caches its results
 */
export function cached(ttl: number = DEFAULT_TTL) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      // Create a cache key from method name and args
      const key = `${propertyKey}:${JSON.stringify(args)}`;
      
      // Check if the result is in the cache
      const cached = memoryCache.get(key);
      if (cached !== undefined) {
        return cached;
      }
      
      // Call the original method
      const result = originalMethod.apply(this, args);
      
      // Cache the result (handle promises)
      if (result instanceof Promise) {
        return result.then((value) => {
          memoryCache.set(key, value, { ttl });
          return value;
        });
      } else {
        memoryCache.set(key, result, { ttl });
        return result;
      }
    };
    
    return descriptor;
  };
} 