/**
 * Warehouse List Page - Offline-First
 * Displays and manages warehouses
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, message, Space, Badge, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  HomeOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import StandardListPage from '@/components/common/StandardListPage';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Warehouse, SyncStatus } from '@/lib/offline/db';
import type { ColumnsType } from 'antd/es/table';

export default function WarehouseList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['warehouses', 'commonUi', 'common']);
  const [search, setSearch] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
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
      logger.info('WarehouseList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('WarehouseList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load warehouses from offline storage
  const loadWarehouses = async () => {
    setLoading(true);
    try {
      logger.debug('WarehouseList', 'Loading warehouses from offline storage');
      const allWarehouses = await offlineServices.warehouses.getAll();
      
      // Filter by search term
      let filtered = allWarehouses;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = allWarehouses.filter(
          (w) =>
            w.code.toLowerCase().includes(searchLower) ||
            w.name.toLowerCase().includes(searchLower) ||
            w.address?.toLowerCase().includes(searchLower)
        );
      }

      setWarehouses(filtered);
      logger.info('WarehouseList', `Loaded ${filtered.length} warehouses`);
    } catch (error) {
      logger.error('WarehouseList', 'Failed to load warehouses', error as Error);
      message.error(t('warehouses:messages.loadError'));
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
      logger.error('WarehouseList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadWarehouses();
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

  // Reload warehouses when search changes
  useEffect(() => {
    loadWarehouses();
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
      logger.info('WarehouseList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadWarehouses();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('WarehouseList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (warehouse: Warehouse) => {
    try {
      logger.info('WarehouseList', `Deleting warehouse: ${warehouse.id}`);
      await offlineServices.warehouses.delete(warehouse.id);
      message.success(t('warehouses:messages.deleteSuccess'));
      await loadWarehouses();
      await updateQueueSize();
    } catch (error) {
      logger.error('WarehouseList', 'Failed to delete warehouse', error as Error);
      message.error(t('warehouses:messages.deleteError'));
    }
  };

  // Get paginated data
  const paginatedWarehouses = warehouses.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Warehouse> = [
    {
      title: t('warehouses:columns.code'),
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: t('warehouses:columns.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('warehouses:columns.address'),
      dataIndex: 'address',
      key: 'address',
      width: 250,
      ellipsis: true,
      render: (_value: unknown, record: Warehouse) => (
        <span>
          {record.address}
          {record.ward && `, ${record.ward}`}
          {record.district && `, ${record.district}`}
          {record.city && `, ${record.city}`}
        </span>
      ),
    },
    {
      title: t('warehouses:columns.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string) => phone || '-',
    },
    {
      title: t('warehouses:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase() || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: t('warehouses:columns.isDefault'),
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: 100,
      render: (isDefault: boolean) =>
        isDefault ? <Tag color="blue">{t('warehouses:labels.default')}</Tag> : null,
    },
    {
      title: t('warehouses:sync.status'),
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
          [SyncStatus.SYNCED]: t('warehouses:sync.synced'),
          [SyncStatus.PENDING]: t('warehouses:sync.pending'),
          [SyncStatus.CONFLICT]: t('warehouses:sync.conflict'),
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || t('warehouses:sync.unknown')}
          </Tag>
        );
      },
    },
  ];

  return (
    <StandardListPage
      title={
        <>
          <HomeOutlined /> {t('warehouses:title')}
        </>
      }
      createButtonText={t('warehouses:createButton')}
      onCreateClick={() => navigate('/dashboard/warehouses/new')}
      searchPlaceholder={t('warehouses:searchPlaceholder')}
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
                {isOnline ? t('warehouses:sync.online') : t('warehouses:sync.offline')}
              </Space>
            }
          />
          
          {/* Sync Queue Indicator */}
          {queueSize > 0 && (
            <Badge count={queueSize} showZero={false}>
              <Tag color="warning">{t('warehouses:sync.pendingSync')}</Tag>
            </Badge>
          )}

          {/* Sync Button */}
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
          >
            {syncing ? t('warehouses:sync.syncing') : t('warehouses:sync.syncNow')}
          </Button>
        </Space>
      }
      columns={columns}
      dataSource={paginatedWarehouses}
      loading={loading}
      onEdit={(record) => navigate(`/dashboard/warehouses/${record.id}`)}
      onDelete={handleDelete}
      deleteConfirmTitle={t('commonUi:messages.deleteConfirm')}
      pagination={{
        current: page,
        pageSize,
        total: warehouses.length,
        showTotal: (total) => t('warehouses:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
