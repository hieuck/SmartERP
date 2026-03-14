/**
 * Customer List Page
 * Displays list of customers with search and CRUD operations
 * Uses StandardListPage for consistent UI
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import customerService from '../../services/crm/customerService';
import StandardListPage from '../../components/common/StandardListPage';
import { formatCurrency } from '../../utils/responsive';
import type { ColumnsType } from 'antd/es/table';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  balance: number;
  createdAt: string;
}

export default function CustomerList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation(['customers', 'commonUi']);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, pageSize, search }],
    queryFn: () => customerService.getAll({ page, limit: pageSize, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customerService.delete(id),
    onSuccess: () => {
      message.success(t('customers:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => {
      message.error(t('customers:messages.deleteError'));
    },
  });

  const columns: ColumnsType<Customer> = [
    {
      title: t('customers:columns.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('customers:columns.email'),
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: t('customers:columns.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: t('customers:columns.address'),
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: t('customers:columns.creditLimit'),
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('customers:columns.balance'),
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <Tag color={value > 0 ? 'red' : 'green'}>
          {formatCurrency(value, i18n.language)}
        </Tag>
      ),
    },
  ];

  return (
    <StandardListPage
      title={
        <>
          <UserOutlined /> {t('customers:title')}
        </>
      }
      createButtonText={t('customers:createButton')}
      onCreateClick={() => navigate('/dashboard/customers/new')}
      searchPlaceholder={t('customers:searchPlaceholder')}
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
        showTotal: (total) => t('customers:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
      onEdit={(record) => navigate(`/dashboard/customers/${record.id}`)}
      onDelete={(record) => deleteMutation.mutate(record.id)}
      deleteConfirmTitle={t('commonUi:messages.deleteConfirm')}
    />
  );
}
