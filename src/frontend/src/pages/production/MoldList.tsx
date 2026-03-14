/**
 * Mold List Page
 * Displays and manages production molds
 * Requirements: 36.1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Space, Tag, message, Select, Badge } from 'antd';
import { ToolOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import productionService, { Mold } from '@/services/production/productionService';
import { formatDate } from '@/utils/responsive';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

export default function MoldList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();

  // Fetch molds
  const { data, isLoading } = useQuery({
    queryKey: ['molds', { search, status }],
    queryFn: async () => {
      const response = await productionService.mold.getMolds({ search, status });
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.mold.deleteMold(id);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['molds'] });
    },
    onError: () => {
      message.error(t('production:messages.deleteError'));
    },
  });

  const statusColors: Record<string, string> = {
    available: 'green',
    in_use: 'blue',
    maintenance: 'orange',
    broken: 'red',
  };

  const needsMaintenance = (mold: Mold) => {
    if (!mold.nextMaintenanceDate) return false;
    return dayjs(mold.nextMaintenanceDate).isBefore(dayjs().add(7, 'day'));
  };

  const columns: ColumnsType<Mold> = [
    {
      title: t('production:molds.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: t('production:molds.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Mold) => (
        <Space>
          {name}
          {needsMaintenance(record) && <Badge status="warning" />}
        </Space>
      ),
    },
    {
      title: t('production:molds.size'),
      dataIndex: 'size',
      key: 'size',
      width: 120,
    },
    {
      title: t('production:molds.productWeight'),
      dataIndex: 'productWeight',
      key: 'productWeight',
      width: 150,
      align: 'right' as const,
      render: (value: number) => (value ? `${value} kg` : '-'),
    },
    {
      title: t('production:molds.usageCount'),
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 130,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: t('production:molds.nextMaintenance'),
      dataIndex: 'nextMaintenanceDate',
      key: 'nextMaintenanceDate',
      width: 150,
      render: (date: Date, record: Mold) => {
        if (!date) return '-';
        const isNear = needsMaintenance(record);
        return (
          <span
            style={{
              color: isNear ? '#faad14' : undefined,
              fontWeight: isNear ? 'bold' : undefined,
            }}
          >
            {formatDate(date)}
            {isNear && <WarningOutlined style={{ marginLeft: 8 }} />}
          </span>
        );
      },
    },
    {
      title: t('production:molds.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{t(`production:molds.statuses.${status}`)}</Tag>
      ),
    },
    {
      title: t('production:molds.maintenance'),
      key: 'maintenance',
      width: 120,
      render: (_: any, record: Mold) => (
        <Button
          type="link"
          icon={<ToolOutlined />}
          onClick={() => navigate(`/production/molds/${record.id}/maintenance`)}
        >
          {t('production:molds.maintenance')}
        </Button>
      ),
    },
  ];

  const maintenanceNeeded = data?.filter((mold: Mold) => needsMaintenance(mold)).length || 0;

  const filterComponents = (
    <Select
      placeholder={t('production:filters.status')}
      style={{ width: 150 }}
      allowClear
      value={status}
      onChange={setStatus}
    >
      <Option value="available">{t('production:molds.statuses.available')}</Option>
      <Option value="in_use">{t('production:molds.statuses.in_use')}</Option>
      <Option value="maintenance">{t('production:molds.statuses.maintenance')}</Option>
      <Option value="broken">{t('production:molds.statuses.broken')}</Option>
    </Select>
  );

  return (
    <StandardListPage
      title={
        <Space>
          <span>{t('production:molds.list')}</span>
          {maintenanceNeeded > 0 && (
            <Tag color="warning" icon={<WarningOutlined />}>
              {maintenanceNeeded} {t('production:molds.maintenance')}
            </Tag>
          )}
        </Space>
      }
      createButtonText={t('production:molds.create')}
      onCreateClick={() => navigate('/production/molds/new')}
      searchPlaceholder={t('production:molds.searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={filterComponents}
      columns={columns}
      dataSource={data || []}
      loading={isLoading || deleteMutation.isPending}
      onEdit={(record) => navigate(`/production/molds/${record.id}`)}
      onDelete={(record) => deleteMutation.mutate(record.id)}
      deleteConfirmTitle={t('production:messages.deleteConfirm')}
      pagination={false}
    />
  );
}
