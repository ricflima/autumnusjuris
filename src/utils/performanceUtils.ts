// src/utils/performanceUtils.ts - Performance utilities

import { useCallback, useRef, useMemo } from 'react';

// Debounce hook for search and other frequent operations
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// Throttle hook for scroll events and other high-frequency events
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = new Date().getTime();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}

// Simple in-memory cache
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMinutes = 5) {
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const serviceCache = new SimpleCache(10); // 10 minutes TTL

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure function execution time
  measure: <T>(name: string, fn: () => T): T => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  },

  // Measure async function execution time
  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  },

  // Track memory usage
  trackMemory: (label: string) => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`Memory [${label}]:`, {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
      });
    }
  },
};

// Bundle size analyzer helper
export const bundleAnalyzer = {
  // Lazy load heavy dependencies
  loadHeavyDependency: async (importFn: () => Promise<any>) => {
    try {
      return await performanceMonitor.measureAsync('Bundle Load', importFn);
    } catch (error) {
      console.error('Failed to load bundle:', error);
      throw error;
    }
  },
};

// Image optimization utilities
export const imageUtils = {
  // Create optimized image URL
  getOptimizedImageUrl: (url: string, width?: number, height?: number, quality = 80) => {
    // In a real application, this would integrate with an image optimization service
    // For now, return the original URL
    return url;
  },

  // Preload critical images
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },
};

// Component performance helpers
export const componentUtils = {
  // Create stable callback references
  useStableCallback: <T extends (...args: any[]) => any>(callback: T): T => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    return useCallback(
      ((...args: any[]) => callbackRef.current(...args)) as T,
      []
    );
  },

  // Memoize expensive computations
  useMemoizedValue: <T>(factory: () => T, deps: React.DependencyList): T => {
    return useMemo(factory, deps);
  },
};

export { SimpleCache };