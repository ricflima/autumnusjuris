// src/hooks/useOptimizedQuery.ts - Performance optimizations for queries

import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';

// Optimized query hook with built-in memoization and caching strategies
export function useOptimizedQuery<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> = {}
) {
  // Memoize query key to prevent unnecessary re-renders
  const memoizedQueryKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);
  
  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 min
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 min
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Disable refetch on window focus for better UX
    refetchOnMount: true, // Always refetch on component mount
    refetchOnReconnect: true, // Refetch when network reconnects
    ...options,
  });
}

// Hook for paginated queries with optimized performance
export function useOptimizedPaginatedQuery<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: ({ pageParam }: { pageParam?: unknown }) => Promise<TData>,
  options: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> = {}
) {
  const memoizedQueryKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);
  
  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: () => queryFn({ pageParam: 0 }),
    staleTime: 2 * 60 * 1000, // 2 minutes for paginated data
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  });
}

// Hook for real-time data with shorter cache times
export function useOptimizedRealTimeQuery<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> = {}
) {
  const memoizedQueryKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);
  
  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn,
    staleTime: 30 * 1000, // 30 seconds for real-time data
    gcTime: 2 * 60 * 1000, // 2 minutes cache
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    retry: 1,
    refetchOnWindowFocus: true, // Enable for real-time data
    ...options,
  });
}