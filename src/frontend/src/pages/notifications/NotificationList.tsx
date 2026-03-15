/**
 * Notification List Page - Offline-First
 * Displays and manages user notifications
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, message, Select, Badge } from 'antd';
import {
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
  BellOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { formatDate } from '@/utils/responsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Notification, SyncStatus } from '@/lib/offline/db';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

export default function NotificationList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['notifications', 'common']);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const [typeFilter, setTypeFilter] = useState<string>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('NotificationList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('NotificationList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load notifications from offline storage
  const loadNotifications = async () => {
    setLoading(true);
    try {
      logger.debug('NotificationList', 'Loading notifications from offline storage');
      const allNotifications = await offlineServices.notifications.getAll();
      
      // Apply filters
      let filtered = allNotifications;
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (n) =>
            n.title.toLowerCase().includes(searchLower) ||
            n.message.toLowerCase().includes(searchLower)
        );
      }
      
      // Status filter
      if (statusFilter) {
        filtered = filtered.filter(n => n.status === statusFilter);
      }

      // Type filter
      if (typeFilter) {
        filtered = filtered.filter(n => n.type === typeFilter);
      }

      // Sort by createdAt desc (newest first)
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(filtered);
      logger.info('NotificationList', `Loaded ${filtered.length} notifications`);
    } catch (error) {
      logger.error('NotificationList', 'Failed to load notifications', error as Error);
      message.error(t('notifications:messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Update queue size
  const updateQueueSize = async () => {
    try {
      const size = await syncManager.getQueueSize();
      setQueueSize(size);
    } catch (error) {
      logger.error('NotificationList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadNotifications();
      await updateQueueSize();

      // Auto-sync if online and has token
      if (isOnline) {
        const token = localStorage.getItem('token');
        if (token && !syncManager.isSyncing()) {
          handleSync();
        }
      }
    };

    initializeData();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadNotifications();
  }, [search, statusFilter, typeFilter]);

  // Handle sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error(t('common:messages.loginRequired'));
      return;
    }

    if (!isOnline) {
      message.warning(t('common:messages.offlineMode'));
      return;
    }

    setSyncing(true);
    try {
      logger.info('NotificationList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadNotifications();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('NotificationList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (notification: Notification) => {
    try {
      logger.info('NotificationList', `Marking notification as read: ${notification.id}`);
      const updated = {
        ...notification,
        status: 'read',
        readAt: new Date(),
      };
      await offlineServices.notifications.update(notification.id, updated);
      message.success(t('notifications:messages.markedAsRead'));
      await loadNotifications();
      await updateQueueSize();
    } catch (error) {
      logger.error('NotificationList', 'Failed to mark as read', error as Error);
      message.error(t('notifications:messages.markReadError'));
    }
  };

  // Handle delete
  const handleDelete = async (notification: Notification) => {
    try {
      logger.info('NotificationList', `Deleting notification: ${notification.id}`);
      await offlineServices.notifications.delete(notification.id);
      message.success(t('notifications:messages.deleteSuccess'));
      await loadNotifications();
      await updateQueueSize();
    } catch (error) {
      logger.error('NotificationList', 'Failed to delete notification', error as Error);
      message.error(t('notifications:messages.deleteError'));
    }
  };

  const typeIcons: Record<string, React.ReactNode> = {
    info: <InfoCircleOutlined />,
    warning: <WarningOutlined />,
    success: <CheckCircleOutlined />,
    error: <CloseCircleOutlined />,
  };

  const typeColors: Record<string, string> = {
    info: 'blue',
    warning: 'orange',
    success: 'green',
    error: 'red',
  };

  const statusColors: Record<string, string> = {
    unread: 'warning',
    read: 'default',
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  // Get paginated data
  const paginatedNotifications = notifications.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Notification> = [
    {
      title: t('notifications:notification.type'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={typeColors[type] || 'default'} icon={typeIcons[type]}>
          {type?.toUpperCase() || 'INFO'}
        </Tag>
      ),
    },
    {
      title: t('notifications:notification.title'),
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Notification) => (
        <Space>
          {record.status === 'unread' && <Badge status="processing" />}
          <span style={{ fontWeight: record.status === 'unread' ? 'bold' : 'normal' }}>
            {title}
          </span>
        </Space>
      ),
    },
    {
      title: t('notifications:notification.message'),
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: t('notifications:notification.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: Date) => formatDate(date.toString()),
    },
    {
      title: t('notifications:notification.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {status?.toUpperCase() || 'UNREAD'}
        </Tag>
      ),
    },
    {
      title: 'Sync',
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      width: 100,
      render: (syncStatus: SyncStatus) => {
        const colors = {
          [SyncStatus.SYNCED]: 'success',
          [SyncStatus.PENDING]: 'warning',
          [SyncStatus.CONFLICT]: 'error',
        };
        const labels = {
          [SyncStatus.SYNCED]: 'Synced',
          [SyncStatus.PENDING]: 'Pending',
          [SyncStatus.CONFLICT]: 'Conflict',
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || 'Unknown'}
          </Tag>
        );
      },
    },
    {
      title: t('notifications:notification.actions'),
      key: 'actions',
      width: 150,
      render: (_: any, record: Notification) => (
        <Space>
          {record.status === 'unread' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleMarkAsRead(record)}
            >
              Mark Read
            </Button>
          )}
          {record.link && (
            <Button
              type="link"
              size="small"
              onClick={() => navigate(record.link!)}
            >
              View
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filterComponents = (
    <Space>
      <Select
        placeholder={t('notifications:filters.status')}
        style={{ width: 150 }}
        allowClear
        value={statusFilter}
        onChange={setStatusFilter}
      >
        <Option value="unread">UNREAD</Option>
        <Option value="read">READ</Option>
      </Select>
      <Select
        placeholder={t('notifications:filters.type')}
        style={{ width: 150 }}
        allowClear
        value={typeFilter}
        onChange={setTypeFilter}
      >
        <Option value="info">INFO</Option>
        <Option value="warning">WARNING</Option>
        <Option value="success">SUCCESS</Option>
        <Option value="error">ERROR</Option>
      </Select>
    </Space>
  );

  return (
    <StandardListPage
      title={
        <Space>
          <BellOutlined />
          <span>{t('notifications:notification.list')}</span>
          {unreadCount > 0 && (
            <Badge count={unreadCount} showZero={false}>
              <Tag color="warning">Unread</Tag>
            </Badge>
          )}
        </Space>
      }
      createButtonText={t('notifications:notification.create')}
      onCreateClick={() => navigate('/notifications/new')}
      searchPlaceholder={t('notifications:notification.searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={filterComponents}
      extraActions={
        <Space>
          {/* Network Status Badge */}
          <Badge
            status={isOnline ? 'success' : 'error'}
            text={
              <Space size="small">
                {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                {isOnline ? 'Online' : 'Offline'}
              </Space>
            }
          />
          
          {/* Sync Queue Indicator */}
          {queueSize > 0 && (
            <Badge count={queueSize} showZero={false}>
              <Tag color="warning">Pending Sync</Tag>
            </Badge>
          )}

          {/* Sync Button */}
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </Space>
      }
      columns={columns}
      dataSource={paginatedNotifications}
      loading={loading}
      onEdit={(record) => navigate(`/notifications/${record.id}`)}
      onDelete={handleDelete}
      deleteConfirmTitle={t('notifications:messages.deleteConfirm')}
      pagination={{
        current: page,
        pageSize,
        total: notifications.length,
        showTotal: (total) => `Total ${total} notifications`,
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
