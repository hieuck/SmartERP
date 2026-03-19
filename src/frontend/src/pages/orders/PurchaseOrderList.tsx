/**
 * Purchase Order List Page - Offline-First
 * Displays list of purchase orders with status filtering and approval workflow
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Select, message, Dropdown, Button, Space, Badge, Modal } from 'antd';
import type { MenuProps } from 'antd/es/menu';
import {
  ShoppingOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CheckOutlined,
  CloseOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { formatCurrency } from '@/utils/responsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { PurchaseOrder, SyncStatus } from '@/lib/offline/db';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

const statusColors: Record<string, string> = {
  draft: 'default',
  pending: 'blue',
  approved: 'cyan',
  ordered: 'orange',
  received: 'green',
  cancelled: 'red',
};

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['purchaseOrders', 'commonUi', 'common']);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('PurchaseOrderList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('PurchaseOrderList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load purchase orders from offline storage
  const loadPurchaseOrders = async () => {
    setLoading(true);
    try {
      logger.debug('PurchaseOrderList', 'Loading purchase orders from offline storage');
      const allOrders = await offlineServices.purchaseOrders.getAll();
      
      // Apply filters
      let filtered = allOrders;
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (po) =>
            po.poNumber.toLowerCase().includes(searchLower) ||
            po.notes?.toLowerCase().includes(searchLower)
        );
      }
      
      // Status filter
      if (statusFilter) {
        filtered = filtered.filter(po => po.status === statusFilter);
      }

      setPurchaseOrders(filtered);
      logger.info('PurchaseOrderList', `Loaded ${filtered.length} purchase orders`);
    } catch (error) {
      logger.error('PurchaseOrderList', 'Failed to load purchase orders', error as Error);
      message.error(t('purchaseOrders:messages.loadError'));
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
      logger.error('PurchaseOrderList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadPurchaseOrders();
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
    loadPurchaseOrders();
  }, [search, statusFilter]);

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
      logger.info('PurchaseOrderList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadPurchaseOrders();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('PurchaseOrderList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle approve
  const handleApprove = async (po: PurchaseOrder) => {
    try {
      logger.info('PurchaseOrderList', `Approving purchase order: ${po.id}`);
      await offlineServices.purchaseOrders.update(po.id, { status: 'approved' });
      message.success(t('purchaseOrders:messages.approveSuccess'));
      await loadPurchaseOrders();
      await updateQueueSize();
    } catch (error) {
      logger.error('PurchaseOrderList', 'Failed to approve purchase order', error as Error);
      message.error(t('purchaseOrders:messages.approveError'));
    }
  };

  // Handle cancel
  const handleCancel = async (po: PurchaseOrder) => {
    try {
      logger.info('PurchaseOrderList', `Cancelling purchase order: ${po.id}`);
      await offlineServices.purchaseOrders.update(po.id, { status: 'cancelled' });
      message.success(t('purchaseOrders:messages.cancelSuccess'));
      await loadPurchaseOrders();
      await updateQueueSize();
    } catch (error) {
      logger.error('PurchaseOrderList', 'Failed to cancel purchase order', error as Error);
      message.error(t('purchaseOrders:messages.cancelError'));
    }
  };

  // Handle delete
  const handleDelete = async (po: PurchaseOrder) => {
    try {
      logger.info('PurchaseOrderList', `Deleting purchase order: ${po.id}`);
      await offlineServices.purchaseOrders.delete(po.id);
      message.success(t('purchaseOrders:messages.deleteSuccess'));
      await loadPurchaseOrders();
      await updateQueueSize();
    } catch (error) {
      logger.error('PurchaseOrderList', 'Failed to delete purchase order', error as Error);
      message.error(t('purchaseOrders:messages.deleteError'));
    }
  };

  const getActionMenu = (record: PurchaseOrder): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('purchaseOrders:actions.viewDetail'),
      onClick: () => navigate(`/dashboard/orders/purchase/${record.id}`),
    },
    ...(record.status === 'pending'
      ? [
          {
            key: 'approve',
            icon: <CheckOutlined />,
            label: t('purchaseOrders:actions.approve'),
            onClick: () => handleApprove(record),
          },
        ]
      : []),
    ...(record.status !== 'received' && record.status !== 'cancelled'
      ? [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('purchaseOrders:actions.edit'),
            onClick: () => navigate(`/dashboard/orders/purchase/${record.id}/edit`),
          },
        ]
      : []),
    ...(record.status !== 'received' && record.status !== 'cancelled'
      ? [
          {
            key: 'cancel',
            icon: <CloseOutlined />,
            label: t('purchaseOrders:actions.cancel'),
            danger: true,
            onClick: () => handleCancel(record),
          },
        ]
      : []),
    ...(record.status === 'draft'
      ? [
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: t('purchaseOrders:actions.delete'),
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: t('purchaseOrders:messages.deleteConfirm'),
                content: t('purchaseOrders:messages.deleteDescription'),
                onOk: () => handleDelete(record),
              });
            },
          },
        ]
      : []),
  ];

  // Get paginated data
  const paginatedOrders = purchaseOrders.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: t('purchaseOrders:columns.poNumber'),
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: 150,
      render: (text: string, record: PurchaseOrder) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/orders/purchase/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: t('purchaseOrders:columns.supplier'),
      dataIndex: 'supplierId',
      key: 'supplierId',
      ellipsis: true,
      render: (supplierId: string) => supplierId || '-',
    },
    {
      title: t('purchaseOrders:columns.orderDate'),
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('purchaseOrders:columns.expectedDate'),
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 120,
      render: (date: Date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: t('purchaseOrders:columns.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('purchaseOrders:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {status?.toUpperCase() || 'DRAFT'}
        </Tag>
      ),
    },
    {
      title: t('purchaseOrders:sync.status'),
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
          [SyncStatus.SYNCED]: t('purchaseOrders:sync.synced'),
          [SyncStatus.PENDING]: t('purchaseOrders:sync.pending'),
          [SyncStatus.CONFLICT]: t('purchaseOrders:sync.conflict'),
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || t('purchaseOrders:sync.unknown')}
          </Tag>
        );
      },
    },
    {
      title: t('commonUi:table.actions'),
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_value: unknown, record: PurchaseOrder) => (
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
          <ShoppingOutlined /> {t('purchaseOrders:title')}
        </>
      }
      createButtonText={t('purchaseOrders:createButton')}
      onCreateClick={() => navigate('/dashboard/orders/purchase/new')}
      searchPlaceholder={t('purchaseOrders:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={
        <Select
          placeholder={t('purchaseOrders:filters.status')}
          style={{ width: 150 }}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
        >
          <Option value="draft">{t('purchaseOrders:status.draft')}</Option>
          <Option value="pending">{t('purchaseOrders:status.pending')}</Option>
          <Option value="approved">{t('purchaseOrders:status.approved')}</Option>
          <Option value="ordered">{t('purchaseOrders:status.ordered')}</Option>
          <Option value="received">{t('purchaseOrders:status.received')}</Option>
          <Option value="cancelled">{t('purchaseOrders:status.cancelled')}</Option>
        </Select>
      }
      extraActions={
        <Space>
          {/* Network Status Badge */}
          <Badge
            status={isOnline ? 'success' : 'error'}
            text={
              <Space size="small">
                {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                {isOnline ? t('purchaseOrders:sync.online') : t('purchaseOrders:sync.offline')}
              </Space>
            }
          />
          
          {/* Sync Queue Indicator */}
          {queueSize > 0 && (
            <Badge count={queueSize} showZero={false}>
              <Tag color="warning">{t('purchaseOrders:sync.pendingSync')}</Tag>
            </Badge>
          )}

          {/* Sync Button */}
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
          >
            {syncing ? t('purchaseOrders:sync.syncing') : t('purchaseOrders:sync.syncNow')}
          </Button>
        </Space>
      }
      columns={columns}
      dataSource={paginatedOrders}
      loading={loading}
      rowKey="id"
      pagination={{
        current: page,
        pageSize,
        total: purchaseOrders.length,
        showTotal: (total) => t('purchaseOrders:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
