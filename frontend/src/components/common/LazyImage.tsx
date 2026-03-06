import React from 'react';
import { Spin } from 'antd';
import { useLazyImage } from '../../hooks/useLazyImage';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
  showLoader?: boolean;
}

/**
 * LazyImage component that loads images only when they enter the viewport
 * Improves initial page load performance
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  threshold,
  rootMargin,
  fallback,
  showLoader = true,
  className,
  style,
  ...props
}) => {
  const { imgRef, imageSrc, isLoading, error } = useLazyImage(src, {
    placeholder,
    threshold,
    rootMargin,
  });

  if (error && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={className}
        style={{
          opacity: isLoading ? 0.5 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
        {...props}
      />
      {isLoading && showLoader && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Spin size="small" />
        </div>
      )}
    </div>
  );
};

/**
 * LazyBackgroundImage component for background images
 */
interface LazyBackgroundImageProps {
  src: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyBackgroundImage: React.FC<LazyBackgroundImageProps> = ({
  src,
  children,
  className,
  style,
  placeholder,
  threshold,
  rootMargin,
}) => {
  const { imgRef, imageSrc, isLoading } = useLazyImage(src, {
    placeholder,
    threshold,
    rootMargin,
  });

  return (
    <div
      ref={imgRef as any}
      className={className}
      style={{
        backgroundImage: `url(${imageSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: isLoading ? 0.5 : 1,
        transition: 'opacity 0.3s ease-in-out',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
