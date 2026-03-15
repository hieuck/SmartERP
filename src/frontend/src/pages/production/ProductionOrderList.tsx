/**
 * Production Order List Page - Offline-First
 * Displays and manages production orders
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, message, Select, Progress, Badge } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { formatDate } from '@/utils/responsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { ProductionOrder, SyncStatus } from '@/lib/offline/db';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

export default function ProductionOrderList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
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
      logger.info('ProductionOrderList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('ProductionOrderList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load production orders from offline storage
  const loadOrders = async () => {
    setLoading(true);
    try {
      logger.debug('ProductionOrderList', 'Loading production orders from offline storage');
      let allOrders = await offlineServices.productionOrders.getAll();
      
      // Apply filters
      let filtered = allOrders;
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(searchLower) ||
            o.name.toLowerCase().includes(searchLower) ||
            o.productName?.toLowerCase().includes(searchLower)
        );
      }
      
      // Status filter
      if (status) {
        filtered = filtered.filter(o => o.status === status);
      }

      setOrders(filtered);
      logger.info('ProductionOrderList', `Loaded ${filtered.length} production orders`);
    } catch (error) {
      logger.error('ProductionOrderList', 'Failed to load production orders', error as Error);
      message.error(t('production:messages.loadError'));
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
      logger.error('ProductionOrderList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadOrders();
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
    loadOrders();
  }, [search, status]);

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
      logger.info('ProductionOrderList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadOrders();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('ProductionOrderList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle start order
  const handleStartOrder = async (order: ProductionOrder) => {
    try {
      logger.info('ProductionOrderList', `Starting order: ${order.id}`);
      const updated = {
        ...order,
        status: 'in_progress',
        actualStartDate: new Date(),
      };
      await offlineServices.productionOrders.update(order.id, updated);
      message.success(t('production:messages.saveSuccess'));
      await loadOrders();
      await updateQueueSize();
    } catch (error) {
      logger.error('ProductionOrderList', 'Failed to start order', error as Error);
      message.error(t('production:messages.saveError'));
    }
  };

  // Handle complete order
  const handleCompleteOrder = async (order: ProductionOrder) => {
    try {
      logger.info('ProductionOrderList', `Completing order: ${order.id}`);
      const updated = {
        ...order,
        status: 'completed',
        actualEndDate: new Date(),
        completionPercentage: 100,
      };
      await offlineServices.productionOrders.update(order.id, updated);
      message.success(t('production:messages.saveSuccess'));
      await loadOrders();
      await updateQueueSize();
    } catch (error) {
      logger.error('ProductionOrderList', 'Failed to complete order', error as Error);
      message.error(t('production:messages.saveError'));
    }
  };

  // Handle cancel order
  const handleCancelOrder = async (order: ProductionOrder) => {
    try {
      logger.info('ProductionOrderList', `Cancelling order: ${order.id}`);
      const updated = {
        ...order,
        status: 'cancelled',
      };
      await offlineServices.productionOrders.update(order.id, updated);
      message.success(t('production:messages.deleteSuccess'));
      await loadOrders();
      await updateQueueSize();
    } catch (error) {
      logger.error('ProductionOrderList', 'Failed to cancel order', error as Error);
      message.error(t('production:messages.deleteError'));
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'default',
    in_progress: 'blue',
    paused: 'orange',
    completed: 'green',
    cancelled: 'red',
  };

  // Get paginated data
  const paginatedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<ProductionOrder> = [
    {
      title: t('production:orders.code'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
    },
    {
      title: t('production:orders.product'),
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: t('production:orders.quantity'),
      key: 'quantity',
      width: 150,
      render: (_: any, record: ProductionOrder) => (
        <div>
          <div>
            {record.qtyProduced || 0} / {record.quantityPlanned}
          </div>
          <Progress
            percent={Math.round(((record.qtyProduced || 0) / record.quantityPlanned) * 100)}
            size="small"
            status={record.status === 'completed' ? 'success' : 'active'}
          />
        </div>
      ),
    },
    {
      title: t('production:orders.defectsWaste'),
      key: 'defects',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: ProductionOrder) => (
        <span style={{ color: (record.quantityRejected || 0) > 0 ? '#ff4d4f' : undefined }}>
          {record.quantityRejected || 0}
        </span>
      ),
    },
    {
      title: t('production:orders.startDate'),
      dataIndex: 'plannedStartDate',
      key: 'plannedStartDate',
      width: 120,
      render: (date: Date) => date ? formatDate(date.toString()) : '-',
    },
    {
      title: t('production:orders.expectedEndDate'),
      dataIndex: 'plannedEndDate',
      key: 'plannedEndDate',
      width: 120,
      render: (date: Date) => date ? formatDate(date.toString()) : '-',
    },
    {
      title: t('production:orders.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (orderStatus: string) => (
        <Tag color={statusColors[orderStatus] || 'default'}>
          {orderStatus?.toUpperCase() || 'DRAFT'}
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

  const filterComponents = (
    <Select
      placeholder={t('production:filters.status')}
      style={{ width: 150 }}
      allowClear
      value={status}
      onChange={setStatus}
    >
      <Option value="draft">DRAFT</Option>
      <Option value="in_progress">IN PROGRESS</Option>
      <Option value="paused">PAUSED</Option>
      <Option value="completed">COMPLETED</Option>
      <Option value="cancelled">CANCELLED</Option>
    </Select>
  );

  const draftOrders = orders.filter(o => o.status === 'draft');
  const inProgressOrders = orders.filter(o => o.status === 'in_progress');

  return (
    <StandardListPage
      title={t('production:orders.list')}
      createButtonText={t('production:orders.createOrder')}
      onCreateClick={() => navigate('/production/orders/new')}
      searchPlaceholder={t('production:orders.searchPlaceholder')}
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
      dataSource={paginatedOrders}
      loading={loading}
      onEdit={(record) => navigate(`/production/orders/${record.id}`)}
      pagination={{
        current: page,
        pageSize,
        total: orders.length,
        showTotal: (total) => `Total ${total} orders`,
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
      customContent={
        <Space style={{ marginBottom: 16 }} wrap>
          {draftOrders.map((order: ProductionOrder) => (
            <Button
              key={order.id}
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartOrder(order)}
            >
              {t('production:orders.start')} - {order.orderNumber}
            </Button>
          ))}
          {inProgressOrders.map((order: ProductionOrder) => (
            <Button
              key={order.id}
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                if (window.confirm(t('production:orders.confirmComplete'))) {
                  handleCompleteOrder(order);
                }
              }}
            >
              {t('production:orders.complete')} - {order.orderNumber}
            </Button>
          ))}
        </Space>
      }
    />
  );
}
