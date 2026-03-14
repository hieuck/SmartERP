/**
 * Sales Order List Page
 * Displays list of sales orders with status filtering and CRUD operations
 * Uses StandardListPage for consistent UI
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Select, Space, Button, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd/es/menu';
import {
  ShoppingCartOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import orderService, { OrderStatus } from '../../services/order/orderService';
import StandardListPage from '../../components/common/StandardListPage';
import { formatCurrency } from '../../utils/responsive';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

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

export default function SalesOrderList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation(['orders', 'commonUi']);
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
      message.success(t('orders:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => {
      message.error(t('orders:messages.deleteError'));
    },
  });

  const getActionMenu = (record: Order): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('orders:actions.viewDetail'),
      onClick: () => navigate(`/dashboard/orders/sales/${record.id}`),
    },
    ...(record.status !== OrderStatus.DELIVERED && record.status !== OrderStatus.CANCELLED
      ? [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('orders:actions.edit'),
            onClick: () => navigate(`/dashboard/orders/sales/${record.id}/edit`),
          },
        ]
      : []),
    ...(record.status !== OrderStatus.DELIVERED && record.status !== OrderStatus.CANCELLED
      ? [
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: t('orders:actions.delete'),
            danger: true,
            onClick: () => deleteMutation.mutate(record.id),
          },
        ]
      : []),
  ];

  const columns: ColumnsType<Order> = [
    {
      title: t('orders:columns.orderNumber'),
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
      title: t('orders:columns.customer'),
      dataIndex: ['customer', 'name'],
      key: 'customer',
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: t('orders:columns.orderDate'),
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('orders:columns.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('orders:columns.paidAmount'),
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('orders:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: OrderStatus) => (
        <Tag color={statusColors[status]}>{t(`orders:status.${status}`)}</Tag>
      ),
    },
    {
      title: t('commonUi:table.actions'),
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
    <StandardListPage
      title={
        <>
          <ShoppingCartOutlined /> {t('orders:title')}
        </>
      }
      createButtonText={t('orders:createButton')}
      onCreateClick={() => navigate('/dashboard/orders/sales/new')}
      searchPlaceholder={t('orders:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={
        <Select
          placeholder={t('orders:filters.status')}
          style={{ width: 150 }}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
        >
          <Option value={OrderStatus.DRAFT}>{t('orders:status.draft')}</Option>
          <Option value={OrderStatus.PENDING}>{t('orders:status.pending')}</Option>
          <Option value={OrderStatus.CONFIRMED}>{t('orders:status.confirmed')}</Option>
          <Option value={OrderStatus.PROCESSING}>{t('orders:status.processing')}</Option>
          <Option value={OrderStatus.SHIPPED}>{t('orders:status.shipped')}</Option>
          <Option value={OrderStatus.DELIVERED}>{t('orders:status.delivered')}</Option>
          <Option value={OrderStatus.CANCELLED}>{t('orders:status.cancelled')}</Option>
        </Select>
      }
      columns={columns}
      dataSource={data?.data || []}
      loading={isLoading}
      rowKey="id"
      pagination={{
        current: page,
        pageSize,
        total: data?.meta?.total || 0,
        showTotal: (total) => t('orders:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
