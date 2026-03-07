import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyDataOptions<T> {
  threshold?: number;
  rootMargin?: string;
  fetchData: () => Promise<T>;
  enabled?: boolean;
}

/**
 * Hook for lazy loading data
 * Only fetches data when the component enters the viewport
 */
export function useLazyData<T>(options: UseLazyDataOptions<T>) {
  const { threshold = 0.1, rootMargin = '50px', fetchData, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef<boolean>(false);

  const loadData = useCallback(async () => {
    if (hasLoadedRef.current || isLoading) {
      return;
    }

    hasLoadedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, isLoading]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load data immediately
      loadData();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoadedRef.current) {
            loadData();
          }
        });
      },
      {
        threshold,
        rootMargin,
      },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [enabled, threshold, rootMargin, loadData]);

  const refetch = useCallback(() => {
    hasLoadedRef.current = false;
    loadData();
  }, [loadData]);

  return {
    elementRef,
    data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for infinite scroll with lazy loading
 */
interface UseInfiniteScrollOptions<T> {
  fetchPage: (page: number) => Promise<{ data: T[]; hasMore: boolean }>;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export function useInfiniteScroll<T>(options: UseInfiniteScrollOptions<T>) {
  const { fetchPage, threshold = 0.1, rootMargin = '50px', enabled = true } = options;

  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchPage(page);
      setData((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more data'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, page, isLoading, hasMore]);

  useEffect(() => {
    if (!enabled || !hasMore) {
      return;
    }

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMore();
          }
        });
      },
      {
        threshold,
        rootMargin,
      },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [enabled, threshold, rootMargin, loadMore, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    loaderRef,
    data,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
  };
}
