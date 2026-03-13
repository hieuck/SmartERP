import React, { useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Card, message, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, WarningOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import inventoryServiceNew from '../../services/inventory/inventoryService';

const { Title } = Typography;
const { Option } = Select;

interface Stock {
  id: number;
  productId: number;
  product?: { id: number; name: string; sku: string };
  warehouseId: number;
  warehouse?: { id: number; name: string };
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  lastUpdated: string;
}

const StockList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', { page, pageSize, search, warehouseId: warehouseFilter }],
    queryFn: () =>
      inventoryServiceNew.getAll({ page, limit: pageSize, search, warehouseId: warehouseFilter }),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryServiceNew.getAll({ limit: 100 }),
  });

  const getStockStatus = (stock: Stock) => {
    if (stock.availableQuantity <= stock.minQuantity) {
      return { color: 'red', text: 'Thấp' };
    }
    if (stock.availableQuantity >= stock.maxQuantity) {
      return { color: 'orange', text: 'Cao' };
    }
    return { color: 'green', text: 'Bình thường' };
  };

  const columns: ColumnsType<Stock> = [
    {
      title: 'SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      width: 120,
      render: (sku: string) => sku || '-',
    },
    {
      title: 'Sản phẩm',
      dataIndex: ['product', 'name'],
      key: 'product',
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: 'Kho',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      width: 150,
      render: (name: string) => name || '-',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Đã đặt',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 100,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Khả dụng',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
      align: 'right',
      render: (value: number, record: Stock) => {
        const status = getStockStatus(record);
        return (
          <span style={{ color: status.color === 'red' ? '#ff4d4f' : undefined }}>
            {value.toLocaleString('vi-VN')}
          </span>
        );
      },
    },
    {
      title: 'Min/Max',
      key: 'minMax',
      width: 120,
      align: 'center',
      render: (_: any, record: Stock) => (
        <span style={{ fontSize: 12 }}>
          {record.minQuantity} / {record.maxQuantity}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_: any, record: Stock) => {
        const status = getStockStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <InboxOutlined /> Tồn kho
            </Title>
            <Space>
              <Button onClick={() => navigate('/dashboard/inventory/movements')}>
                Lịch sử xuất nhập
              </Button>
              <Button
                danger
                icon={<WarningOutlined />}
                onClick={() => navigate('/dashboard/inventory/low-stock')}
              >
                Cảnh báo tồn thấp
              </Button>
            </Space>
          </div>

          <Space wrap>
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="Kho"
              style={{ width: 200 }}
              value={warehouseFilter}
              onChange={setWarehouseFilter}
              allowClear
            >
              {warehouses?.data?.map((w: any) => (
                <Option key={w.id} value={w.id}>
                  {w.warehouse?.name || `Kho ${w.id}`}
                </Option>
              ))}
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={data?.data || []}
            loading={isLoading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total: data?.meta?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} mặt hàng`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
            }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>
    </div>
  );
};

export default StockList;
