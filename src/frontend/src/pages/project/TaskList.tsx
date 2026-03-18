import StandardListPage from '@/components/common/StandardListPage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  assigneeId?: string;
  dueDate?: string;
  priority: string;
  status: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

const STATUS_COLORS: Record<string, string> = {
  todo: 'default',
  in_progress: 'processing',
  review: 'warning',
  done: 'success',
};

export default function TaskList() {
  const { t } = useTranslation('projects');
  const { id: projectId } = useParams<{ id: string }>();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const res = await axios.get(`/api/projects/${projectId}/tasks`);
      return res.data;
    },
    enabled: Boolean(projectId),
  });

  const _deleteMutation = useMutation({
    mutationFn: (taskId: string) => axios.delete(`/api/projects/${projectId}/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: () => message.error(t('messages.deleteError')),
  });

  const tasks: Task[] = Array.isArray(data) ? data : (data?.data ?? []);
  const filtered = search
    ? tasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase()))
    : tasks;

  const columns: ColumnsType<Task> = [
    { title: t('tasks.columns.title'), dataIndex: 'title', key: 'title' },
    { title: t('tasks.columns.assignee'), dataIndex: 'assigneeId', key: 'assigneeId' },
    { title: t('tasks.columns.dueDate'), dataIndex: 'dueDate', key: 'dueDate' },
    {
      title: t('tasks.columns.priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (v: string) => (
        <Tag color={PRIORITY_COLORS[v] ?? 'default'}>
          {t(`tasks.priority.${v}`, { defaultValue: v })}
        </Tag>
      ),
    },
    {
      title: t('tasks.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v] ?? 'default'}>
          {t(`tasks.status.${v}`, { defaultValue: v })}
        </Tag>
      ),
    },
  ];

  return (
    <StandardListPage
      title={t('tasks.title')}
      createButtonText={t('tasks.createButton')}
      onCreateClick={() => {}}
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
