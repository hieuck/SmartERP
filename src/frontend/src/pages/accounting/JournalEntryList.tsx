import StandardListPage from '@/components/common/StandardListPage';
import journalEntryService, {
  type JournalEntry,
} from '@/services/accounting/journalEntryService';
import { formatDate } from '@/utils/responsive';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, DatePicker, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function JournalEntryList() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t } = useTranslation('accounting');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf('month'));
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['journal-entries', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () =>
      journalEntryService.getAll({
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      }),
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => journalEntryService.post(id),
    onSuccess: () => {
      message.success(t('journalEntries.messages.postSuccess'));
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  const entries: JournalEntry[] = Array.isArray(data) ? data : [];
  const filtered = search
    ? entries.filter(
        (e) =>
          e.reference?.toLowerCase().includes(search.toLowerCase()) ||
          e.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  const columns: ColumnsType<JournalEntry> = [
    {
      title: t('journalEntries.columns.date'),
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: t('journalEntries.columns.reference'),
      dataIndex: 'reference',
      key: 'reference',
      width: 130,
    },
    {
      title: t('journalEntries.columns.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('journalEntries.columns.debit'),
      dataIndex: 'totalDebit',
      key: 'totalDebit',
      align: 'right',
      width: 130,
      render: (v: number) => v?.toLocaleString() ?? '0',
    },
    {
      title: t('journalEntries.columns.credit'),
      dataIndex: 'totalCredit',
      key: 'totalCredit',
      align: 'right',
      width: 130,
      render: (v: number) => v?.toLocaleString() ?? '0',
    },
    {
      title: t('journalEntries.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={v === 'posted' ? 'success' : 'default'}>
          {t(`journalEntries.status.${v}`, { defaultValue: v })}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'rowActions',
      width: 100,
      render: (_, record) =>
        record.status === 'draft' ? (
          <Button size="small" type="primary" onClick={() => postMutation.mutate(record.id)}>
            {t('journalEntries.actions.post')}
          </Button>
        ) : null,
    },
  ];

  const filters = (
    <Space>
      <DatePicker value={startDate} onChange={setStartDate} placeholder={t('reports.startDate')} />
      <DatePicker value={endDate} onChange={setEndDate} placeholder={t('reports.endDate')} />
    </Space>
  );

  return (
    <StandardListPage
      title={t('journalEntries.title')}
      createButtonText={t('journalEntries.createButton')}
      onCreateClick={() => navigate('/dashboard/accounting/journal-entries/new')}
      searchPlaceholder={t('accounts.searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={filters}
      columns={columns}
      dataSource={filtered}
      loading={isLoading}
      rowKey="id"
      pagination={{
        current: 1,
        pageSize: 20,
        total: filtered.length,
        onChange: () => {},
      }}
    />
  );
}
