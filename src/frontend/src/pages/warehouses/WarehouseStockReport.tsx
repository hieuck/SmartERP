/**
 * Warehouse Stock Report Page
 * Displays stock levels across warehouses
 * Requirements: 27.4
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Select, Space, Statistic, Row, Col, Tag, Input } from 'antd';
import {
  BarChartOutlined,
  SearchOutlined,
  InboxOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import warehouseService from '../../services/inventory/warehouseService';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;

const WarehouseStockReport = () => {
  const { isMobile } = useResponsive();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>();
  const [search, setSearch] = useState('');

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseService.getWarehouses(),
  });

  // Fetch stock report
  const { data: stockData, isLoading } = useQuery({
    queryKey: ['warehouseStockReport', { warehouseId: selectedWarehouse, search }],
    queryFn: () =>
      selectedWarehouse
        ? warehouseService.getStockByWarehouse(selectedWarehouse, { search })
        : warehouseService.getConsolidatedStock({ search }),
  });

  const stockItems = stockData?.data || [];
  const totalItems = stockItems.length;
  const lowStockItems = stockItems.filter((item: any) => item.quantity <= (item.minQuantity || 0));

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Kho',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (qty: number, record: any) => {
        const isLow = qty <= (record.minQuantity || 0);
        return (
          <span style={{ color: isLow ? '#cf1322' : undefined, fontWeight: isLow ? 600 : 400 }}>
            {qty?.toLocaleString('vi-VN') || 0}
          </span>
        );
      },
    },
    {
      title: 'Tối thiểu',
      dataIndex: 'minQuantity',
      key: 'minQuantity',
      align: 'right' as const,
      render: (v: number) => v?.toLocaleString('vi-VN') || '-',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => {
        const isLow = record.quantity <= (record.minQuantity || 0);
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
              value={selectedWarehouse ? (warehousesData?.data?.find((w: any) => w.id === selectedWarehouse)?.name || 'N/A') : 'Tất cả'}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Báo cáo tồn kho">
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="Chọn kho"
              style={{ width: isMobile ? '100%' : 200 }}
              allowClear
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
            >
              {(warehousesData?.data || []).map((w: any) => (
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
          dataSource={stockItems}
          rowKey={(record: any) => `${record.productId}-${record.warehouseId}`}
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
