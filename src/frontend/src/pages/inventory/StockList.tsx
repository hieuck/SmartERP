/**
 * Stock List Page - Offline-First
 * Displays inventory stock levels with warehouse filtering
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Select, Space, Button, Badge, message } from 'antd';
import {
  InboxOutlined,
  WarningOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { formatNumber } from '@/utils/responsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Stock, SyncStatus } from '@/lib/offline/db';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

export default function StockList() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['inventory', 'commonUi', 'common']);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('StockList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('StockList', 'Network connection lost');
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
    try {
      logger.debug('StockList', 'Loading warehouses from offline storage');
      const allWarehouses = await offlineServices.warehouses.getAll();
      setWarehouses(allWarehouses);
      logger.info('StockList', `Loaded ${allWarehouses.length} warehouses`);
    } catch (error) {
      logger.error('StockList', 'Failed to load warehouses', error as Error);
    }
  };

  // Load stocks from offline storage
  const loadStocks = async () => {
    setLoading(true);
    try {
      logger.debug('StockList', 'Loading stocks from offline storage');
      const allStocks = await offlineServices.stocks.getAll();
      
      // Apply filters
      let filtered = allStocks;
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.productId.toLowerCase().includes(searchLower) ||
            s.location?.toLowerCase().includes(searchLower)
        );
      }
      
      // Warehouse filter
      if (warehouseFilter) {
        filtered = filtered.filter(s => s.warehouseId === warehouseFilter);
      }

      setStocks(filtered);
      logger.info('StockList', `Loaded ${filtered.length} stocks`);
    } catch (error) {
      logger.error('StockList', 'Failed to load stocks', error as Error);
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
      logger.error('StockList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadWarehouses();
      await loadStocks();
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
    loadStocks();
  }, [search, warehouseFilter]);

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
      logger.info('StockList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadStocks();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('StockList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  const getStockStatus = (stock: Stock) => {
    if (stock.availableQuantity <= stock.minStockLevel) {
      return { color: 'red', text: t('inventory:status.low') };
    }
    if (stock.availableQuantity >= stock.maxStockLevel) {
      return { color: 'orange', text: t('inventory:status.high') };
    }
    return { color: 'green', text: t('inventory:status.normal') };
  };

  // Get paginated data
  const paginatedStocks = stocks.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Stock> = [
    {
      title: t('inventory:columns.product'),
      dataIndex: 'productId',
      key: 'productId',
      ellipsis: true,
    },
    {
      title: t('inventory:columns.warehouse'),
      dataIndex: 'warehouseId',
      key: 'warehouseId',
      width: 150,
      render: (id: string) => id || '-',
    },
    {
      title: t('inventory:columns.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value: number) => formatNumber(value, i18n.language),
    },
    {
      title: t('inventory:columns.reservedQuantity'),
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 100,
      align: 'right',
      render: (value: number) => formatNumber(value, i18n.language),
    },
    {
      title: t('inventory:columns.availableQuantity'),
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
      align: 'right',
      render: (value: number, record: Stock) => {
        const status = getStockStatus(record);
        return (
          <span style={{ color: status.color === 'red' ? '#ff4d4f' : undefined }}>
            {formatNumber(value, i18n.language)}
          </span>
        );
      },
    },
    {
      title: t('inventory:columns.minMax'),
      key: 'minMax',
      width: 120,
      align: 'center',
      render: (_: any, record: Stock) => (
        <span style={{ fontSize: 12 }}>
          {record.minStockLevel} / {record.maxStockLevel}
        </span>
      ),
    },
    {
      title: t('inventory:columns.status'),
      key: 'status',
      width: 120,
      render: (_: any, record: Stock) => {
        const status = getStockStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: t('inventory:sync.status'),
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
          [SyncStatus.SYNCED]: t('inventory:sync.synced'),
          [SyncStatus.PENDING]: t('inventory:sync.pending'),
          [SyncStatus.CONFLICT]: t('inventory:sync.conflict'),
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || t('inventory:sync.unknown')}
          </Tag>
        );
      },
    },
  ];

  return (
    <StandardListPage
      title={
        <>
          <InboxOutlined /> {t('inventory:title')}
        </>
      }
      extraActions={
        <Space>
          <Button onClick={() => navigate('/dashboard/inventory/movements')}>
            {t('inventory:actions.movements')}
          </Button>
          <Button
            danger
            icon={<WarningOutlined />}
            onClick={() => navigate('/dashboard/inventory/low-stock')}
          >
            {t('inventory:actions.lowStock')}
          </Button>
          
          {/* Network Status Badge */}
          <Badge
            status={isOnline ? 'success' : 'error'}
            text={
              <Space size="small">
                {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                {isOnline ? t('inventory:sync.online') : t('inventory:sync.offline')}
              </Space>
            }
          />
          
          {/* Sync Queue Indicator */}
          {queueSize > 0 && (
            <Badge count={queueSize} showZero={false}>
              <Tag color="warning">{t('inventory:sync.pendingSync')}</Tag>
            </Badge>
          )}

          {/* Sync Button */}
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
          >
            {syncing ? t('inventory:sync.syncing') : t('inventory:sync.syncNow')}
          </Button>
        </Space>
      }
      searchPlaceholder={t('inventory:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={
        <Select
          placeholder={t('inventory:filters.warehouse')}
          style={{ width: 200 }}
          value={warehouseFilter}
          onChange={setWarehouseFilter}
          allowClear
        >
          {warehouses.map((warehouse) => (
            <Option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </Option>
          ))}
        </Select>
      }
      columns={columns}
      dataSource={paginatedStocks}
      loading={loading}
      rowKey="id"
      pagination={{
        current: page,
        pageSize,
        total: stocks.length,
        showTotal: (total) => t('inventory:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
