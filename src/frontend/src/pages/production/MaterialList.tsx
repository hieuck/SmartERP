/**
 * Material List Page
 * Displays and manages production materials
 * Requirements: 35.1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Space, Tag, message, Select, Badge, Alert } from 'antd';
import { WarningOutlined, InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import productionService, { Material } from '@/services/production/productionService';
import { formatCurrency } from '@/utils/responsive';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

export default function MaterialList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>();
  const [status, setStatus] = useState<string>();

  // Fetch materials
  const { data, isLoading } = useQuery({
    queryKey: ['materials', { search, type, status }],
    queryFn: async () => {
      const response = await productionService.material.getMaterials({ search, type, status });
      return response.data;
    },
  });

  // Fetch material alerts
  const { data: alertsData } = useQuery({
    queryKey: ['material-alerts'],
    queryFn: async () => {
      const response = await productionService.material.getMaterialAlerts();
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.material.deleteMaterial(id);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: () => {
      message.error(t('production:messages.deleteError'));
    },
  });

  const typeColors: Record<string, string> = {
    plaster: 'blue',
    mold: 'purple',
    paint: 'green',
    accessory: 'orange',
    packaging: 'cyan',
  };

  const columns: ColumnsType<Material> = [
    {
      title: t('production:materials.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: t('production:materials.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Material) => (
        <Space>
          {name}
          {record.minQuantity && record.quantity <= record.minQuantity && <Badge status="error" />}
        </Space>
      ),
    },
    {
      title: t('production:materials.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={typeColors[type]}>{t(`production:materials.types.${type}`)}</Tag>
      ),
    },
    {
      title: t('production:materials.unit'),
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: t('production:materials.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right' as const,
      render: (quantity: number, record: Material) => {
        const isLow = record.minQuantity && quantity <= record.minQuantity;
        return (
          <span
            style={{ color: isLow ? '#ff4d4f' : undefined, fontWeight: isLow ? 'bold' : undefined }}
          >
            {quantity.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: t('production:materials.minQuantity'),
      dataIndex: 'minQuantity',
      key: 'minQuantity',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (value ? value.toLocaleString() : '-'),
    },
    {
      title: t('production:materials.purchasePrice'),
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      width: 130,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('production:materials.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {t(`production:materials.statuses.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('production:materials.transactions'),
      key: 'transactions',
      width: 120,
      render: (_: any, record: Material) => (
        <Button
          type="link"
          icon={<InboxOutlined />}
          onClick={() => navigate(`/production/materials/${record.id}/transactions`)}
        >
          {t('production:materials.viewTransactions')}
        </Button>
      ),
    },
  ];

  const filterComponents = (
    <Space wrap>
      <Select
        placeholder={t('production:filters.type')}
        style={{ width: 150 }}
        allowClear
        value={type}
        onChange={setType}
      >
        <Option value="plaster">{t('production:materials.types.plaster')}</Option>
        <Option value="mold">{t('production:materials.types.mold')}</Option>
        <Option value="paint">{t('production:materials.types.paint')}</Option>
        <Option value="accessory">{t('production:materials.types.accessory')}</Option>
        <Option value="packaging">{t('production:materials.types.packaging')}</Option>
      </Select>
      <Select
        placeholder={t('production:filters.status')}
        style={{ width: 150 }}
        allowClear
        value={status}
        onChange={setStatus}
      >
        <Option value="active">{t('production:materials.statuses.active')}</Option>
        <Option value="inactive">{t('production:materials.statuses.inactive')}</Option>
      </Select>
    </Space>
  );

  return (
    <div>
      {alertsData?.data && alertsData.data.length > 0 && (
        <Alert
          message={t('production:materials.lowStockAlert')}
          description={
            <div>
              <p>
                {t('production:messages.total', { total: alertsData.data.length })} {t('production:materials.title')}:
              </p>
              <ul>
                {alertsData.data.slice(0, 5).map((material: Material) => (
                  <li key={material.id}>
                    <strong>{material.name}</strong>: {material.quantity} {material.unit}
                    ({t('production:materials.minQuantity')}: {material.minQuantity} {material.unit})
                  </li>
                ))}
              </ul>
              {alertsData.data.length > 5 && (
                <p>...{t('common:and')} {alertsData.data.length - 5} {t('common:more')}</p>
              )}
            </div>
          }
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <StandardListPage
        title={t('production:materials.list')}
        createButtonText={t('production:materials.create')}
        onCreateClick={() => navigate('/production/materials/new')}
        searchPlaceholder={t('production:materials.searchPlaceholder')}
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterComponents}
        columns={columns}
        dataSource={data || []}
        loading={isLoading || deleteMutation.isPending}
        onEdit={(record) => navigate(`/production/materials/${record.id}`)}
        onDelete={(record) => deleteMutation.mutate(record.id)}
        deleteConfirmTitle={t('production:messages.deleteConfirm')}
        pagination={false}
      />
    </div>
  );
}
