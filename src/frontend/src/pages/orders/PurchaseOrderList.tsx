/**
 * Purchase Order List Page
 * Displays list of purchase orders with status filtering and approval workflow
 * Uses StandardListPage for consistent UI
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Select, message, Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd/es/menu';
import {
  ShoppingOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import purchaseOrderService, {
  PurchaseOrderStatus,
} from '@/services/logistics/purchaseOrderService';
import StandardListPage from '@/components/common/StandardListPage';
import { formatCurrency } from '@/utils/responsive';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

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

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation(['purchaseOrders', 'commonUi']);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', { page, pageSize, search, status: statusFilter }],
    queryFn: () =>
      purchaseOrderService.getAll({ page, limit: pageSize, search, status: statusFilter }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => purchaseOrderService.approve(id),
    onSuccess: () => {
      message.success(t('purchaseOrders:messages.approveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: () => {
      message.error(t('purchaseOrders:messages.approveError'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => purchaseOrderService.cancel(id),
    onSuccess: () => {
      message.success(t('purchaseOrders:messages.cancelSuccess'));
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: () => {
      message.error(t('purchaseOrders:messages.cancelError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => purchaseOrderService.delete(id),
    onSuccess: () => {
      message.success(t('purchaseOrders:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: () => {
      message.error(t('purchaseOrders:messages.deleteError'));
    },
  });

  const getActionMenu = (record: PurchaseOrder): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('purchaseOrders:actions.viewDetail'),
      onClick: () => navigate(`/dashboard/orders/purchase/${record.id}`),
    },
    ...(record.status === PurchaseOrderStatus.PENDING
      ? [
          {
            key: 'approve',
            icon: <CheckOutlined />,
            label: t('purchaseOrders:actions.approve'),
            onClick: () => approveMutation.mutate(record.id),
          },
        ]
      : []),
    ...(record.status !== PurchaseOrderStatus.RECEIVED &&
    record.status !== PurchaseOrderStatus.CANCELLED
      ? [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('purchaseOrders:actions.edit'),
            onClick: () => navigate(`/dashboard/orders/purchase/${record.id}/edit`),
          },
        ]
      : []),
    ...(record.status !== PurchaseOrderStatus.RECEIVED &&
    record.status !== PurchaseOrderStatus.CANCELLED
      ? [
          {
            key: 'cancel',
            icon: <CloseOutlined />,
            label: t('purchaseOrders:actions.cancel'),
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
            label: t('purchaseOrders:actions.delete'),
            danger: true,
            onClick: () => deleteMutation.mutate(record.id),
          },
        ]
      : []),
  ];

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: t('purchaseOrders:columns.poNumber'),
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
      title: t('purchaseOrders:columns.supplier'),
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: t('purchaseOrders:columns.orderDate'),
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('purchaseOrders:columns.expectedDate'),
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: t('purchaseOrders:columns.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('purchaseOrders:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: PurchaseOrderStatus) => (
        <Tag color={statusColors[status]}>{t(`purchaseOrders:status.${status}`)}</Tag>
      ),
    },
    {
      title: t('commonUi:table.actions'),
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
    <StandardListPage
      title={
        <>
          <ShoppingOutlined /> {t('purchaseOrders:title')}
        </>
      }
      createButtonText={t('purchaseOrders:createButton')}
      onCreateClick={() => navigate('/dashboard/orders/purchase/new')}
      searchPlaceholder={t('purchaseOrders:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={
        <Select
          placeholder={t('purchaseOrders:filters.status')}
          style={{ width: 150 }}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
        >
          <Option value={PurchaseOrderStatus.DRAFT}>
            {t('purchaseOrders:status.draft')}
          </Option>
          <Option value={PurchaseOrderStatus.PENDING}>
            {t('purchaseOrders:status.pending')}
          </Option>
          <Option value={PurchaseOrderStatus.APPROVED}>
            {t('purchaseOrders:status.approved')}
          </Option>
          <Option value={PurchaseOrderStatus.ORDERED}>
            {t('purchaseOrders:status.ordered')}
          </Option>
          <Option value={PurchaseOrderStatus.RECEIVED}>
            {t('purchaseOrders:status.received')}
          </Option>
          <Option value={PurchaseOrderStatus.CANCELLED}>
            {t('purchaseOrders:status.cancelled')}
          </Option>
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
        showTotal: (total) => t('purchaseOrders:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
