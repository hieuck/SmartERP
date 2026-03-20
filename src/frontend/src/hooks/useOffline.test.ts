import { renderHook, act, waitFor } from '@testing-library/react';
import { useOffline } from './useOffline';
import { syncManager } from '../lib/offline/sync-manager';
import { SyncResult } from '../lib/offline/sync-manager';
import { vi } from 'vitest';

// Mock sync-manager
vi.mock('../lib/offline/sync-manager', () => ({
  syncManager: {
    getQueueSize: vi.fn(),
    sync: vi.fn(),
    getLastSyncTime: vi.fn(),
  },
}));

const mockGetQueueSize = vi.mocked(syncManager.getQueueSize);
const mockSync = vi.mocked(syncManager.sync);
const mockGetLastSyncTime = vi.mocked(syncManager.getLastSyncTime);
const createSyncResult = (overrides: Partial<SyncResult> = {}): SyncResult => ({
  success: true,
  pulled: 0,
  pushed: 0,
  conflicts: 0,
  errors: [],
  ...overrides,
});

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
    vi.useRealTimers();
  });

  it('should initialize with online status', () => {
    mockGetQueueSize.mockResolvedValue(0);

    const { result } = renderHook(() => useOffline());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSyncTime).toBeNull();
    expect(result.current.queueSize).toBe(0);
  });

  it('should update online status when going offline', async () => {
    mockGetQueueSize.mockResolvedValue(0);

    const { result } = renderHook(() => useOffline());

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should update online status when going online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    mockGetQueueSize.mockResolvedValue(0);

    const { result } = renderHook(() => useOffline());

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should register periodic queue size polling', async () => {
    mockGetQueueSize.mockResolvedValue(0);
    let intervalCallback: (() => void | Promise<void>) | undefined;
    const setIntervalSpy = vi
      .spyOn(window, 'setInterval')
      .mockImplementation(((callback: TimerHandler) => {
        intervalCallback = callback as () => void | Promise<void>;
        return 1 as unknown as ReturnType<typeof setInterval>;
      }) as unknown as typeof setInterval);
    const clearIntervalSpy = vi
      .spyOn(window, 'clearInterval')
      .mockImplementation(() => undefined);

    const { result } = renderHook(() => useOffline());

    await waitFor(() => {
      expect(result.current.queueSize).toBe(0);
    });
    expect(mockGetQueueSize).toHaveBeenCalledTimes(1);
    expect(intervalCallback).toBeDefined();
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('should sync successfully', async () => {
    const mockToken = 'test-token';
    const mockSyncTime = new Date();
    mockGetQueueSize.mockResolvedValue(0);
    mockSync.mockResolvedValue(createSyncResult());
    mockGetLastSyncTime.mockReturnValue(mockSyncTime);

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
    mockGetQueueSize.mockResolvedValue(0);
    mockSync.mockRejectedValue(mockError);

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
    mockGetQueueSize.mockResolvedValue(0);
    let resolveSync: ((result: SyncResult) => void) | undefined;
    mockSync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSync = resolve;
        })
    );

    const { result } = renderHook(() => useOffline());

    act(() => {
      void result.current.sync(mockToken);
    });

    expect(result.current.isSyncing).toBe(true);

    await act(async () => {
      resolveSync?.(createSyncResult());
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    mockGetQueueSize.mockResolvedValue(0);

    const { unmount } = renderHook(() => useOffline());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
