import StandardListPage from '@/components/common/StandardListPage';
import accountService, { type Account } from '@/services/accounting/accountService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const TYPE_COLORS: Record<string, string> = {
  asset: 'blue',
  liability: 'red',
  equity: 'purple',
  income: 'green',
  expense: 'orange',
};

export default function ChartOfAccounts() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t } = useTranslation('accounting');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountService.delete(id),
    onSuccess: () => {
      message.success(t('accounts.messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const accounts: Account[] = Array.isArray(data) ? data : [];
  const filtered = search
    ? accounts.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.code.toLowerCase().includes(search.toLowerCase()),
      )
    : accounts;

  const columns: ColumnsType<Account> = [
    { title: t('accounts.columns.code'), dataIndex: 'code', key: 'code', width: 120 },
    { title: t('accounts.columns.name'), dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: t('accounts.columns.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (v: string) => (
        <Tag color={TYPE_COLORS[v] ?? 'default'}>
          {t(`accounts.types.${v}`, { defaultValue: v })}
        </Tag>
      ),
    },
    {
      title: t('accounts.columns.balance'),
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      width: 140,
      render: (v: number) => v?.toLocaleString() ?? '0',
    },
    {
      title: t('accounts.columns.isGroup'),
      dataIndex: 'isGroup',
      key: 'isGroup',
      width: 90,
      render: (v: boolean) => (v ? <Tag color="blue">Group</Tag> : null),
    },
  ];

  return (
    <StandardListPage
      title={t('accounts.title')}
      createButtonText={t('accounts.createButton')}
      onCreateClick={() => navigate('/dashboard/accounting/accounts/new')}
      searchPlaceholder={t('accounts.searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={filtered}
      loading={isLoading}
      rowKey="id"
      onEdit={(r) => navigate(`/dashboard/accounting/accounts/${r.id}`)}
      onDelete={(r) => deleteMutation.mutate(r.id)}
      deleteConfirmTitle={t('accounts.messages.deleteConfirm')}
      pagination={{ current: 1, pageSize: 20, total: filtered.length, onChange: () => {} }}
    />
  );
}
