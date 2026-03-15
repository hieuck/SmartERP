import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Card, Alert, Space, Badge, message } from 'antd';
import { WarningOutlined, SyncOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import type { Stock } from '@/lib/offline/db';
import type { ColumnsType } from 'antd/es/table';

interface LowStock extends Stock {
  needed: number;
  level: 'critical' | 'warning' | 'info';
}

export default function LowStockAlert() {
  const navigate = useNavigate();
  const { t } = useTranslation(['inventory', 'common']);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [lowStocks, setLowStocks] = useState<LowStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueSize, setSyncQueueSize] = useState(0);

  // Load stocks and calculate low stock
  const loadLowStocks = async () => {
    try {
      setLoading(true);
      
      // Load all stocks from IndexedDB
      const allStocks = await offlineServices.stocks.getAll();
      
      // Filter low stocks (availableQuantity < minStockLevel)
      const lowStockItems = allStocks
        .filter(stock => stock.availableQuantity < stock.minStockLevel)
        .map(stock => {
          const percentage = (stock.availableQuantity / stock.minStockLevel) * 100;
          let level: 'critical' | 'warning' | 'info' = 'info';
          
          if (percentage <= 25) {
            level = 'critical';
          } else if (percentage <= 50) {
            level = 'warning';
          }
          
          const needed = Math.max(0, stock.maxStockLevel - stock.availableQuantity);
          
          return {
            ...stock,
            needed,
            level,
          };
        })
        .sort((a, b) => {
          // Sort by level: critical > warning > info
          const levelOrder = { critical: 0, warning: 1, info: 2 };
          return levelOrder[a.level] - levelOrder[b.level];
        });
      
      setLowStocks(lowStockItems);
      logger.info('LowStockAlert', 'Loaded low stocks from IndexedDB', { count: lowStockItems.length });
    } catch (error) {
      logger.error('LowStockAlert', 'Failed to load low stocks', error as Error);
      message.error('Không thể tải danh sách tồn kho thấp');
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync on mount when online
  useEffect(() => {
    const initSync = async () => {
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await syncManager.sync(token);
            logger.info('LowStockAlert', 'Auto-sync completed');
          } catch (error) {
            logger.error('LowStockAlert', 'Auto-sync failed', error as Error);
          }
        }
      }
    };

    initSync();
    loadLowStocks();
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync queue size
  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await syncManager.getQueueSize();
      setSyncQueueSize(size);
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000);

    return () => clearInterval(interval);
  }, []);

  // Manual sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('Vui lòng đăng nhập');
      return;
    }

    try {
      setSyncing(true);
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(`Đồng bộ thành công: ${result.pulled} pulled, ${result.pushed} pushed`);
        await loadLowStocks();
      } else {
        message.error(`Đồng bộ thất bại: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('LowStockAlert', 'Sync failed', error as Error);
      message.error('Đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const columns: ColumnsType<LowStock> = [
    {
      title: t('inventory:columns.level'),
      key: 'level',
      width: 100,
      render: (_: any, record: LowStock) => {
        const colors = { critical: 'red', warning: 'orange', info: 'yellow' };
        return (
          <Tag color={colors[record.level]}>
            {t(`inventory:lowStock.level.${record.level}`)}
          </Tag>
        );
      },
    },
    {
      title: t('inventory:columns.product'),
      dataIndex: 'productId',
      key: 'product',
      ellipsis: true,
    },
    {
      title: t('inventory:columns.warehouse'),
      dataIndex: 'warehouseId',
      key: 'warehouse',
      width: 150,
    },
    {
      title: t('inventory:columns.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {value.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: t('inventory:columns.reserved'),
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 100,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: t('inventory:columns.available'),
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {value.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: t('inventory:columns.minQuantity'),
      dataIndex: 'minStockLevel',
      key: 'minStockLevel',
      width: 120,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: t('inventory:columns.needed'),
      dataIndex: 'needed',
      key: 'needed',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          {value.toLocaleString('vi-VN')}
        </span>
      ),
    },
  ];

  const renderMobileItem = (record: LowStock) => {
    const colors = { critical: 'red', warning: 'orange', info: 'yellow' };
    
    return (
      <Card size="small" style={{ marginBottom: 8 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>{record.productId}</strong>
          <div style={{ fontSize: 12, color: '#666' }}>{record.warehouseId || '-'}</div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Tag color={colors[record.level]}>
            {t(`inventory:lowStock.level.${record.level}`)}
          </Tag>
        </div>
        <div style={{ fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>{t('inventory:columns.quantity')}:</span>
            <span style={{ fontWeight: 500 }}>{record.quantity.toLocaleString('vi-VN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>{t('inventory:columns.available')}:</span>
            <span style={{ fontWeight: 500, color: '#ff4d4f' }}>{record.availableQuantity.toLocaleString('vi-VN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>{t('inventory:columns.minQuantity')}:</span>
            <span style={{ fontWeight: 500 }}>{record.minStockLevel.toLocaleString('vi-VN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('inventory:columns.needed')}:</span>
            <span style={{ fontWeight: 500, color: '#1890ff' }}>{record.needed.toLocaleString('vi-VN')}</span>
          </div>
        </div>
      </Card>
    );
  };

  const criticalCount = lowStocks.filter(item => item.level === 'critical').length;
  const warningCount = lowStocks.filter(item => item.level === 'warning').length;

  // Paginate data
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = lowStocks.slice(startIndex, endIndex);

  return (
    <div>
      {/* Network Status & Sync */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Badge status={isOnline ? 'success' : 'error'} />
          <span>{isOnline ? <WifiOutlined /> : <DisconnectOutlined />}</span>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
          {syncQueueSize > 0 && (
            <>
              <span>|</span>
              <span style={{ color: '#faad14' }}>{syncQueueSize} thay đổi chưa đồng bộ</span>
            </>
          )}
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
            size="small"
          >
            Đồng bộ
          </Button>
          <Button onClick={() => navigate('/dashboard/inventory/stock')}>
            {t('inventory:lowStock.backToStock')}
          </Button>
        </Space>
      </Card>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <WarningOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
          <span style={{ fontSize: 16, fontWeight: 500 }}>{t('inventory:lowStock.title')}</span>
        </Space>
      </Card>

      {(criticalCount > 0 || warningCount > 0) && (
        <Alert
          message={t('inventory:lowStock.alertMessage')}
          description={
            <Space direction="vertical">
              {criticalCount > 0 && (
                <div>
                  <Tag color="red">{t('inventory:lowStock.level.critical')}</Tag>
                  {t('inventory:lowStock.criticalAlert', { count: criticalCount })}
                </div>
              )}
              {warningCount > 0 && (
                <div>
                  <Tag color="orange">{t('inventory:lowStock.level.warning')}</Tag>
                  {t('inventory:lowStock.warningAlert', { count: warningCount })}
                </div>
              )}
            </Space>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <StandardListPage
        title=""
        columns={columns}
        dataSource={paginatedData}
        loading={loading}
        mobileRenderItem={renderMobileItem}
        pagination={{
          current: page,
          pageSize,
          total: lowStocks.length,
          showSizeChanger: true,
          showTotal: (total) => t('inventory:messages.totalProducts', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            if (newPageSize) setPageSize(newPageSize);
          },
        }}
      />

      <style>{`
        .row-critical {
          background-color: #fff1f0;
        }
        .row-critical:hover > td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
}
