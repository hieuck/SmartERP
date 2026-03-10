// @ts-nocheck
/**
 * Warehouse Stock Report Page
 * Displays stock levels per warehouse and consolidated view
 * Requirements: 27.4
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Card, Select, Space, Input, Tabs, Button } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import warehouseService, { WarehouseStock } from '../../services/inventory/warehouseService';
import { useResponsive } from '../../hooks/useResponsive';

const { TabPane } = Tabs;

const WarehouseStockReport = () => {
  const { isMobile } = useResponsive();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>();
  const [search, setSearch] = useState('');

  // Fetch warehouses
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses', { status: 'active' }],
    queryFn: () => warehouseService.getWarehouses({ status: 'active' }),
  });

  // Fetch stock by warehouse
  const { data: warehouseStock, isLoading: warehouseStockLoading } = useQuery({
    queryKey: ['warehouseStock', selectedWarehouse, search],
    queryFn: () => warehouseService.getStockByWarehouse(selectedWarehouse!, { search }),
    enabled: !!selectedWarehouse,
  });

  // Fetch consolidated stock
  const { data: consolidatedStock, isLoading: consolidatedStockLoading } = useQuery({
    queryKey: ['consolidatedStock', search],
    queryFn: () => warehouseService.getConsolidatedStock({ search }),
  });

  const warehouseColumns = [
    {
      title: 'Product SKU',
      dataIndex: 'productSku',
      key: 'productSku',
      width: 120,
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
      align: 'right' as const,
    },
  ];

  const consolidatedColumns = [
    {
      title: 'Product SKU',
      dataIndex: 'productSku',
      key: 'productSku',
      width: 120,
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 200,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
      align: 'right' as const,
    },
  ];

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export report');
  };

  return (
    <Card
      title="Warehouse Stock Report"
      extra={
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          Export
        </Button>
      }
    >
      <Tabs defaultActiveKey="warehouse">
        <TabPane tab="By Warehouse" key="warehouse">
          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            <Space>
              <Select
                placeholder="Select warehouse"
                style={{ width: 300 }}
                value={selectedWarehouse}
                onChange={setSelectedWarehouse}
                options={warehouses?.data?.map((w: any) => ({
                  label: `${w.code} - ${w.name}`,
                  value: w.id,
                }))}
              />
              <Input
                placeholder="Search products..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 300 }}
              />
            </Space>
          </Space>

          {selectedWarehouse ? (
            <Table
              size={isMobile ? 'small' : 'middle'}
              scroll={{ x: 'max-content' }}
              columns={warehouseColumns}
              dataSource={warehouseStock?.data || []}
              rowKey={(record) => `${record.warehouseId}-${record.productId}`}
              loading={warehouseStockLoading}
              pagination={{
                total: warehouseStock?.meta?.total,
                pageSize: warehouseStock?.meta?.limit,
                current: warehouseStock?.meta?.page,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} products`,
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
              Please select a warehouse to view stock
            </div>
          )}
        </TabPane>

        <TabPane tab="Consolidated View" key="consolidated">
          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            <Input
              placeholder="Search products..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 300 }}
            />
          </Space>

          <Table
            size={isMobile ? 'small' : 'middle'}
            scroll={{ x: 'max-content' }}
            columns={consolidatedColumns}
            dataSource={consolidatedStock?.data || []}
            rowKey={(record) => `${record.warehouseId}-${record.productId}`}
            loading={consolidatedStockLoading}
            pagination={{
              total: consolidatedStock?.meta?.total,
              pageSize: consolidatedStock?.meta?.limit,
              current: consolidatedStock?.meta?.page,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`,
            }}
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default WarehouseStockReport;
