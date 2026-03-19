import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';

const { useResponsiveMock, getButtonSizeMock } = vi.hoisted(() => ({
  useResponsiveMock: vi.fn(),
  getButtonSizeMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: useResponsiveMock,
}));

vi.mock('@/utils/responsive', () => ({
  getButtonSize: getButtonSizeMock,
}));

vi.mock('@/constants/design-tokens', () => ({
  SPACING: {
    base: 8,
    xs: 4,
    sm: 8,
    md: 16,
    xxl: 32,
  },
}));

vi.mock('antd', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  Result: ({
    title,
    subTitle,
    extra,
  }: {
    title?: React.ReactNode;
    subTitle?: React.ReactNode;
    extra?: React.ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <div>{subTitle}</div>
      <div>{extra}</div>
    </div>
  ),
  theme: {
    useToken: () => ({
      token: {
        colorBgElevated: '#fff',
      },
    }),
  },
}));

function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('boom');
  }

  return <div>safe-content</div>;
}

function RecoverableBoundaryHarness() {
  const [shouldThrow, setShouldThrow] = useState(true);

  return (
    <div>
      <button onClick={() => setShouldThrow(false)}>recover-source</button>
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
}

describe('common/ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useResponsiveMock.mockReturnValue({ isMobile: false });
    getButtonSizeMock.mockReturnValue('middle');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>child-content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('child-content')).toBeInTheDocument();
  });

  it('renders the fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('errorState.title')).toBeInTheDocument();
    expect(screen.getByText('errorState.subtitle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'actions.tryAgain' })).toBeInTheDocument();
    expect(getButtonSizeMock).toHaveBeenCalledWith({ isMobile: false });
  });

  it('recovers after reset when the error source is removed', () => {
    render(<RecoverableBoundaryHarness />);

    expect(screen.getByText('errorState.title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'recover-source' }));
    fireEvent.click(screen.getByRole('button', { name: 'actions.tryAgain' }));

    expect(screen.getByText('safe-content')).toBeInTheDocument();
    expect(screen.queryByText('errorState.title')).not.toBeInTheDocument();
  });
});
