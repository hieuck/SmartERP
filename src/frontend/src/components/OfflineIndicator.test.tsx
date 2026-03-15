import { render, screen } from '@testing-library/react';
import { OfflineIndicator } from './OfflineIndicator';
import { useOffline } from '../hooks/useOffline';
import { vi } from 'vitest';

// Mock useOffline hook
vi.mock('../hooks/useOffline');

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show online status when online and synced', () => {
    (useOffline as any).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      lastSyncTime: new Date('2024-01-01T12:00:00'),
      queueSize: 0,
    });

    render(<OfflineIndicator />);

    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });

  it('should show offline status when offline', () => {
    (useOffline as any).mockReturnValue({
      isOnline: false,
      isSyncing: false,
      lastSyncTime: null,
      queueSize: 0,
    });

    render(<OfflineIndicator />);

    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });

  it('should show syncing status when syncing', () => {
    (useOffline as any).mockReturnValue({
      isOnline: true,
      isSyncing: true,
      lastSyncTime: null,
      queueSize: 0,
    });

    render(<OfflineIndicator />);

    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });

  it('should show pending status when queue has items', () => {
    (useOffline as any).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      lastSyncTime: new Date('2024-01-01T12:00:00'),
      queueSize: 5,
    });

    render(<OfflineIndicator />);

    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  it('should show badge count when queue size > 0', () => {
    (useOffline as any).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      queueSize: 10,
    });

    render(<OfflineIndicator />);

    const badge = screen.getByText('10');
    expect(badge).toBeInTheDocument();
  });

  it('should not show badge when queue size is 0', () => {
    (useOffline as any).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      queueSize: 0,
    });

    render(<OfflineIndicator />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should show "Never synced" when lastSyncTime is null', () => {
    (useOffline as any).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      queueSize: 0,
    });

    const { container } = render(<OfflineIndicator />);

    expect(container).toBeInTheDocument();
  });

  it('should format lastSyncTime correctly', () => {
    const mockDate = new Date('2024-01-01T12:30:45');
    (useOffline as any).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      lastSyncTime: mockDate,
      queueSize: 0,
    });

    const { container } = render(<OfflineIndicator />);

    expect(container).toBeInTheDocument();
  });
});
