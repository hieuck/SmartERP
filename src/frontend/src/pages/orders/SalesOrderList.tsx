import React, { useState, useEffect } from 'react';
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
  Dropdown,
} from 'antd';
import type { ColumnsType, MenuProps } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import orderService, { OrderStatus } from '../../services/order/orderService';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customer?: { id: number; name: string };
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  items: any[];
  createdAt: string;
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

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'Nháp',
  [OrderStatus.PENDING]: 'Chờ xử lý',
  [OrderStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.SHIPPED]: 'Đã gửi hàng',
  [OrderStatus.DELIVERED]: 'Đã giao hàng',
  [OrderStatus.CANCELLED]: 'Đã hủy',
};

const SalesOrderList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { page, pageSize, search, status: statusFilter }],
    queryFn: () => orderService.getAll({ page, limit: pageSize, search, status: statusFilter }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => orderService.delete(id),
    onSuccess: () => {
      message.success('Xóa đơn hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => {
      message.error('Không thể xóa đơn hàng');
    },
  });

  const getActionMenu = (record: Order): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Xem chi tiết',
      onClick: () => navigate(`/dashboard/orders/sales/${record.id}`),
    },
    ...(record.status !== OrderStatus.DELIVERED && record.status !== OrderStatus.CANCELLED
      ? [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Chỉnh sửa',
            onClick: () => navigate(`/dashboard/orders/sales/${record.id}/edit`),
          },
        ]
      : []),
    ...(record.status !== OrderStatus.DELIVERED && record.status !== OrderStatus.CANCELLED
      ? [
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Xóa',
            danger: true,
            onClick: () => deleteMutation.mutate(record.id),
          },
        ]
      : []),
  ];

  const columns: ColumnsType<Order> = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 150,
      render: (text: string, record: Order) => (
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
      title: 'Khách hàng',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 130,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: OrderStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: Order) => (
        <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <ShoppingCartOutlined /> Đơn hàng bán
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/dashboard/orders/sales/new')}
            >
              Tạo đơn hàng
            </Button>
          </div>

          <Space wrap>
            <Input
              placeholder="Tìm kiếm đơn hàng..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="Trạng thái"
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Option value={OrderStatus.DRAFT}>{statusLabels[OrderStatus.DRAFT]}</Option>
              <Option value={OrderStatus.PENDING}>{statusLabels[OrderStatus.PENDING]}</Option>
              <Option value={OrderStatus.CONFIRMED}>{statusLabels[OrderStatus.CONFIRMED]}</Option>
              <Option value={OrderStatus.PROCESSING}>{statusLabels[OrderStatus.PROCESSING]}</Option>
              <Option value={OrderStatus.SHIPPED}>{statusLabels[OrderStatus.SHIPPED]}</Option>
              <Option value={OrderStatus.DELIVERED}>{statusLabels[OrderStatus.DELIVERED]}</Option>
              <Option value={OrderStatus.CANCELLED}>{statusLabels[OrderStatus.CANCELLED]}</Option>
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
              showTotal: (total) => `Tổng ${total} đơn hàng`,
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

export default SalesOrderList;
