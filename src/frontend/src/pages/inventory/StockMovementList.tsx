import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Card,
  message,
  Typography,
  DatePicker,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  SwapOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SyncOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import inventoryServiceNew, { StockMovementType } from '../../services/inventory/inventoryService';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface StockMovement {
  id: number;
  productId: number;
  product?: { id: number; name: string; sku: string };
  warehouseId: number;
  warehouse?: { id: number; name: string };
  type: StockMovementType;
  quantity: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  createdBy?: { id: number; name: string };
}

const movementTypeConfig: Record<
  StockMovementType,
  { color: string; label: string; icon: React.ReactNode }
> = {
  [StockMovementType.IN]: { color: 'green', label: 'Nhập kho', icon: <ArrowDownOutlined /> },
  [StockMovementType.OUT]: { color: 'red', label: 'Xuất kho', icon: <ArrowUpOutlined /> },
  [StockMovementType.TRANSFER]: { color: 'blue', label: 'Chuyển kho', icon: <SwapOutlined /> },
  [StockMovementType.ADJUSTMENT]: { color: 'orange', label: 'Điều chỉnh', icon: <ToolOutlined /> },
};

const StockMovementList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<StockMovementType | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', { page, pageSize, search, type: typeFilter, dateRange }],
    queryFn: () =>
      inventoryServiceNew.getMovements({
        page,
        limit: pageSize,
        search,
        type: typeFilter,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
      }),
  });

  const columns: ColumnsType<StockMovement> = [
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: StockMovementType) => {
        const config = movementTypeConfig[type];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
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
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value: number, record: StockMovement) => {
        const isPositive = record.type === StockMovementType.IN;
        return (
          <span style={{ color: isPositive ? '#52c41a' : '#ff4d4f' }}>
            {isPositive ? '+' : '-'}
            {Math.abs(value).toLocaleString('vi-VN')}
          </span>
        );
      },
    },
    {
      title: 'Tham chiếu',
      dataIndex: 'reference',
      key: 'reference',
      width: 150,
      render: (ref: string) => ref || '-',
    },
    {
      title: 'Người thực hiện',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      width: 150,
      render: (name: string) => name || '-',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <SyncOutlined /> Lịch sử xuất nhập kho
            </Title>
            <Button onClick={() => navigate('/dashboard/inventory/stock')}>Quay lại tồn kho</Button>
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
              placeholder="Loại giao dịch"
              style={{ width: 150 }}
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
            >
              <Option value={StockMovementType.IN}>Nhập kho</Option>
              <Option value={StockMovementType.OUT}>Xuất kho</Option>
              <Option value={StockMovementType.TRANSFER}>Chuyển kho</Option>
              <Option value={StockMovementType.ADJUSTMENT}>Điều chỉnh</Option>
            </Select>
            <RangePicker
              format="DD/MM/YYYY"
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')]);
                } else {
                  setDateRange(undefined);
                }
              }}
            />
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
              showTotal: (total) => `Tổng ${total} giao dịch`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
            }}
            scroll={{ x: 1400 }}
          />
        </Space>
      </Card>
    </div>
  );
};

export default StockMovementList;
