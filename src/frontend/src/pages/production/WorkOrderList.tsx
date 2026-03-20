import StandardListPage from '@/components/common/StandardListPage';
import manufacturingService, {
  WorkOrder,
  WorkOrderStatus,
} from '@/services/manufacturing/manufacturing.service';
import {
  CheckCircleOutlined,
  EditOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MenuProps } from 'antd';
import { App, Button, Dropdown, Modal, Select, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const statusColors: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.DRAFT]: 'default',
  [WorkOrderStatus.READY]: 'cyan',
  [WorkOrderStatus.IN_PROGRESS]: 'orange',
  [WorkOrderStatus.COMPLETED]: 'green',
  [WorkOrderStatus.CANCELLED]: 'red',
};

export default function WorkOrderList() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t } = useTranslation('production');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: allWorkOrders = [], isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => manufacturingService.getWorkOrders(),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => manufacturingService.startWorkOrder(id),
    onSuccess: () => {
      message.success(t('workOrders.startSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: () => message.error(t('workOrders.startError')),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => manufacturingService.confirmWorkOrder(id),
    onSuccess: () => {
      message.success(t('workOrders.confirmSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: () => message.error(t('workOrders.confirmError')),
  });

  const finishMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      manufacturingService.finishWorkOrder(id, qty),
    onSuccess: () => {
      message.success(t('workOrders.completeSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: () => message.error(t('workOrders.completeError')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => manufacturingService.cancelWorkOrder(id),
    onSuccess: () => {
      message.success(t('messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: () => message.error(t('messages.deleteError')),
  });

  const workOrders = statusFilter
    ? allWorkOrders.filter((wo) => wo.status === statusFilter)
    : allWorkOrders;

  const filtered = workOrders.filter((wo) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      wo.reference.toLowerCase().includes(q) ||
      (wo.product?.name?.toLowerCase().includes(q) ?? false)
    );
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getActionMenu = (record: WorkOrder): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('actions.edit'),
      onClick: () => navigate(`/dashboard/production/work-orders/${record.id}/edit`),
      disabled:
        record.status === WorkOrderStatus.COMPLETED || record.status === WorkOrderStatus.CANCELLED,
    },
    ...(record.status === WorkOrderStatus.DRAFT
      ? [
          {
            key: 'confirm',
            icon: <PlayCircleOutlined />,
            label: t('actions.confirm'),
            onClick: () => confirmMutation.mutate(record.id),
          },
        ]
      : []),
    ...(record.status === WorkOrderStatus.READY
      ? [
          {
            key: 'start',
            icon: <PlayCircleOutlined />,
            label: t('workOrders.start'),
            onClick: () => startMutation.mutate(record.id),
          },
        ]
      : []),
    ...(record.status === WorkOrderStatus.IN_PROGRESS
      ? [
          {
            key: 'finish',
            icon: <CheckCircleOutlined />,
            label: t('workOrders.complete'),
            onClick: () =>
              Modal.confirm({
                title: t('workOrders.completeConfirm'),
                onOk: () => finishMutation.mutate({ id: record.id, qty: record.qtyToProduce }),
              }),
          },
        ]
      : []),
    ...(record.status !== WorkOrderStatus.COMPLETED && record.status !== WorkOrderStatus.CANCELLED
      ? [
          { type: 'divider' as const },
          {
            key: 'cancel',
            icon: <StopOutlined />,
            label: t('actions.cancel'),
            danger: true,
            onClick: () =>
              Modal.confirm({
                title: t('messages.deleteConfirm'),
                onOk: () => cancelMutation.mutate(record.id),
              }),
          },
        ]
      : []),
  ];

  const columns: ColumnsType<WorkOrder> = [
    {
      title: t('workOrders.reference'),
      dataIndex: 'reference',
      key: 'reference',
      width: 150,
      render: (text: string, record: WorkOrder) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => navigate(`/dashboard/production/work-orders/${record.id}/edit`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: t('workOrders.product'),
      key: 'product',
      ellipsis: true,
      render: (_: unknown, r: WorkOrder) => r.product?.name || r.productId,
    },
    {
      title: t('workOrders.qtyToProduce'),
      dataIndex: 'qtyToProduce',
      key: 'qtyToProduce',
      width: 130,
      align: 'right',
    },
    {
      title: t('workOrders.qtyProduced'),
      dataIndex: 'qtyProduced',
      key: 'qtyProduced',
      width: 120,
      align: 'right',
    },
    {
      title: t('workOrders.plannedStartDate'),
      dataIndex: 'datePlannedStart',
      key: 'datePlannedStart',
      width: 130,
      render: (d?: string) => (d ? dayjs(d).format('DD/MM/YYYY') : '-'),
    },
    {
      title: t('workOrders.plannedEndDate'),
      dataIndex: 'datePlannedFinished',
      key: 'datePlannedFinished',
      width: 130,
      render: (d?: string) => (d ? dayjs(d).format('DD/MM/YYYY') : '-'),
    },
    {
      title: t('workOrders.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s: WorkOrderStatus) => (
        <Tag color={statusColors[s]}>{t(`workOrders.statuses.${s}`)}</Tag>
      ),
    },
    {
      title: t('actions.actions'),
      key: 'actions',
      width: 60,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, record: WorkOrder) => (
        <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <StandardListPage
      title={
        <Space>
          <ToolOutlined />
          {t('workOrders.title')}
        </Space>
      }
      createButtonText={t('workOrders.create')}
      onCreateClick={() => navigate('/dashboard/production/work-orders/new')}
      searchPlaceholder={t('workOrders.searchPlaceholder')}
      searchValue={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
      filters={
        <Select
          placeholder={t('filters.status')}
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          allowClear
        >
          {Object.values(WorkOrderStatus).map((s) => (
            <Option key={s} value={s}>
              {t(`workOrders.statuses.${s}`)}
            </Option>
          ))}
        </Select>
      }
      columns={columns}
      dataSource={paginated}
      loading={isLoading}
      rowKey="id"
      scroll={{ x: 1000 }}
      pagination={{
        current: page,
        pageSize,
        total: filtered.length,
        showSizeChanger: true,
        showTotal: (total) => t('messages.total', { total }),
        onChange: (p, ps) => {
          setPage(p);
          setPageSize(ps);
        },
      }}
    />
  );
}
