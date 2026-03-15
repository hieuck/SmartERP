import { useState, useEffect } from 'react';
import { syncManager } from '../lib/offline/sync-manager';

export interface OfflineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  queueSize: number;
}

export function useOffline() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    queueSize: 0,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    const updateQueueSize = async () => {
      const size = await syncManager.getQueueSize();
      setStatus(prev => ({ ...prev, queueSize: size }));
    };

    // Listen to online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update queue size periodically
    const interval = setInterval(updateQueueSize, 5000);
    updateQueueSize();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const sync = async (token: string) => {
    setStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const result = await syncManager.sync(token);
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: syncManager.getLastSyncTime(),
        queueSize: 0,
      }));
      return result;
    } catch (error) {
      setStatus(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  };

  return {
    ...status,
    sync,
  };
}
