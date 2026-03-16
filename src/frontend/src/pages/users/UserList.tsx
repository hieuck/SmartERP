/**
 * User List Page - Offline-First
 * Displays list of users with search and CRUD operations
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, message, Modal, Dropdown, Button, Space, Badge } from 'antd';
import type { MenuProps } from 'antd/es/menu';
import {
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  LockOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { User, SyncStatus } from '@/lib/offline/db';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const roleColors: Record<string, string> = {
  ADMIN: 'red',
  admin: 'red',
  MANAGER: 'orange',
  manager: 'orange',
  USER: 'blue',
  user: 'blue',
  staff: 'blue',
  VIEWER: 'default',
  viewer: 'default',
};

export default function UserList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['users', 'commonUi', 'common']);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('UserList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('UserList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load users from offline storage
  const loadUsers = async () => {
    setLoading(true);
    try {
      logger.debug('UserList', 'Loading users from offline storage');
      const allUsers = await offlineServices.users.getAll();
      
      // Filter by search term
      let filtered = allUsers;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = allUsers.filter(
          (u) =>
            u.email.toLowerCase().includes(searchLower) ||
            u.firstName?.toLowerCase().includes(searchLower) ||
            u.lastName?.toLowerCase().includes(searchLower)
        );
      }

      setUsers(filtered);
      logger.info('UserList', `Loaded ${filtered.length} users`);
    } catch (error) {
      logger.error('UserList', 'Failed to load users', error as Error);
      message.error(t('users:messages.loadError'));
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
      logger.error('UserList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadUsers();
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

  // Reload users when search changes
  useEffect(() => {
    loadUsers();
  }, [search]);

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
      logger.info('UserList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadUsers();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('UserList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (user: User) => {
    try {
      logger.info('UserList', `Deleting user: ${user.id}`);
      await offlineServices.users.delete(user.id);
      message.success(t('users:messages.deleteSuccess'));
      await loadUsers();
      await updateQueueSize();
    } catch (error) {
      logger.error('UserList', 'Failed to delete user', error as Error);
      message.error(t('users:messages.deleteError'));
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (user: User) => {
    try {
      logger.info('UserList', `Toggling active status for user: ${user.id}`);
      await offlineServices.users.update(user.id, { status: user.status === 'active' ? 'inactive' : 'active' });
      message.success(t('users:messages.updateStatusSuccess'));
      await loadUsers();
      await updateQueueSize();
    } catch (error) {
      logger.error('UserList', 'Failed to toggle user status', error as Error);
      message.error(t('users:messages.updateStatusError'));
    }
  };

  const handleResetPassword = (_id: string) => {
    Modal.confirm({
      title: t('users:messages.resetPasswordConfirm'),
      content: t('users:messages.resetPasswordDescription'),
      onOk: async () => {
        try {
          // Backend API not yet implemented
          message.info(t('users:messages.featureNotAvailable'));
        } catch (error) {
          message.error(t('users:messages.resetPasswordError'));
        }
      },
    });
  };

  const getActionMenu = (record: User): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('users:actions.viewDetail'),
      onClick: () => navigate(`/dashboard/users/${record.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('users:actions.edit'),
      onClick: () => navigate(`/dashboard/users/${record.id}/edit`),
    },
    {
      key: 'reset-password',
      icon: <LockOutlined />,
      label: t('users:actions.resetPassword'),
      onClick: () => handleResetPassword(record.id),
    },
    {
      key: 'toggle-active',
      label: record.status === 'active' ? t('users:actions.deactivate') : t('users:actions.activate'),
      onClick: () => handleToggleActive(record),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('users:actions.delete'),
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: t('users:messages.deleteConfirm'),
          content: t('users:messages.deleteDescription'),
          onOk: () => handleDelete(record),
        });
      },
    },
  ];

  // Get paginated data
  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<User> = [
    {
      title: t('users:columns.email'),
      dataIndex: 'email',
      key: 'email',
      width: 250,
      render: (text: string, record: User) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/users/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: t('users:columns.fullName'),
      key: 'fullName',
      width: 200,
      render: (_: any, record: User) => `${record.firstName || ''} ${record.lastName || ''}`.trim() || '-',
    },
    {
      title: t('users:columns.role'),
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: string) => {
        const roleKey = role.toLowerCase();
        return (
          <Tag color={roleColors[role] || roleColors[roleKey]}>
            {t(`users:roles.${roleKey}`, { defaultValue: role })}
          </Tag>
        );
      },
    },
    {
      title: t('users:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {t(`users:status.${status}`)}
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
          [SyncStatus.SYNCED]: t('users:sync.synced'),
          [SyncStatus.PENDING]: t('users:sync.pending'),
          [SyncStatus.CONFLICT]: t('users:sync.conflict'),
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || t('users:sync.unknown')}
          </Tag>
        );
      },
    },
    {
      title: t('users:columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('commonUi:table.actions'),
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: User) => (
        <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <StandardListPage
      title={
        <>
          <UserOutlined /> {t('users:title')}
        </>
      }
      createButtonText={t('users:createButton')}
      onCreateClick={() => navigate('/dashboard/users/new')}
      searchPlaceholder={t('users:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      extraActions={
        <Space>
          {/* Network Status Badge */}
          <Badge
            status={isOnline ? 'success' : 'error'}
            text={
              <Space size="small">
                {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                {isOnline ? t('users:sync.online') : t('users:sync.offline')}
              </Space>
            }
          />
          
          {/* Sync Queue Indicator */}
          {queueSize > 0 && (
            <Badge count={queueSize} showZero={false}>
              <Tag color="warning">{t('users:sync.pendingSync')}</Tag>
            </Badge>
          )}

          {/* Sync Button */}
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
          >
            {syncing ? t('users:sync.syncing') : t('users:sync.syncNow')}
          </Button>
        </Space>
      }
      columns={columns}
      dataSource={paginatedUsers}
      loading={loading}
      rowKey="id"
      pagination={{
        current: page,
        pageSize,
        total: users.length,
        showTotal: (total) => t('users:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
