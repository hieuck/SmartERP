/**
 * Customer List Page - Offline-First
 * Displays list of customers with offline-first support
 * Features: auto-sync, manual sync, network status, sync queue
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, message, Badge } from 'antd';
import {
  UserOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Customer, SyncStatus } from '@/lib/offline/db';
import { formatCurrency } from '@/utils/responsive';
import StandardListPage from '@/components/common/StandardListPage';
import type { ColumnsType } from 'antd/es/table';

export default function CustomerList() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['customers', 'commonUi']);
  const { isMobile } = useResponsive();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('CustomerList', 'Network connection restored');
      message.success(t('commonUi:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('CustomerList', 'Network connection lost');
      message.warning(t('commonUi:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load customers from offline storage
  const loadCustomers = async () => {
    setLoading(true);
    try {
      logger.debug('CustomerList', 'Loading customers from offline storage');
      const allCustomers = await offlineServices.customers.getAll();
      
      // Filter by search term
      let filtered = allCustomers;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = allCustomers.filter(
          (c) =>
            c.name.toLowerCase().includes(searchLower) ||
            c.email?.toLowerCase().includes(searchLower) ||
            c.phone?.toLowerCase().includes(searchLower) ||
            c.address?.toLowerCase().includes(searchLower)
        );
      }

      setCustomers(filtered);
      logger.info('CustomerList', `Loaded ${filtered.length} customers`);
    } catch (error) {
      logger.error('CustomerList', 'Failed to load customers', error as Error);
      message.error(t('customers:messages.loadError'));
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
      logger.error('CustomerList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadCustomers();
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

  // Reload customers when search changes
  useEffect(() => {
    loadCustomers();
  }, [search]);

  // Handle sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error(t('commonUi:messages.loginRequired'));
      return;
    }

    if (!isOnline) {
      message.warning(t('commonUi:messages.offlineMode'));
      return;
    }

    setSyncing(true);
    try {
      logger.info('CustomerList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('commonUi:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadCustomers();
        await updateQueueSize();
      } else {
        message.error(t('commonUi:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('CustomerList', 'Sync failed', error as Error);
      message.error(t('commonUi:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (customer: Customer) => {
    try {
      logger.info('CustomerList', `Deleting customer: ${customer.id}`);
      await offlineServices.customers.delete(customer.id);
      message.success(t('customers:messages.deleteSuccess'));
      await loadCustomers();
      await updateQueueSize();
    } catch (error) {
      logger.error('CustomerList', 'Failed to delete customer', error as Error);
      message.error(t('customers:messages.deleteError'));
    }
  };

  // Get paginated data
  const paginatedCustomers = customers.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Customer> = [
    {
      title: t('customers:columns.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('customers:columns.email'),
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: t('customers:columns.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: t('customers:columns.address'),
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: t('customers:columns.creditLimit'),
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      width: 120,
      align: 'right',
      render: (value: number) => (value ? formatCurrency(value, i18n.language) : '-'),
    },
    {
      title: t('customers:columns.balance'),
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <Tag color={value > 0 ? 'red' : 'green'}>
          {value ? formatCurrency(value, i18n.language) : '-'}
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
  ];

  return (
    <StandardListPage
      title={
        <Space>
          <UserOutlined />
          {t('customers:title')}
        </Space>
      }
      createButtonText={t('customers:createButton')}
      onCreateClick={() => navigate('/dashboard/customers/new')}
      extraActions={
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
          <Badge
            status={isOnline ? 'success' : 'error'}
            text={
              <Space size="small">
                {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                {isOnline ? 'Online' : 'Offline'}
              </Space>
            }
          />
          
          {queueSize > 0 && (
            <Badge count={queueSize} showZero={false}>
              <Tag color="warning">Pending Sync</Tag>
            </Badge>
          )}

          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </Space>
      }
      searchPlaceholder={t('customers:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={paginatedCustomers}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1100 }}
      pagination={{
        current: page,
        pageSize,
        total: customers.length,
        showSizeChanger: true,
        showTotal: (total) => t('customers:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
      onEdit={(record) => navigate(`/dashboard/customers/${record.id}`)}
      onDelete={handleDelete}
      deleteConfirmTitle={t('commonUi:messages.deleteConfirm')}
      onMobileItemClick={(record) => navigate(`/dashboard/customers/${record.id}`)}
    />
  );
}
