import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LazyImage, { LazyBackgroundImage } from './LazyImage';

const { useLazyImageMock } = vi.hoisted(() => ({
  useLazyImageMock: vi.fn(),
}));

vi.mock('@/hooks/useLazyImage', () => ({
  useLazyImage: useLazyImageMock,
}));

describe('LazyImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the current image source from the hook', () => {
    useLazyImageMock.mockReturnValue({
      imgRef: vi.fn(),
      imageSrc: '/images/camera.png',
      isLoading: false,
      error: null,
    });

    render(<LazyImage src="/images/camera.png" alt="Camera" />);

    const image = screen.getByAltText('Camera') as HTMLImageElement;
    expect(image.src).toContain('/images/camera.png');
  });

  it('renders the fallback when the hook reports an error', () => {
    useLazyImageMock.mockReturnValue({
      imgRef: vi.fn(),
      imageSrc: '/images/placeholder.png',
      isLoading: false,
      error: new Error('Failed to load image'),
    });

    render(
      <LazyImage
        src="/images/missing.png"
        alt="Missing"
        fallback={<div>image-fallback</div>}
      />,
    );

    expect(screen.getByText('image-fallback')).toBeInTheDocument();
    expect(screen.queryByAltText('Missing')).not.toBeInTheDocument();
  });

  it('shows a loader while the image is loading', () => {
    useLazyImageMock.mockReturnValue({
      imgRef: vi.fn(),
      imageSrc: '/images/placeholder.png',
      isLoading: true,
      error: null,
    });

    const { container } = render(<LazyImage src="/images/camera.png" alt="Camera" />);
    expect(container.querySelector('.ant-spin')).not.toBeNull();
  });
});

describe('LazyBackgroundImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the hook image source as background image', () => {
    useLazyImageMock.mockReturnValue({
      imgRef: vi.fn(),
      imageSrc: '/images/banner.png',
      isLoading: false,
      error: null,
    });

    render(
      <LazyBackgroundImage src="/images/banner.png">
        <div>banner-content</div>
      </LazyBackgroundImage>,
    );

    const content = screen.getByText('banner-content').parentElement as HTMLDivElement;
    expect(content.style.backgroundImage).toContain('/images/banner.png');
  });
});
