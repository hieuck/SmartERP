import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmptyState from './EmptyState';

const { useResponsiveMock, getSpacingMock, getButtonSizeMock } = vi.hoisted(() => ({
  useResponsiveMock: vi.fn(),
  getSpacingMock: vi.fn(),
  getButtonSizeMock: vi.fn(),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: useResponsiveMock,
}));

vi.mock('@/utils/responsive', () => ({
  getSpacing: getSpacingMock,
  getButtonSize: getButtonSizeMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('EmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResponsiveMock.mockReturnValue({ isMobile: false });
    getSpacingMock.mockReturnValue(16);
    getButtonSizeMock.mockReturnValue('middle');
  });

  it('renders the default empty description when none is provided', () => {
    render(<EmptyState />);
    expect(screen.getByText('emptyState.noData')).toBeInTheDocument();
  });

  it('renders a create action and forwards clicks when enabled', () => {
    const handleAction = vi.fn();

    render(<EmptyState showAction onAction={handleAction} actionText="Create item" />);

    fireEvent.click(screen.getByRole('button', { name: /create item/i }));
    expect(handleAction).toHaveBeenCalled();
  });

  it('does not render the action button when the action is disabled', () => {
    render(<EmptyState showAction={false} onAction={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
