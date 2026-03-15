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

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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
      console.error('No auth token found');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncManager.sync(token);
      console.log('Sync result:', result);
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
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
        disabled={!isOnline || isSyncing}
        loading={isSyncing}
      >
        Sync
      </Button>
    </Space>
  );
};
