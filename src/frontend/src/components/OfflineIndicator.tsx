import { useOffline } from '../hooks/useOffline';
import { CloudOutlined, CloudSyncOutlined, SyncOutlined } from '@ant-design/icons';
import { Badge, Tooltip } from 'antd';

export function OfflineIndicator() {
  const { isOnline, isSyncing, lastSyncTime, queueSize } = useOffline();

  const getStatus = () => {
    if (!isOnline) {
      return {
        icon: <CloudOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />,
        text: 'Offline',
        color: 'red',
      };
    }
    
    if (isSyncing) {
      return {
        icon: <SyncOutlined spin style={{ fontSize: 20, color: '#1890ff' }} />,
        text: 'Syncing...',
        color: 'blue',
      };
    }
    
    if (queueSize > 0) {
      return {
        icon: <CloudSyncOutlined style={{ fontSize: 20, color: '#faad14' }} />,
        text: `${queueSize} pending`,
        color: 'orange',
      };
    }
    
    return {
      icon: <CloudOutlined style={{ fontSize: 20, color: '#52c41a' }} />,
      text: 'Online',
      color: 'green',
    };
  };

  const status = getStatus();
  const lastSync = lastSyncTime
    ? `Last sync: ${lastSyncTime.toLocaleTimeString()}`
    : 'Never synced';

  return (
    <Tooltip title={`${status.text} - ${lastSync}`}>
      <Badge count={queueSize} offset={[-5, 5]}>
        {status.icon}
      </Badge>
    </Tooltip>
  );
}
