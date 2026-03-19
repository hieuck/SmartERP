import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoadingSpinner from './LoadingSpinner';

const { useResponsiveMock, getSpacingMock } = vi.hoisted(() => ({
  useResponsiveMock: vi.fn(),
  getSpacingMock: vi.fn(),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: useResponsiveMock,
}));

vi.mock('@/utils/responsive', () => ({
  getSpacing: getSpacingMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResponsiveMock.mockReturnValue({ isMobile: false });
    getSpacingMock.mockReturnValue(16);
  });

  it('renders the default loading tip', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('loadingState.loading')).toBeInTheDocument();
  });

  it('renders a custom tip when provided', () => {
    render(<LoadingSpinner tip="Saving changes..." />);
    expect(screen.getByText('Saving changes...')).toBeInTheDocument();
  });

  it('renders the full-screen variant', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    const wrapper = container.firstElementChild as HTMLDivElement;

    expect(wrapper.style.position).toBe('fixed');
    expect(screen.getByText('loadingState.loading')).toBeInTheDocument();
  });
});
