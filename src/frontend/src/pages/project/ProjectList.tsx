import StandardListPage from '@/components/common/StandardListPage';
import { formatDate } from '@/utils/responsive';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message, Progress, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  planning: 'blue',
  active: 'success',
  on_hold: 'warning',
  completed: 'cyan',
  cancelled: 'error',
};

export default function ProjectList() {
  const navigate = useNavigate();
  const { t } = useTranslation('projects');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await axios.get('/api/projects');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/projects/${id}`),
    onSuccess: () => {
      message.success(t('messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => message.error(t('messages.deleteError')),
  });

  const projects: Project[] = Array.isArray(data) ? data : [];
  const filtered = search
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.code?.toLowerCase().includes(search.toLowerCase()),
      )
    : projects;

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Project> = [
    { title: t('columns.code'), dataIndex: 'code', key: 'code', width: 120 },
    { title: t('columns.name'), dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: t('columns.startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: t('columns.endDate'),
      dataIndex: 'endDate',
      key: 'endDate',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: t('columns.budget'),
      dataIndex: 'budget',
      key: 'budget',
      align: 'right',
      width: 120,
      render: (v: number) => v?.toLocaleString() ?? '-',
    },
    {
      title: t('columns.progress'),
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (v: number) => <Progress percent={v ?? 0} size="small" />,
    },
    {
      title: t('columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v] ?? 'default'}>{t(`status.${v}`, { defaultValue: v })}</Tag>
      ),
    },
  ];

  return (
    <StandardListPage
      title={t('title')}
      createButtonText={t('createButton')}
      onCreateClick={() => navigate('/dashboard/projects/new')}
      searchPlaceholder={t('searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={paginated}
      loading={isLoading}
      rowKey="id"
      onEdit={(r) => navigate(`/dashboard/projects/${r.id}`)}
      onDelete={(r) => deleteMutation.mutate(r.id)}
      deleteConfirmTitle={t('messages.deleteConfirm')}
      pagination={{
        current: page,
        pageSize,
        total: filtered.length,
        showTotal: (tot) => t('messages.total', { total: tot }),
        onChange: (p, ps) => {
          setPage(p);
          setPageSize(ps);
        },
      }}
    />
  );
}
