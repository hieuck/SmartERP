import { useEffect, useRef, useState } from 'react';

interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
}

/**
 * Hook for lazy loading images
 * Only loads image when it enters the viewport
 */
export function useLazyImage(src: string, options: UseLazyImageOptions = {}) {
  const { threshold = 0.1, rootMargin = '50px', placeholder = '/images/placeholder.png' } = options;

  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load image immediately
      loadImage(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage(src);
            if (imgRef.current) {
              observer.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, threshold, rootMargin]);

  const loadImage = (imageSrc: string) => {
    const img = new Image();

    img.onload = () => {
      setImageSrc(imageSrc);
      setIsLoading(false);
      setError(null);
    };

    img.onerror = () => {
      setError(new Error('Failed to load image'));
      setIsLoading(false);
    };

    img.src = imageSrc;
  };

  return {
    imgRef,
    imageSrc,
    isLoading,
    error,
  };
}

/**
 * Hook for lazy loading multiple images
 */
export function useLazyImages(_images: string[], _options: UseLazyImageOptions = {}) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());

  const loadImage = (src: string) => {
    if (loadedImages.has(src) || loadingImages.has(src)) {
      return;
    }

    setLoadingImages((prev) => new Set(prev).add(src));

    const img = new Image();

    img.onload = () => {
      setLoadedImages((prev) => new Set(prev).add(src));
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(src);
        return next;
      });
    };

    img.onerror = () => {
      setErrors((prev) => new Map(prev).set(src, new Error('Failed to load image')));
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(src);
        return next;
      });
    };

    img.src = src;
  };

  return {
    loadImage,
    isLoaded: (src: string) => loadedImages.has(src),
    isLoading: (src: string) => loadingImages.has(src),
    getError: (src: string) => errors.get(src),
  };
}
