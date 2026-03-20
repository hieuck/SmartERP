import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useLazyImage, useLazyImages } from './useLazyImage';

type MockImageBehaviour = 'load' | 'error';

describe('useLazyImage', () => {
  let imageBehaviour: MockImageBehaviour;
  let originalImage: typeof Image;
  let originalIntersectionObserver: typeof window.IntersectionObserver | undefined;

  beforeEach(() => {
    imageBehaviour = 'load';
    originalImage = window.Image;
    originalIntersectionObserver = window.IntersectionObserver;

    class MockImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_value: string) {
        queueMicrotask(() => {
          if (imageBehaviour === 'load') {
            this.onload?.();
          } else {
            this.onerror?.();
          }
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.Image = MockImage as any;
  });

  afterEach(() => {
    window.Image = originalImage;
    if (originalIntersectionObserver) {
      window.IntersectionObserver = originalIntersectionObserver;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).IntersectionObserver;
    }
  });

  it('loads immediately when IntersectionObserver is unavailable', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).IntersectionObserver;

    const { result } = renderHook(() => useLazyImage('/images/product.png'));

    await waitFor(() => {
      expect(result.current.imageSrc).toBe('/images/product.png');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('uses the placeholder when src is empty', () => {
    const { result } = renderHook(() => useLazyImage(''));

    expect(result.current.imageSrc).toBe('/images/placeholder.png');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('tracks load and error state for multiple images', async () => {
    const { result } = renderHook(() => useLazyImages([]));

    act(() => {
      result.current.loadImage('/images/a.png');
    });

    await waitFor(() => {
      expect(result.current.isLoaded('/images/a.png')).toBe(true);
    });

    imageBehaviour = 'error';

    act(() => {
      result.current.loadImage('/images/broken.png');
    });

    await waitFor(() => {
      expect(result.current.getError('/images/broken.png')).toBeInstanceOf(Error);
    });

    expect(result.current.isLoading('/images/a.png')).toBe(false);
    expect(result.current.isLoading('/images/broken.png')).toBe(false);
  });
});
