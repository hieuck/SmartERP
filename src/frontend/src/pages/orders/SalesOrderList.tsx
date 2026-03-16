/**
 * Sales Order List Page - Offline-First
 * Displays list of sales orders with offline-first support
 * Features: auto-sync, manual sync, network status, sync queue, status filtering
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Space,
  Tag,
  message,
  Badge,
  Select,
} from 'antd';
import {
  ShoppingCartOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { SalesOrder, SyncStatus } from '@/lib/offline/db';
import { formatCurrency } from '@/utils/responsive';
import dayjs from 'dayjs';
import StandardListPage from '@/components/common/StandardListPage';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

// Order status enum (matching backend)
enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'default',
  [OrderStatus.PENDING]: 'blue',
  [OrderStatus.CONFIRMED]: 'cyan',
  [OrderStatus.PROCESSING]: 'orange',
  [OrderStatus.SHIPPED]: 'purple',
  [OrderStatus.DELIVERED]: 'green',
  [OrderStatus.CANCELLED]: 'red',
};

export default function SalesOrderList() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['orders', 'commonUi']);
  const { isMobile } = useResponsive();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Memoize formatCurrency function
  const memoizedFormatCurrency = useCallback(
    (value: number) => formatCurrency(value, i18n.language),
    [i18n.language]
  );

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('SalesOrderList', 'Network connection restored');
      message.success(t('commonUi:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('SalesOrderList', 'Network connection lost');
      message.warning(t('commonUi:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load orders from offline storage
  const loadOrders = async () => {
    setLoading(true);
    try {
      logger.debug('SalesOrderList', 'Loading sales orders from offline storage');
      const allOrders = await offlineServices.salesOrders.getAll();
      
      // Filter by search term and status
      let filtered = allOrders;
      
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.orderNumber?.toLowerCase().includes(searchLower) ||
            o.customerName?.toLowerCase().includes(searchLower)
        );
      }
      
      if (statusFilter) {
        filtered = filtered.filter((o) => o.status === statusFilter);
      }

      setOrders(filtered);
      logger.info('SalesOrderList', `Loaded ${filtered.length} sales orders`);
    } catch (error) {
      logger.error('SalesOrderList', 'Failed to load sales orders', error as Error);
      message.error(t('orders:messages.loadError'));
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
      logger.error('SalesOrderList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadOrders();
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

  // Reload orders when search or status filter changes
  useEffect(() => {
    loadOrders();
  }, [search, statusFilter]);

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
      logger.info('SalesOrderList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('commonUi:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadOrders();
        await updateQueueSize();
      } else {
        message.error(t('commonUi:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('SalesOrderList', 'Sync failed', error as Error);
      message.error(t('commonUi:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (order: SalesOrder) => {
    try {
      logger.info('SalesOrderList', `Deleting sales order: ${order.id}`);
      await offlineServices.salesOrders.delete(order.id);
      message.success(t('orders:messages.deleteSuccess'));
      await loadOrders();
      await updateQueueSize();
    } catch (error) {
      logger.error('SalesOrderList', 'Failed to delete sales order', error as Error);
      message.error(t('orders:messages.deleteError'));
    }
  };

  // Get paginated data
  const paginatedOrders = useMemo(
    () => orders.slice((page - 1) * pageSize, page * pageSize),
    [orders, page, pageSize]
  );

  const columns: ColumnsType<SalesOrder> = useMemo(() => [
    {
      title: t('orders:columns.orderNumber'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: SalesOrder) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/orders/sales/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: t('orders:columns.customer'),
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: t('orders:columns.orderDate'),
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: t('orders:columns.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (value: number) => (value ? memoizedFormatCurrency(value) : '-'),
    },
    {
      title: t('orders:columns.paidAmount'),
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'right',
      render: (value: number) => (value ? memoizedFormatCurrency(value) : '-'),
    },
    {
      title: t('orders:columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status as OrderStatus] || 'default'}>
          {t(`orders:status.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('orders:columns.sync'),
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      render: (syncStatus: SyncStatus) => {
        const colors = {
          [SyncStatus.SYNCED]: 'success',
          [SyncStatus.PENDING]: 'warning',
          [SyncStatus.CONFLICT]: 'error',
        };
        const labels = {
          [SyncStatus.SYNCED]: t('orders:sync.synced'),
          [SyncStatus.PENDING]: t('orders:sync.pending'),
          [SyncStatus.CONFLICT]: t('orders:sync.conflict'),
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || t('orders:sync.unknown')}
          </Tag>
        );
      },
    },
  ], [t, navigate, memoizedFormatCurrency]);

  const filterComponents = useMemo(
    () => (
      <Select
        placeholder={t('orders:filters.status')}
        style={{ width: isMobile ? '100%' : 150 }}
        value={statusFilter}
        onChange={setStatusFilter}
        allowClear
      >
        <Option value={OrderStatus.DRAFT}>{t('orders:status.draft')}</Option>
        <Option value={OrderStatus.PENDING}>{t('orders:status.pending')}</Option>
        <Option value={OrderStatus.CONFIRMED}>{t('orders:status.confirmed')}</Option>
        <Option value={OrderStatus.PROCESSING}>{t('orders:status.processing')}</Option>
        <Option value={OrderStatus.SHIPPED}>{t('orders:status.shipped')}</Option>
        <Option value={OrderStatus.DELIVERED}>{t('orders:status.delivered')}</Option>
        <Option value={OrderStatus.CANCELLED}>{t('orders:status.cancelled')}</Option>
      </Select>
    ),
    [t, isMobile, statusFilter]
  );

  return (
    <StandardListPage
      title={
        <Space>
          <ShoppingCartOutlined />
          {t('orders:title')}
        </Space>
      }
      createButtonText={t('orders:createButton')}
      onCreateClick={() => navigate('/dashboard/orders/sales/new')}
      extraActions={
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
          <Badge
            status={isOnline ? 'success' : 'error'}
            text={
              <Space size="small">
                {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                {isOnline ? t('orders:sync.online') : t('orders:sync.offline')}
              </Space>
            }
          />
          
          {queueSize > 0 && (
            <Badge count={queueSize} showZero={false}>
              <Tag color="warning">{t('orders:sync.pendingSync')}</Tag>
            </Badge>
          )}

          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {syncing ? t('orders:sync.syncing') : t('orders:sync.syncNow')}
          </Button>
        </Space>
      }
      searchPlaceholder={t('orders:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={filterComponents}
      columns={columns}
      dataSource={paginatedOrders}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1100 }}
      pagination={{
        current: page,
        pageSize,
        total: orders.length,
        showSizeChanger: true,
        showTotal: (total) => t('orders:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
      onEdit={(record) => {
        if (record.status !== OrderStatus.DELIVERED && record.status !== OrderStatus.CANCELLED) {
          navigate(`/dashboard/orders/sales/${record.id}/edit`);
        }
      }}
      onDelete={(record) => {
        if (record.status !== OrderStatus.DELIVERED && record.status !== OrderStatus.CANCELLED) {
          handleDelete(record);
        }
      }}
      deleteConfirmTitle={t('commonUi:messages.deleteConfirm')}
      onMobileItemClick={(record) => navigate(`/dashboard/orders/sales/${record.id}`)}
    />
  );
}
