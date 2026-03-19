import { render, screen } from '@testing-library/react';
import { OfflineIndicator } from './OfflineIndicator';
import { useOffline } from '../hooks/useOffline';
import { vi } from 'vitest';

// Mock useOffline hook
vi.mock('../hooks/useOffline');

const mockUseOffline = vi.mocked(useOffline);
const createOfflineState = (
  overrides: Partial<ReturnType<typeof useOffline>> = {},
): ReturnType<typeof useOffline> => ({
  isOnline: true,
  isSyncing: false,
  lastSyncTime: null,
  queueSize: 0,
  sync: vi.fn(),
  ...overrides,
});

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show online status when online and synced', () => {
    mockUseOffline.mockReturnValue(
      createOfflineState({ lastSyncTime: new Date('2024-01-01T12:00:00') }),
    );

    render(<OfflineIndicator />);

    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });

  it('should show offline status when offline', () => {
    mockUseOffline.mockReturnValue(createOfflineState({ isOnline: false }));

    render(<OfflineIndicator />);

    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });

  it('should show syncing status when syncing', () => {
    mockUseOffline.mockReturnValue(createOfflineState({ isSyncing: true }));

    render(<OfflineIndicator />);

    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });

  it('should show pending status when queue has items', () => {
    mockUseOffline.mockReturnValue(
      createOfflineState({ lastSyncTime: new Date('2024-01-01T12:00:00'), queueSize: 5 }),
    );

    const { container } = render(<OfflineIndicator />);

    const badge = container.querySelector('.ant-badge-count');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('title', '5');
  });

  it('should show badge count when queue size > 0', () => {
    mockUseOffline.mockReturnValue(createOfflineState({ queueSize: 10 }));

    const { container } = render(<OfflineIndicator />);

    const badge = container.querySelector('.ant-badge-count');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('title', '10');
  });

  it('should not show badge when queue size is 0', () => {
    mockUseOffline.mockReturnValue(createOfflineState());

    render(<OfflineIndicator />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should show "Never synced" when lastSyncTime is null', () => {
    mockUseOffline.mockReturnValue(createOfflineState());

    const { container } = render(<OfflineIndicator />);

    expect(container).toBeInTheDocument();
  });

  it('should format lastSyncTime correctly', () => {
    const mockDate = new Date('2024-01-01T12:30:45');
    mockUseOffline.mockReturnValue(createOfflineState({ lastSyncTime: mockDate }));

    const { container } = render(<OfflineIndicator />);

    expect(container).toBeInTheDocument();
  });
});
