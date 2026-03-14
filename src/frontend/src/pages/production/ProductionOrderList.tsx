/**
 * Production Order List Page
 * Displays and manages production orders
 * Requirements: 37.1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Space, Tag, message, Select, Progress } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import productionService, { ProductionOrder } from '@/services/production/productionService';
import { formatDate } from '@/utils/responsive';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

export default function ProductionOrderList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();

  // Fetch production orders
  const { data, isLoading } = useQuery({
    queryKey: ['production-orders', { search, status }],
    queryFn: async () => {
      const response = await productionService.productionOrder.getProductionOrders({
        search,
        status,
      });
      return response.data;
    },
  });

  // Start order mutation
  const startMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.productionOrder.startProductionOrder(id);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  // Complete order mutation
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.productionOrder.completeProductionOrder(id);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.productionOrder.cancelProductionOrder(id);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
    },
    onError: () => {
      message.error(t('production:messages.deleteError'));
    },
  });

  const statusColors: Record<string, string> = {
    draft: 'default',
    in_progress: 'blue',
    paused: 'orange',
    completed: 'green',
    cancelled: 'red',
  };

  const columns: ColumnsType<ProductionOrder> = [
    {
      title: t('production:orders.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: t('production:orders.product'),
      dataIndex: ['product', 'name'],
      key: 'product',
      ellipsis: true,
    },
    {
      title: t('production:orders.quantity'),
      key: 'quantity',
      width: 150,
      render: (_: any, record: ProductionOrder) => (
        <div>
          <div>
            {record.producedQuantity} / {record.quantity}
          </div>
          <Progress
            percent={Math.round((record.producedQuantity / record.quantity) * 100)}
            size="small"
            status={record.status === 'completed' ? 'success' : 'active'}
          />
        </div>
      ),
    },
    {
      title: t('production:orders.defectsWaste'),
      key: 'defects',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: ProductionOrder) => (
        <span style={{ color: record.defectQuantity > 0 ? '#ff4d4f' : undefined }}>
          {record.defectQuantity + record.wasteQuantity}
        </span>
      ),
    },
    {
      title: t('production:orders.startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('production:orders.expectedEndDate'),
      dataIndex: 'expectedEndDate',
      key: 'expectedEndDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('production:orders.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{t(`production:orders.statuses.${status}`)}</Tag>
      ),
    },
  ];

  const filterComponents = (
    <Select
      placeholder={t('production:filters.status')}
      style={{ width: 150 }}
      allowClear
      value={status}
      onChange={setStatus}
    >
      <Option value="draft">{t('production:orders.statuses.draft')}</Option>
      <Option value="in_progress">{t('production:orders.statuses.in_progress')}</Option>
      <Option value="paused">{t('production:orders.statuses.paused')}</Option>
      <Option value="completed">{t('production:orders.statuses.completed')}</Option>
      <Option value="cancelled">{t('production:orders.statuses.cancelled')}</Option>
    </Select>
  );

  return (
    <StandardListPage
      title={t('production:orders.list')}
      createButtonText={t('production:orders.createOrder')}
      onCreateClick={() => navigate('/production/orders/new')}
      searchPlaceholder={t('production:orders.searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={filterComponents}
      columns={columns}
      dataSource={data?.data || []}
      loading={isLoading || startMutation.isPending || completeMutation.isPending || cancelMutation.isPending}
      onMobileItemClick={(order) => navigate(`/production/orders/${order.id}`)}
      pagination={{
        current: 1,
        pageSize: 10,
        total: data?.data?.length || 0,
        showTotal: (total: number) => t('production:messages.total', { total }),
        onChange: () => {},
      }}
      customContent={
        <Space style={{ marginBottom: 16 }} wrap>
          {data?.data?.filter((o: ProductionOrder) => o.status === 'draft').map((order: ProductionOrder) => (
            <Button
              key={order.id}
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => startMutation.mutate(order.id)}
            >
              {t('production:orders.start')} - {order.code}
            </Button>
          ))}
          {data?.data?.filter((o: ProductionOrder) => o.status === 'in_progress').map((order: ProductionOrder) => (
            <Button
              key={order.id}
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                if (window.confirm(t('production:orders.confirmComplete'))) {
                  completeMutation.mutate(order.id);
                }
              }}
            >
              {t('production:orders.complete')} - {order.code}
            </Button>
          ))}
        </Space>
      }
    />
  );
}
