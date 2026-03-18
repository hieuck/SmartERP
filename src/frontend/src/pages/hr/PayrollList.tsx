import StandardListPage from '@/components/common/StandardListPage';
import { formatDate } from '@/utils/responsive';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Select, Space, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Payslip {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  netSalary: number;
  status: string;
  paymentDate?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  submitted: 'processing',
  approved: 'cyan',
  paid: 'success',
  cancelled: 'error',
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function PayrollList() {
  const { t } = useTranslation('payroll');
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payslips', month, year],
    queryFn: async () => {
      const res = await axios.get(`/api/payroll/payslips/month/${year}/${month}`);
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => axios.patch(`/api/payroll/payslips/${id}/submit`),
    onSuccess: () => {
      message.success(t('messages.submitSuccess'));
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) =>
      axios.patch(`/api/payroll/payslips/${id}/mark-paid`, {
        paymentDate: new Date().toISOString(),
      }),
    onSuccess: () => {
      message.success(t('messages.markPaidSuccess'));
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
  });

  const payslips: Payslip[] = Array.isArray(data) ? data : [];
  const filtered = search
    ? payslips.filter((p) => p.employeeId.toLowerCase().includes(search.toLowerCase()))
    : payslips;

  const columns: ColumnsType<Payslip> = [
    { title: t('columns.employee'), dataIndex: 'employeeId', key: 'employeeId' },
    { title: t('columns.month'), dataIndex: 'month', key: 'month', width: 80 },
    { title: t('columns.year'), dataIndex: 'year', key: 'year', width: 80 },
    {
      title: t('columns.basicSalary'),
      dataIndex: 'basicSalary',
      key: 'basicSalary',
      align: 'right',
      render: (v: number) => v?.toLocaleString(),
    },
    {
      title: t('columns.netSalary'),
      dataIndex: 'netSalary',
      key: 'netSalary',
      align: 'right',
      render: (v: number) => v?.toLocaleString(),
    },
    {
      title: t('columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v] ?? 'default'}>{t(`status.${v}`, { defaultValue: v })}</Tag>
      ),
    },
    {
      title: t('columns.paymentDate'),
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (v?: string) => (v ? formatDate(v) : '-'),
    },
    {
      title: '',
      key: 'rowActions',
      width: 180,
      render: (_, record) => (
        <Space>
          {record.status === 'draft' && (
            <Button size="small" onClick={() => submitMutation.mutate(record.id)}>
              {t('actions.submit')}
            </Button>
          )}
          {record.status === 'approved' && (
            <Button size="small" type="primary" onClick={() => markPaidMutation.mutate(record.id)}>
              {t('actions.markPaid')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filters = (
    <Space>
      <Select
        value={month}
        onChange={setMonth}
        style={{ width: 100 }}
        options={MONTHS.map((m) => ({ value: m, label: m }))}
      />
      <Select
        value={year}
        onChange={setYear}
        style={{ width: 100 }}
        options={YEARS.map((y) => ({ value: y, label: y }))}
      />
    </Space>
  );

  return (
    <StandardListPage
      title={t('title')}
      createButtonText={t('createButton')}
      onCreateClick={() => {}}
      searchPlaceholder={t('searchPlaceholder')}
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
        showTotal: (tot) => t('messages.total', { total: tot }),
        onChange: () => {},
      }}
    />
  );
}
