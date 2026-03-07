import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { networkStatusService } from '../services/network/networkStatus';
import { syncService, SyncResult } from '../services/sync/syncService';
import { offlineStorage } from '../services/storage/offlineStorage';
import {
  setOfflineStatus,
  setSyncStatus,
  setLastSync,
  setPendingSyncCount,
  setSyncError,
} from '../store/slices/offlineSlice';

export const useOffline = () => {
  const dispatch = useDispatch();
  const offlineState = useSelector((state: RootState) => state.offline);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize network monitoring
    networkStatusService.initialize();

    // Load initial offline state
    loadInitialState();

    // Listen to network status changes
    const unsubscribeNetwork = networkStatusService.addListener((isOnline) => {
      dispatch(setOfflineStatus(!isOnline));
    });

    // Listen to sync events
    const unsubscribeSync = syncService.addSyncListener((result: SyncResult) => {
      dispatch(setSyncStatus(false));

      if (result.success) {
        dispatch(setLastSync(Date.now()));
        dispatch(setSyncError(null));
      } else if (result.errors.length > 0) {
        dispatch(setSyncError(result.errors[0].error));
      }

      updatePendingCount();
    });

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
      clearInterval(interval);
      networkStatusService.cleanup();
    };
  }, [dispatch]);

  const loadInitialState = async () => {
    try {
      const isOffline = await offlineStorage.getOfflineMode();
      const lastSync = await offlineStorage.getLastSync();

      dispatch(setOfflineStatus(isOffline));
      if (lastSync) {
        dispatch(setLastSync(lastSync));
      }

      await updatePendingCount();
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading initial offline state:', error);
    }
  };

  const updatePendingCount = async () => {
    try {
      const count = await syncService.getPendingSyncCount();
      dispatch(setPendingSyncCount(count));
    } catch (error) {
      console.error('Error updating pending count:', error);
    }
  };

  const triggerSync = async () => {
    if (offlineState.isSyncing) {
      return;
    }

    dispatch(setSyncStatus(true));
    dispatch(setSyncError(null));

    try {
      await syncService.syncAll();
    } catch (error: any) {
      dispatch(setSyncError(error.message || 'Sync failed'));
    } finally {
      dispatch(setSyncStatus(false));
    }
  };

  const checkConnection = async () => {
    const isOnline = await networkStatusService.checkConnection();
    dispatch(setOfflineStatus(!isOnline));
    return isOnline;
  };

  return {
    isOffline: offlineState.isOffline,
    isSyncing: offlineState.isSyncing,
    lastSync: offlineState.lastSync,
    pendingSyncCount: offlineState.pendingSyncCount,
    syncError: offlineState.syncError,
    isInitialized,
    triggerSync,
    checkConnection,
  };
};
