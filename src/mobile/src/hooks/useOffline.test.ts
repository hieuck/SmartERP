import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useOffline } from './useOffline';
import offlineReducer from '../store/slices/offlineSlice';
import { networkStatusService } from '../services/network/networkStatus';
import { syncService } from '../services/sync/syncService';
import { offlineStorage } from '../services/storage/offlineStorage';

// Mock dependencies
jest.mock('../services/network/networkStatus');
jest.mock('../services/sync/syncService');
jest.mock('../services/storage/offlineStorage');

describe('useOffline', () => {
  let store: any;
  let wrapper: any;

  beforeEach(() => {
    // Create fresh store for each test
    store = configureStore({
      reducer: {
        offline: offlineReducer,
      },
    });

    // Create wrapper with Provider
    wrapper = ({ children }: any) => (
      <Provider store={store}>{children}</Provider>
    );

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (networkStatusService.initialize as jest.Mock).mockReturnValue(undefined);
    (networkStatusService.addListener as jest.Mock).mockReturnValue(jest.fn());
    (networkStatusService.cleanup as jest.Mock).mockReturnValue(undefined);
    (networkStatusService.checkConnection as jest.Mock).mockResolvedValue(true);
    (networkStatusService.getStatus as jest.Mock).mockReturnValue(true);

    (syncService.addSyncListener as jest.Mock).mockReturnValue(jest.fn());
    (syncService.getPendingSyncCount as jest.Mock).mockResolvedValue(0);
    (syncService.syncAll as jest.Mock).mockResolvedValue({
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    });

    (offlineStorage.getOfflineMode as jest.Mock).mockResolvedValue(false);
    (offlineStorage.getLastSync as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize network monitoring', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(networkStatusService.initialize).toHaveBeenCalled();
      });
    });

    it('should load initial offline state', async () => {
      (offlineStorage.getOfflineMode as jest.Mock).mockResolvedValue(true);
      (offlineStorage.getLastSync as jest.Mock).mockResolvedValue(1234567890);

      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(offlineStorage.getOfflineMode).toHaveBeenCalled();
      expect(offlineStorage.getLastSync).toHaveBeenCalled();
    });

    it('should setup network status listener', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(networkStatusService.addListener).toHaveBeenCalled();
      });
    });

    it('should setup sync listener', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(syncService.addSyncListener).toHaveBeenCalled();
      });
    });
  });

  describe('Network Status Changes', () => {
    it('should update offline status when network changes', async () => {
      let networkListener: any;
      (networkStatusService.addListener as jest.Mock).mockImplementation((listener) => {
        networkListener = listener;
        return jest.fn();
      });

      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Simulate going offline
      act(() => {
        networkListener(false);
      });

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });

      // Simulate going online
      act(() => {
        networkListener(true);
      });

      await waitFor(() => {
        expect(result.current.isOffline).toBe(false);
      });
    });
  });

  describe('Sync Operations', () => {
    it('should trigger sync successfully', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(syncService.syncAll).toHaveBeenCalled();
      expect(result.current.isSyncing).toBe(false);
    });

    it('should not trigger sync if already syncing', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Start first sync
      const syncPromise = act(async () => {
        await result.current.triggerSync();
      });

      // Try to start second sync while first is in progress
      await act(async () => {
        await result.current.triggerSync();
      });

      await syncPromise;

      // syncAll should only be called once
      expect(syncService.syncAll).toHaveBeenCalledTimes(1);
    });

    it('should handle sync errors', async () => {
      (syncService.syncAll as jest.Mock).mockRejectedValue(new Error('Sync failed'));

      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(result.current.syncError).toBe('Sync failed');
      expect(result.current.isSyncing).toBe(false);
    });

    it('should update pending sync count', async () => {
      (syncService.getPendingSyncCount as jest.Mock).mockResolvedValue(5);

      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(result.current.pendingSyncCount).toBe(5);
      });
    });

    it('should handle sync listener events', async () => {
      let syncListener: any;
      (syncService.addSyncListener as jest.Mock).mockImplementation((listener) => {
        syncListener = listener;
        return jest.fn();
      });

      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Simulate successful sync
      act(() => {
        syncListener({
          success: true,
          synced: 10,
          failed: 0,
          errors: [],
        });
      });

      await waitFor(() => {
        expect(result.current.syncError).toBeNull();
      });

      // Simulate failed sync
      act(() => {
        syncListener({
          success: false,
          synced: 5,
          failed: 2,
          errors: [{ id: '1', error: 'Network error' }],
        });
      });

      await waitFor(() => {
        expect(result.current.syncError).toBe('Network error');
      });
    });
  });

  describe('Connection Check', () => {
    it('should check connection status', async () => {
      (networkStatusService.checkConnection as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let isOnline: boolean = false;
      await act(async () => {
        isOnline = await result.current.checkConnection();
      });

      expect(isOnline).toBe(true);
      expect(networkStatusService.checkConnection).toHaveBeenCalled();
    });

    it('should update offline status after connection check', async () => {
      (networkStatusService.checkConnection as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.checkConnection();
      });

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const unsubscribeNetwork = jest.fn();
      const unsubscribeSync = jest.fn();

      (networkStatusService.addListener as jest.Mock).mockReturnValue(unsubscribeNetwork);
      (syncService.addSyncListener as jest.Mock).mockReturnValue(unsubscribeSync);

      const { unmount } = renderHook(() => useOffline(), { wrapper });

      await waitFor(() => {
        expect(networkStatusService.addListener).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeNetwork).toHaveBeenCalled();
      expect(unsubscribeSync).toHaveBeenCalled();
      expect(networkStatusService.cleanup).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle initialization errors gracefully', async () => {
      (offlineStorage.getOfflineMode as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const { result } = renderHook(() => useOffline(), { wrapper });

      // Should not crash, but isInitialized might be false
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });
    });

    it('should handle pending count update errors', async () => {
      (syncService.getPendingSyncCount as jest.Mock).mockRejectedValue(
        new Error('Count error')
      );

      const { result } = renderHook(() => useOffline(), { wrapper });

      // Should not crash
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });
    });
  });
});
