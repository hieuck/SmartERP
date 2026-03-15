/**
 * Warehouse Stock Report Page
 * Displays stock levels across warehouses
 * Requirements: 27.4
 * Offline-first: Loads from IndexedDB, syncs when online
 */

import { useState, useEffect } from 'react';
import { Card, Table, Select, Space, Statistic, Row, Col, Tag, Input, Button, Badge } from 'antd';
import {
  BarChartOutlined,
  SearchOutlined,
  InboxOutlined,
  WarningOutlined,
  SyncOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { useResponsive } from '@/hooks/useResponsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import type { Stock, Warehouse } from '@/lib/offline/db';

const { Option } = Select;

const WarehouseStockReport = () => {
  const context = 'WarehouseStockReport';
  const { isMobile } = useResponsive();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>();
  const [search, setSearch] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info(context, 'Network online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      logger.info(context, 'Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load data from IndexedDB
  const loadData = async () => {
    try {
      setIsLoading(true);
      logger.debug(context, 'Loading warehouses and stocks from IndexedDB');

      const [warehousesData, stocksData] = await Promise.all([
        offlineServices.warehouses.getAll(),
        offlineServices.stocks.getAll(),
      ]);

      setWarehouses(warehousesData);
      setStocks(stocksData);

      logger.info(context, `Loaded ${warehousesData.length} warehouses, ${stocksData.length} stocks`);
    } catch (error) {
      logger.error(context, 'Failed to load data', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-sync on mount when online
  useEffect(() => {
    loadData();

    if (isOnline) {
      handleSync();
    }
  }, []);

  // Update queue size
  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await syncManager.getQueueSize();
      setQueueSize(size);
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000);

    return () => clearInterval(interval);
  }, []);

  // Manual sync
  const handleSync = async () => {
    if (!isOnline) {
      logger.warn(context, 'Cannot sync while offline');
      return;
    }

    try {
      setIsSyncing(true);
      logger.info(context, 'Starting manual sync');

      const token = localStorage.getItem('token');
      if (!token) {
        logger.warn(context, 'No auth token found');
        return;
      }

      await syncManager.sync(token);
      await loadData();

      logger.info(context, 'Sync completed successfully');
    } catch (error) {
      logger.error(context, 'Sync failed', error as Error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter stocks based on selected warehouse and search
  const filteredStocks = stocks.filter((stock) => {
    // Filter by warehouse
    if (selectedWarehouse && stock.warehouseId !== selectedWarehouse) {
      return false;
    }

    // Filter by search (would need product data for full search)
    if (search && stock.productId && !stock.productId.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });

  const totalItems = filteredStocks.length;
  const lowStockItems = filteredStocks.filter((item) => item.quantity <= item.minStockLevel);

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productId',
      key: 'productId',
    },
    {
      title: 'Kho',
      dataIndex: 'warehouseId',
      key: 'warehouseId',
      render: (warehouseId: string) => {
        const warehouse = warehouses.find((w) => w.id === warehouseId);
        return warehouse?.name || warehouseId;
      },
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (qty: number, record: Stock) => {
        const isLow = qty <= record.minStockLevel;
        return (
          <span style={{ color: isLow ? '#cf1322' : undefined, fontWeight: isLow ? 600 : 400 }}>
            {qty?.toLocaleString('vi-VN') || 0}
          </span>
        );
      },
    },
    {
      title: 'Tối thiểu',
      dataIndex: 'minStockLevel',
      key: 'minStockLevel',
      align: 'right' as const,
      render: (v: number) => v?.toLocaleString('vi-VN') || '-',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: Stock) => {
        const isLow = record.quantity <= record.minStockLevel;
        return isLow ? (
          <Tag color="red" icon={<WarningOutlined />}>
            Sắp hết
          </Tag>
        ) : (
          <Tag color="green">Đủ hàng</Tag>
        );
      },
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={isMobile ? 12 : 8}>
          <Card>
            <Statistic
              title="Tổng mặt hàng"
              value={totalItems}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={isMobile ? 12 : 8}>
          <Card>
            <Statistic
              title="Sắp hết hàng"
              value={lowStockItems.length}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={isMobile ? 24 : 8}>
          <Card>
            <Statistic
              title="Kho đang xem"
              value={
                selectedWarehouse
                  ? warehouses.find((w) => w.id === selectedWarehouse)?.name || 'N/A'
                  : 'Tất cả'
              }
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Báo cáo tồn kho"
        extra={
          <Space>
            <Badge count={queueSize} offset={[-5, 5]}>
              <Button
                icon={<SyncOutlined spin={isSyncing} />}
                onClick={handleSync}
                loading={isSyncing}
                disabled={!isOnline}
              >
                Đồng bộ
              </Button>
            </Badge>
            <Tag icon={<WifiOutlined />} color={isOnline ? 'success' : 'error'}>
              {isOnline ? 'Online' : 'Offline'}
            </Tag>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="Chọn kho"
              style={{ width: isMobile ? '100%' : 200 }}
              allowClear
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
            >
              {warehouses.map((w) => (
                <Option key={w.id} value={w.id}>
                  {w.name}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="Tìm sản phẩm..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: isMobile ? '100%' : 250 }}
            />
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredStocks}
          rowKey={(record) => `${record.productId}-${record.warehouseId}`}
          loading={isLoading}
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 'max-content' }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} mặt hàng`,
          }}
        />
      </Card>
    </div>
  );
};

export default WarehouseStockReport;
