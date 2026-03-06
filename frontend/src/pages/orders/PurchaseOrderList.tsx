import React, { useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Card, message, Typography, Dropdown } from 'antd';
import type { ColumnsType, MenuProps } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, ShoppingOutlined, EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import purchaseOrderService, { PurchaseOrderStatus } from '../../services/purchaseOrderService';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  supplier?: { id: number; name: string };
  orderDate: string;
  expectedDate?: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  items: any[];
  notes?: string;
  createdAt: string;
}

const statusColors: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: 'default',
  [PurchaseOrderStatus.PENDING]: 'blue',
  [PurchaseOrderStatus.APPROVED]: 'cyan',
  [PurchaseOrderStatus.ORDERED]: 'orange',
  [PurchaseOrderStatus.RECEIVED]: 'green',
  [PurchaseOrderStatus.CANCELLED]: 'red',
};

const statusLabels: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: 'Nháp',
  [PurchaseOrderStatus.PENDING]: 'Chờ duyệt',
  [PurchaseOrderStatus.APPROVED]: 'Đã duyệt',
  [PurchaseOrderStatus.ORDERED]: 'Đã đặt hàng',
  [PurchaseOrderStatus.RECEIVED]: 'Đã nhận hàng',
  [PurchaseOrderStatus.CANCELLED]: 'Đã hủy',
};

const PurchaseOrderList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', { page, pageSize, search, status: statusFilter }],
    queryFn: () => purchaseOrderService.getAll({ page, limit: pageSize, search, status: statusFilter }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => purchaseOrderService.approve(id),
    onSuccess: () => {
      message.success('Duyệt đơn mua hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: () => {
      message.error('Không thể duyệt đơn mua hàng');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => purchaseOrderService.cancel(id),
    onSuccess: () => {
      message.success('Hủy đơn mua hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: () => {
      message.error('Không thể hủy đơn mua hàng');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => purchaseOrderService.delete(id),
    onSuccess: () => {
      message.success('Xóa đơn mua hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: () => {
      message.error('Không thể xóa đơn mua hàng');
    },
  });

  const getActionMenu = (record: PurchaseOrder): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Xem chi tiết',
      onClick: () => navigate(`/dashboard/orders/purchase/${record.id}`),
    },
    ...(record.status === PurchaseOrderStatus.PENDING
      ? [
          {
            key: 'approve',
            icon: <CheckOutlined />,
            label: 'Duyệt đơn',
            onClick: () => approveMutation.mutate(record.id),
          },
        ]
      : []),
    ...(record.status !== PurchaseOrderStatus.RECEIVED && record.status !== PurchaseOrderStatus.CANCELLED
      ? [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Chỉnh sửa',
            onClick: () => navigate(`/dashboard/orders/purchase/${record.id}/edit`),
          },
        ]
      : []),
    ...(record.status !== PurchaseOrderStatus.RECEIVED && record.status !== PurchaseOrderStatus.CANCELLED
      ? [
          {
            key: 'cancel',
            icon: <CloseOutlined />,
            label: 'Hủy đơn',
            danger: true,
            onClick: () => cancelMutation.mutate(record.id),
          },
        ]
      : []),
    ...(record.status === PurchaseOrderStatus.DRAFT
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

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: 'Mã đơn',
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
      title: 'Nhà cung cấp',
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
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
      title: 'Ngày dự kiến',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: PurchaseOrderStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: PurchaseOrder) => (
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
              <ShoppingOutlined /> Đơn mua hàng
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/dashboard/orders/purchase/new')}
            >
              Tạo đơn mua hàng
            </Button>
          </div>

          <Space wrap>
            <Input
              placeholder="Tìm kiếm đơn mua hàng..."
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
              <Option value={PurchaseOrderStatus.DRAFT}>{statusLabels[PurchaseOrderStatus.DRAFT]}</Option>
              <Option value={PurchaseOrderStatus.PENDING}>{statusLabels[PurchaseOrderStatus.PENDING]}</Option>
              <Option value={PurchaseOrderStatus.APPROVED}>{statusLabels[PurchaseOrderStatus.APPROVED]}</Option>
              <Option value={PurchaseOrderStatus.ORDERED}>{statusLabels[PurchaseOrderStatus.ORDERED]}</Option>
              <Option value={PurchaseOrderStatus.RECEIVED}>{statusLabels[PurchaseOrderStatus.RECEIVED]}</Option>
              <Option value={PurchaseOrderStatus.CANCELLED}>{statusLabels[PurchaseOrderStatus.CANCELLED]}</Option>
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
              showTotal: (total) => `Tổng ${total} đơn mua hàng`,
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

export default PurchaseOrderList;
