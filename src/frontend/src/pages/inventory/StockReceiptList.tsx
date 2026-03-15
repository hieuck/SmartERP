/**
 * Stock Receipt List Page - Offline-First
 * Displays and manages stock receipts with approval workflow
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Space, message, Badge } from 'antd';
import {
  InboxOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { createExpandableRender } from '@/components/common/ExpandableContent';
import { formatCurrency, formatDate } from '@/utils/responsive';
import { useResponsive } from '@/hooks/useResponsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { StockReceipt, SyncStatus } from '@/lib/offline/db';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

export default function StockReceiptList() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { t } = useTranslation(['inventory', 'common']);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('StockReceiptList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('StockReceiptList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load receipts from offline storage
  const loadReceipts = async () => {
    setLoading(true);
    try {
      logger.debug('StockReceiptList', 'Loading stock receipts from offline storage');
      const allReceipts = await offlineServices.stockReceipts.getAll();
      
      // Filter by search term
      let filtered = allReceipts;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = allReceipts.filter(
          (r) =>
            r.receiptNumber.toLowerCase().includes(searchLower) ||
            r.notes?.toLowerCase().includes(searchLower)
        );
      }

      setReceipts(filtered);
      logger.info('StockReceiptList', `Loaded ${filtered.length} stock receipts`);
    } catch (error) {
      logger.error('StockReceiptList', 'Failed to load stock receipts', error as Error);
      message.error(t('inventory:messages.loadError'));
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
      logger.error('StockReceiptList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadReceipts();
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

  // Reload when search changes
  useEffect(() => {
    loadReceipts();
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
      logger.info('StockReceiptList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadReceipts();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('StockReceiptList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string }> = {
      draft: { color: 'default' },
      pending: { color: 'processing' },
      received: { color: 'success' },
      cancelled: { color: 'error' },
    };
    const { color } = statusMap[status] || statusMap.draft;
    return (
      <Tag color={color} style={{ fontSize: isMobile ? 11 : 12, margin: 0 }}>
        {status?.toUpperCase() || 'DRAFT'}
      </Tag>
    );
  };

  // Get paginated data
  const paginatedReceipts = receipts.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<StockReceipt> = [
    {
      title: t('inventory:columns.code'),
      dataIndex: 'receiptNumber',
      key: 'receiptNumber',
      width: isMobile ? 90 : 120,
      render: (code, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/inventory/receipts/${record.id}`)}
          style={{ padding: 0, fontSize: isMobile ? 12 : 14 }}
        >
          {code}
        </Button>
      ),
    },
    {
      title: t('inventory:columns.receiptDate'),
      dataIndex: 'receiptDate',
      key: 'receiptDate',
      width: isMobile ? 85 : 120,
      render: (date: Date) => (
        <span style={{ fontSize: isMobile ? 12 : 14 }}>
          {dayjs(date).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: t('inventory:columns.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: isMobile ? 85 : 150,
      align: 'right' as const,
      render: (amount) => (
        <span style={{ fontSize: isMobile ? 12 : 14 }}>{formatCurrency(amount)}</span>
      ),
    },
    {
      title: t('inventory:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 80 : 120,
      render: getStatusTag,
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
    ...(!isMobile
      ? [
          {
            title: t('inventory:columns.notes'),
            dataIndex: 'notes',
            key: 'notes',
            width: 150,
            ellipsis: true,
            render: (notes: string) => notes || '-',
          },
        ]
      : []),
  ];

  const renderMobileItem = (record: StockReceipt): React.ReactNode => {
    return (
      <div>
        <div style={{ fontWeight: 'bold' }}>{record.receiptNumber}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{formatDate(record.receiptDate.toString())}</div>
        <div style={{ marginTop: 8 }}>
          {getStatusTag(record.status)}
        </div>
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <div>{t('inventory:columns.totalAmount')}: {formatCurrency(record.totalAmount)}</div>
          <div>{t('inventory:columns.notes')}: {record.notes || '-'}</div>
        </div>
      </div>
    );
  };

  return (
    <StandardListPage
      title={
        <>
          <InboxOutlined /> {t('inventory:receipts.title')}
        </>
      }
      createButtonText={t('inventory:receipts.createButton')}
      onCreateClick={() => navigate('/dashboard/inventory/receipts/new')}
      searchPlaceholder={t('inventory:searchPlaceholder')}
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
      dataSource={paginatedReceipts}
      loading={loading}
      enableSelection
      selectedRowKeys={selectedRowKeys}
      onSelectionChange={(keys) => setSelectedRowKeys(keys as string[])}
      mobileRenderItem={renderMobileItem}
      onMobileItemClick={(record) => navigate(`/dashboard/inventory/receipts/${record.id}`)}
      expandable={{
        expandedRowRender: createExpandableRender<StockReceipt>(
          (record) => [
            { label: t('inventory:columns.code'), value: record.receiptNumber },
            {
              label: t('inventory:columns.receiptDate'),
              value: dayjs(record.receiptDate).format('DD/MM/YYYY'),
            },
            { label: t('inventory:columns.totalAmount'), value: formatCurrency(record.totalAmount) },
            { label: t('inventory:columns.notes'), value: record.notes || '-', span: 3 },
          ],
          { column: 3, bordered: true }
        ),
      }}
      pagination={{
        current: page,
        pageSize,
        total: receipts.length,
        showSizeChanger: true,
        showTotal: (total) => t('inventory:messages.totalReceipts', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
