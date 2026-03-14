/**
 * Supplier List Page
 * Displays list of suppliers with search and CRUD operations
 * Uses StandardListPage for consistent UI
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rate, message } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import supplierService from '@/services/logistics/supplierService';
import StandardListPage from '@/components/common/StandardListPage';
import type { ColumnsType } from 'antd/es/table';

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  paymentTerms: string;
  leadTime: number;
  createdAt: string;
}

export default function SupplierList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['suppliers', 'commonUi']);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', { page, pageSize, search }],
    queryFn: () => supplierService.getAll({ page, limit: pageSize, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => supplierService.delete(id),
    onSuccess: () => {
      message.success(t('suppliers:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: () => {
      message.error(t('suppliers:messages.deleteError'));
    },
  });

  const columns: ColumnsType<Supplier> = [
    {
      title: t('suppliers:columns.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('suppliers:columns.email'),
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: t('suppliers:columns.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: t('suppliers:columns.rating'),
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (rating: number) => <Rate disabled value={rating} />,
    },
    {
      title: t('suppliers:columns.paymentTerms'),
      dataIndex: 'paymentTerms',
      key: 'paymentTerms',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('suppliers:columns.leadTime'),
      dataIndex: 'leadTime',
      key: 'leadTime',
      width: 120,
      render: (days: number) => t('suppliers:columns.leadTimeDays', { days }),
    },
  ];

  return (
    <StandardListPage
      title={
        <>
          <ShopOutlined /> {t('suppliers:title')}
        </>
      }
      createButtonText={t('suppliers:createButton')}
      onCreateClick={() => navigate('/dashboard/suppliers/new')}
      searchPlaceholder={t('suppliers:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={data?.data || []}
      loading={isLoading}
      rowKey="id"
      pagination={{
        current: page,
        pageSize,
        total: data?.meta?.total || 0,
        showTotal: (total) => t('suppliers:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
      onEdit={(record) => navigate(`/dashboard/suppliers/${record.id}`)}
      onDelete={(record) => deleteMutation.mutate(record.id)}
      deleteConfirmTitle={t('commonUi:messages.deleteConfirm')}
    />
  );
}
