/**
 * Sales Order List Page - Offline-First
 * Displays list of sales orders with offline-first support
 * Features: auto-sync, manual sync, network status, sync queue, status filtering
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Tag,
  message,
  Typography,
  Badge,
  Select,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd/es/menu';
import {
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { SalesOrder, SyncStatus } from '@/lib/offline/db';
import { formatCurrency } from '@/utils/responsive';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
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
  const { isMobile, isTablet } = useResponsive();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

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
  const paginatedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  const getActionMenu = (record: SalesOrder): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('orders:actions.viewDetail'),
      onClick: () => navigate(`/dashboard/orders/sales/${record.id}`),
    },
    ...(record.status !== OrderStatus.DELIVERED && record.status !== OrderStatus.CANCELLED
      ? [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('orders:actions.edit'),
            onClick: () => navigate(`/dashboard/orders/sales/${record.id}/edit`),
          },
        ]
      : []),
    ...(record.status !== OrderStatus.DELIVERED && record.status !== OrderStatus.CANCELLED
      ? [
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: t('orders:actions.delete'),
            danger: true,
            onClick: () => handleDelete(record),
          },
        ]
      : []),
  ];

  const columns: ColumnsType<SalesOrder> = [
    {
      title: t('orders:columns.orderNumber'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 150,
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
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: t('orders:columns.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (value: number) => (value ? formatCurrency(value, i18n.language) : '-'),
    },
    {
      title: t('orders:columns.paidAmount'),
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 130,
      align: 'right',
      render: (value: number) => (value ? formatCurrency(value, i18n.language) : '-'),
    },
    {
      title: t('orders:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={statusColors[status as OrderStatus] || 'default'}>
          {t(`orders:status.${status}`)}
        </Tag>
      ),
    },
    {
      title: 'Sync',
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      width: isMobile ? 80 : 100,
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
      title: t('commonUi:table.actions'),
      key: 'action',
      width: 80,
      fixed: isMobile ? undefined : 'right',
      align: 'center',
      render: (_: any, record: SalesOrder) => (
        <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : isTablet ? 16 : 24 }}>
      <Card size={isMobile ? 'small' : 'default'}>
        <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 'small' : 'large'}>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 12 : 0,
            }}
          >
            <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              <ShoppingCartOutlined /> {t('orders:title')}
            </Title>
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

              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ width: isMobile ? '100%' : 'auto' }}
                onClick={() => navigate('/dashboard/orders/sales/new')}
              >
                {t('orders:createButton')}
              </Button>
            </Space>
          </div>

          <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
            <Input
              placeholder={t('orders:searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: isMobile ? '100%' : 300 }}
              allowClear
              size={isMobile ? 'middle' : 'large'}
            />
            
            <Select
              placeholder={t('orders:filters.status')}
              style={{ width: isMobile ? '100%' : 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              size={isMobile ? 'middle' : 'large'}
            >
              <Option value={OrderStatus.DRAFT}>{t('orders:status.draft')}</Option>
              <Option value={OrderStatus.PENDING}>{t('orders:status.pending')}</Option>
              <Option value={OrderStatus.CONFIRMED}>{t('orders:status.confirmed')}</Option>
              <Option value={OrderStatus.PROCESSING}>{t('orders:status.processing')}</Option>
              <Option value={OrderStatus.SHIPPED}>{t('orders:status.shipped')}</Option>
              <Option value={OrderStatus.DELIVERED}>{t('orders:status.delivered')}</Option>
              <Option value={OrderStatus.CANCELLED}>{t('orders:status.cancelled')}</Option>
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={paginatedOrders}
            loading={loading}
            rowKey="id"
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              current: page,
              pageSize,
              total: orders.length,
              showSizeChanger: !isMobile,
              showTotal: (total) => t('orders:messages.total', { total }),
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
              simple: isMobile,
            }}
            scroll={{ x: isMobile ? 1100 : 1300 }}
          />
        </Space>
      </Card>
    </div>
  );
}
