import React from 'react';
import { Spin, Alert } from 'antd';
import { useLazyData, useInfiniteScroll } from '@/hooks/useLazyData';

interface LazyDataLoaderProps<T> {
  fetchData: () => Promise<T>;
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: Error, refetch: () => void) => React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  minHeight?: number;
}

/**
 * Component that lazy loads data when it enters the viewport
 * Useful for expensive data fetching operations
 */
export function LazyDataLoader<T>({
  fetchData,
  children,
  loadingComponent,
  errorComponent,
  threshold,
  rootMargin,
  enabled = true,
  minHeight = 200,
}: LazyDataLoaderProps<T>) {
  const { elementRef, data, isLoading, error, refetch } = useLazyData<T>({
    fetchData,
    threshold,
    rootMargin,
    enabled,
  });

  return (
    <div ref={elementRef} style={{ minHeight: `${minHeight}px` }}>
      {isLoading &&
        (loadingComponent || (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" tip="Loading data..." />
          </div>
        ))}

      {error &&
        !isLoading &&
        (errorComponent ? (
          errorComponent(error, refetch)
        ) : (
          <Alert
            message="Error"
            description={error.message}
            type="error"
            showIcon
            action={<a onClick={refetch}>Retry</a>}
          />
        ))}

      {data && !isLoading && !error && children(data)}
    </div>
  );
}

/**
 * Component for infinite scroll
 */
interface InfiniteScrollProps<T> {
  fetchPage: (page: number) => Promise<{ data: T[]; hasMore: boolean }>;
  renderItem: (item: T, index: number) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: Error) => React.ReactNode;
  emptyComponent?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export function InfiniteScroll<T>({
  fetchPage,
  renderItem,
  loadingComponent,
  errorComponent,
  emptyComponent,
  threshold,
  rootMargin,
  enabled = true,
}: InfiniteScrollProps<T>) {
  const { loaderRef, data, isLoading, error, hasMore } = useInfiniteScroll({
    fetchPage,
    threshold,
    rootMargin,
    enabled,
  });

  if (error && !isLoading) {
    return (
      <>
        {errorComponent ? (
          errorComponent(error)
        ) : (
          <Alert message="Error" description={error.message} type="error" showIcon />
        )}
      </>
    );
  }

  if (!data && isLoading) {
    return (
      <>
        {loadingComponent || (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" tip="Loading..." />
          </div>
        )}
      </>
    );
  }

  if (data && Array.isArray(data) && data.length === 0) {
    return (
      <>
        {emptyComponent || (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
            No data available
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {data &&
        Array.isArray(data) &&
        data.map((item, index) => (
          <React.Fragment key={index}>{renderItem(item, index)}</React.Fragment>
        ))}

      {hasMore && (
        <div ref={loaderRef} style={{ textAlign: 'center', padding: '20px 0' }}>
          {isLoading && (loadingComponent || <Spin tip="Loading more..." />)}
        </div>
      )}
    </>
  );
}

export default LazyDataLoader;
