/**
 * Supplier List Page - Offline-First
 * Displays list of suppliers with offline-first support
 * Features: auto-sync, manual sync, network status, sync queue
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, message, Badge, Rate } from 'antd';
import {
  ShopOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Supplier, SyncStatus } from '@/lib/offline/db';
import StandardListPage from '@/components/common/StandardListPage';
import type { ColumnsType } from 'antd/es/table';

export default function SupplierList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['suppliers', 'commonUi']);
  const { isMobile } = useResponsive();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('SupplierList', 'Network connection restored');
      message.success(t('commonUi:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('SupplierList', 'Network connection lost');
      message.warning(t('commonUi:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load suppliers from offline storage
  const loadSuppliers = async () => {
    setLoading(true);
    try {
      logger.debug('SupplierList', 'Loading suppliers from offline storage');
      const allSuppliers = await offlineServices.suppliers.getAll();
      
      // Filter by search term
      let filtered = allSuppliers;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = allSuppliers.filter(
          (s) =>
            s.name.toLowerCase().includes(searchLower) ||
            s.email?.toLowerCase().includes(searchLower) ||
            s.phone?.toLowerCase().includes(searchLower) ||
            s.address?.toLowerCase().includes(searchLower)
        );
      }

      setSuppliers(filtered);
      logger.info('SupplierList', `Loaded ${filtered.length} suppliers`);
    } catch (error) {
      logger.error('SupplierList', 'Failed to load suppliers', error as Error);
      message.error(t('suppliers:messages.loadError'));
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
      logger.error('SupplierList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadSuppliers();
      await updateQueueSize();

      if (isOnline) {
        const token = localStorage.getItem('token');
        if (token && !syncManager.isSyncing()) {
          handleSync();
        }
      }
    };

    initializeData();
  }, []);

  // Reload suppliers when search changes
  useEffect(() => {
    loadSuppliers();
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
      logger.info('SupplierList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('commonUi:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadSuppliers();
        await updateQueueSize();
      } else {
        message.error(t('commonUi:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('SupplierList', 'Sync failed', error as Error);
      message.error(t('commonUi:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (supplier: Supplier) => {
    try {
      logger.info('SupplierList', `Deleting supplier: ${supplier.id}`);
      await offlineServices.suppliers.delete(supplier.id);
      message.success(t('suppliers:messages.deleteSuccess'));
      await loadSuppliers();
      await updateQueueSize();
    } catch (error) {
      logger.error('SupplierList', 'Failed to delete supplier', error as Error);
      message.error(t('suppliers:messages.deleteError'));
    }
  };

  // Get paginated data
  const paginatedSuppliers = suppliers.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Supplier> = [
    {
      title: t('suppliers:columns.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('suppliers:columns.email'),
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: t('suppliers:columns.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: t('suppliers:columns.rating'),
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (rating: number) => <Rate disabled value={rating || 0} />,
    },
    {
      title: t('suppliers:columns.paymentTerms'),
      dataIndex: 'paymentTerms',
      key: 'paymentTerms',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('suppliers:columns.leadTime'),
      dataIndex: 'leadTime',
      key: 'leadTime',
      width: 120,
      render: (days: number) => (days ? t('suppliers:columns.leadTimeDays', { days }) : '-'),
    },
    {
      title: t('suppliers:sync.status'),
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
          [SyncStatus.SYNCED]: t('suppliers:sync.synced'),
          [SyncStatus.PENDING]: t('suppliers:sync.pending'),
          [SyncStatus.CONFLICT]: t('suppliers:sync.conflict'),
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || t('suppliers:sync.unknown')}
          </Tag>
        );
      },
    },
  ];

  return (
    <StandardListPage
      title={
        <Space>
          <ShopOutlined />
          {t('suppliers:title')}
        </Space>
      }
      createButtonText={t('suppliers:createButton')}
      onCreateClick={() => navigate('/dashboard/suppliers/new')}
      extraActions={
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
          <Badge
            status={isOnline ? 'success' : 'error'}
            text={
              <Space size="small">
                {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                {isOnline ? t('suppliers:sync.online') : t('suppliers:sync.offline')}
              </Space>
            }
          />
          
          {queueSize > 0 && (
            <Badge count={queueSize} showZero={false}>
              <Tag color="warning">{t('suppliers:sync.pendingSync')}</Tag>
            </Badge>
          )}

          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {syncing ? t('suppliers:sync.syncing') : t('suppliers:sync.syncNow')}
          </Button>
        </Space>
      }
      searchPlaceholder={t('suppliers:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={paginatedSuppliers}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1200 }}
      pagination={{
        current: page,
        pageSize,
        total: suppliers.length,
        showSizeChanger: true,
        showTotal: (total) => t('suppliers:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
      onEdit={(record) => navigate(`/dashboard/suppliers/${record.id}`)}
      onDelete={handleDelete}
      deleteConfirmTitle={t('commonUi:messages.deleteConfirm')}
      onMobileItemClick={(record) => navigate(`/dashboard/suppliers/${record.id}`)}
    />
  );
}
