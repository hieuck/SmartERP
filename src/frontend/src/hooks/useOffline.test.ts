import { renderHook, act, waitFor } from '@testing-library/react';
import { useOffline } from './useOffline';
import { syncManager } from '../lib/offline/sync-manager';
import { vi } from 'vitest';

// Mock sync-manager
vi.mock('../lib/offline/sync-manager', () => ({
  syncManager: {
    getQueueSize: vi.fn(),
    sync: vi.fn(),
    getLastSyncTime: vi.fn(),
  },
}));

describe('useOffline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with online status', () => {
    (syncManager.getQueueSize as any).mockResolvedValue(0);

    const { result } = renderHook(() => useOffline());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSyncTime).toBeNull();
    expect(result.current.queueSize).toBe(0);
  });

  it('should update online status when going offline', async () => {
    (syncManager.getQueueSize as any).mockResolvedValue(0);

    const { result } = renderHook(() => useOffline());

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should update online status when going online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    (syncManager.getQueueSize as any).mockResolvedValue(0);

    const { result } = renderHook(() => useOffline());

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should update queue size periodically', async () => {
    vi.useFakeTimers();
    (syncManager.getQueueSize as any)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(5);

    const { result } = renderHook(() => useOffline());

    await waitFor(() => {
      expect(result.current.queueSize).toBe(0);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.queueSize).toBe(5);
    });

    vi.useRealTimers();
  });

  it('should sync successfully', async () => {
    const mockToken = 'test-token';
    const mockSyncTime = new Date();
    (syncManager.getQueueSize as any).mockResolvedValue(0);
    (syncManager.sync as any).mockResolvedValue({ success: true });
    (syncManager.getLastSyncTime as any).mockReturnValue(mockSyncTime);

    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await result.current.sync(mockToken);
    });

    expect(syncManager.sync).toHaveBeenCalledWith(mockToken);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSyncTime).toEqual(mockSyncTime);
    expect(result.current.queueSize).toBe(0);
  });

  it('should handle sync errors', async () => {
    const mockToken = 'test-token';
    const mockError = new Error('Sync failed');
    (syncManager.getQueueSize as any).mockResolvedValue(0);
    (syncManager.sync as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useOffline());

    await expect(
      act(async () => {
        await result.current.sync(mockToken);
      })
    ).rejects.toThrow('Sync failed');

    expect(result.current.isSyncing).toBe(false);
  });

  it('should set isSyncing to true during sync', async () => {
    const mockToken = 'test-token';
    (syncManager.getQueueSize as any).mockResolvedValue(0);
    (syncManager.sync as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    const { result } = renderHook(() => useOffline());

    act(() => {
      result.current.sync(mockToken);
    });

    expect(result.current.isSyncing).toBe(true);

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    (syncManager.getQueueSize as any).mockResolvedValue(0);

    const { unmount } = renderHook(() => useOffline());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
