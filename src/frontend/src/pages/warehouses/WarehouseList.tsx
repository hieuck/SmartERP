/**
 * Warehouse List Page
 * Displays and manages warehouses
 * Uses StandardListPage with i18n and responsive design
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, message } from 'antd';
import { useTranslation } from 'react-i18next';
import StandardListPage from '../../components/common/StandardListPage';
import warehouseService, { Warehouse } from '../../services/inventory/warehouseService';
import type { ColumnsType } from 'antd/es/table';

const WarehouseList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['warehouses', 'commonUi']);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', { search, status }],
    queryFn: () => warehouseService.getWarehouses({ search, status }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => warehouseService.deleteWarehouse(id),
    onSuccess: () => {
      message.success(t('warehouses:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: () => {
      message.error(t('warehouses:messages.deleteError'));
    },
  });

  const columns: ColumnsType<Warehouse> = [
    {
      title: t('warehouses:columns.code'),
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: t('warehouses:columns.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('warehouses:columns.address'),
      dataIndex: 'address',
      key: 'address',
      width: 250,
      ellipsis: true,
      render: (_: any, record: Warehouse) => (
        <span>
          {record.address}
          {record.ward && `, ${record.ward}`}
          {record.district && `, ${record.district}`}
          {record.city && `, ${record.city}`}
        </span>
      ),
    },
    {
      title: t('warehouses:columns.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: t('warehouses:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {t(`warehouses:status.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('warehouses:columns.isDefault'),
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: 100,
      render: (isDefault: boolean) =>
        isDefault ? <Tag color="blue">{t('warehouses:labels.default')}</Tag> : null,
    },
  ];

  return (
    <StandardListPage
      title={t('warehouses:title')}
      createButtonText={t('warehouses:createButton')}
      onCreateClick={() => navigate('/warehouses/new')}
      searchPlaceholder={t('warehouses:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={data?.data || []}
      loading={isLoading}
      onEdit={(record) => navigate(`/warehouses/${record.id}`)}
      onDelete={(record) => deleteMutation.mutate(record.id)}
      deleteConfirmTitle={t('commonUi:messages.deleteConfirm')}
      pagination={{
        current: data?.meta?.page || 1,
        pageSize: data?.meta?.limit || 10,
        total: data?.meta?.total || 0,
        showTotal: (total) => t('warehouses:messages.total', { total }),
        onChange: () => {},
      }}
    />
  );
};

export default WarehouseList;
