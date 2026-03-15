import React, { useState, useEffect } from 'react';
import { Badge, Button, Space, Typography, Tooltip } from 'antd';
import { SyncOutlined, CloudOutlined, DisconnectOutlined } from '@ant-design/icons';
import { syncManager } from '../lib/offline';

const { Text } = Typography;

export const OfflineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Requirement 1.3: IF network connection is restored, auto detect
    const handleOnline = async () => {
      setIsOnline(true);
      setError(null);
      
      // Requirement 2.1: WHEN network detected, auto start sync
      const token = localStorage.getItem('token');
      if (token) {
        await syncManager.resumeSync(token);
      }
    };

    // Requirement 1.4: IF network lost during sync, pause
    const handleOffline = () => {
      setIsOnline(false);
      if (syncManager.isSyncing()) {
        syncManager.pauseSync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Requirement 1.5: Check if offline storage available
    const checkIndexedDB = () => {
      try {
        if (!('indexedDB' in window) || window.indexedDB === null) {
          setError('Offline storage unavailable. Please use a modern browser.');
        }
      } catch (e) {
        setError('Offline storage unavailable. Please use a modern browser.');
      }
    };
    checkIndexedDB();

    // Update queue size periodically
    const interval = setInterval(async () => {
      const size = await syncManager.getQueueSize();
      setQueueSize(size);
      setLastSync(syncManager.getLastSyncTime());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No auth token found');
      return;
    }

    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncManager.sync(token);
      if (!result.success) {
        setError(result.errors.join(', '));
      }
      setLastSync(new Date());
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Space size="middle" style={{ padding: '8px 16px' }}>
      <Badge status={isOnline ? 'success' : 'error'} />
      <Text type={isOnline ? 'success' : 'danger'}>
        {isOnline ? (
          <>
            <CloudOutlined /> Online
          </>
        ) : (
          <>
            <DisconnectOutlined /> Offline
          </>
        )}
      </Text>

      {error && (
        <Tooltip title={error}>
          <Text type="danger" style={{ fontSize: '12px' }}>
            Error
          </Text>
        </Tooltip>
      )}

      {queueSize > 0 && (
        <Tooltip title={`${queueSize} pending changes`}>
          <Badge count={queueSize} showZero={false}>
            <Text type="warning">Pending</Text>
          </Badge>
        </Tooltip>
      )}

      {lastSync && (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Last sync: {lastSync.toLocaleTimeString()}
        </Text>
      )}

      <Button
        type="primary"
        size="small"
        icon={<SyncOutlined spin={isSyncing} />}
        onClick={handleSync}
        disabled={!isOnline || isSyncing || !!error}
        loading={isSyncing}
      >
        Sync
      </Button>
    </Space>
  );
};
