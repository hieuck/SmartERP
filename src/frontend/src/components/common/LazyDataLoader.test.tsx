import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LazyDataLoader, { InfiniteScroll } from './LazyDataLoader';

const { useLazyDataMock, useInfiniteScrollMock } = vi.hoisted(() => ({
  useLazyDataMock: vi.fn(),
  useInfiniteScrollMock: vi.fn(),
}));

vi.mock('@/hooks/useLazyData', () => ({
  useLazyData: useLazyDataMock,
  useInfiniteScroll: useInfiniteScrollMock,
}));

describe('LazyDataLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state while data is loading', () => {
    useLazyDataMock.mockReturnValue({
      elementRef: vi.fn(),
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <LazyDataLoader fetchData={vi.fn()}>{(data: { name: string }) => <div>{data.name}</div>}</LazyDataLoader>,
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders loaded content when data is available', () => {
    useLazyDataMock.mockReturnValue({
      elementRef: vi.fn(),
      data: { name: 'Camera' },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <LazyDataLoader fetchData={vi.fn()}>{(data: { name: string }) => <div>{data.name}</div>}</LazyDataLoader>,
    );

    expect(screen.getByText('Camera')).toBeInTheDocument();
  });

  it('renders error state and retries through the default action', () => {
    const refetch = vi.fn();
    useLazyDataMock.mockReturnValue({
      elementRef: vi.fn(),
      data: null,
      isLoading: false,
      error: new Error('boom'),
      refetch,
    });

    render(
      <LazyDataLoader fetchData={vi.fn()}>{(data: { name: string }) => <div>{data.name}</div>}</LazyDataLoader>,
    );

    expect(screen.getByText('boom')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });
});

describe('InfiniteScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an empty state when there is no data', () => {
    useInfiniteScrollMock.mockReturnValue({
      loaderRef: vi.fn(),
      data: [],
      isLoading: false,
      error: null,
      hasMore: false,
    });

    render(<InfiniteScroll fetchPage={vi.fn()} renderItem={(item: string) => <div>{item}</div>} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders list items and the loader when more data is available', () => {
    useInfiniteScrollMock.mockReturnValue({
      loaderRef: vi.fn(),
      data: ['A', 'B'],
      isLoading: true,
      error: null,
      hasMore: true,
    });

    render(<InfiniteScroll fetchPage={vi.fn()} renderItem={(item: string) => <div>{item}</div>} />);

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('Loading more...')).toBeInTheDocument();
  });
});
