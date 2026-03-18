import StandardListPage from '@/components/common/StandardListPage';
import { formatDate } from '@/utils/responsive';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Space, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

export default function LeaveList() {
  const navigate = useNavigate();
  const { t } = useTranslation('leave');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const res = await axios.get('/api/leave/pending');
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => axios.post('/api/leave/approve', { leaveId: id }),
    onSuccess: () => {
      message.success(t('messages.approveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
    onError: () => message.error(t('messages.approveError')),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      axios.post('/api/leave/reject', { leaveId: id, rejectionReason: 'Rejected' }),
    onSuccess: () => {
      message.success(t('messages.rejectSuccess'));
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
    onError: () => message.error(t('messages.rejectError')),
  });

  const leaves: LeaveRequest[] = Array.isArray(data) ? data : [];
  const filtered = search
    ? leaves.filter((l) => l.employeeId.toLowerCase().includes(search.toLowerCase()))
    : leaves;

  const columns: ColumnsType<LeaveRequest> = [
    { title: t('columns.employee'), dataIndex: 'employeeId', key: 'employeeId' },
    {
      title: t('columns.leaveType'),
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (v: string) => t(`leaveType.${v}`, { defaultValue: v }),
    },
    {
      title: t('columns.startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      render: (v: string) => formatDate(v),
    },
    {
      title: t('columns.endDate'),
      dataIndex: 'endDate',
      key: 'endDate',
      render: (v: string) => formatDate(v),
    },
    { title: t('columns.reason'), dataIndex: 'reason', key: 'reason', ellipsis: true },
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
      title: '',
      key: 'actions',
      width: 160,
      render: (_, record) =>
        record.status === 'pending' ? (
          <Space>
            <Button size="small" type="primary" onClick={() => approveMutation.mutate(record.id)}>
              {t('actions.approve')}
            </Button>
            <Button size="small" danger onClick={() => rejectMutation.mutate(record.id)}>
              {t('actions.reject')}
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <StandardListPage
      title={t('title')}
      createButtonText={t('createButton')}
      onCreateClick={() => navigate('/dashboard/hr/leave/new')}
      searchPlaceholder={t('searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
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
