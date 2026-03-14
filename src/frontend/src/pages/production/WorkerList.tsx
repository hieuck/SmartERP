/**
 * Worker List Page
 * Displays and manages production workers
 * Requirements: 31.1
 */

import { useState } from 'react';
import { Button, Space, Tag, message, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import productionService, { Worker } from '@/services/production/productionService';
import { formatDate } from '@/utils/responsive';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

export default function WorkerList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();

  const { data, isLoading } = useQuery({
    queryKey: ['workers', { search, status: statusFilter }],
    queryFn: async () => {
      const response = await productionService.worker.getWorkers({ search, status: statusFilter });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productionService.worker.deleteWorker(id),
    onSuccess: () => {
      message.success(t('production:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
    onError: () => {
      message.error(t('production:messages.deleteError'));
    },
  });

  const skillLevelColors: Record<string, string> = {
    apprentice: 'default',
    skilled: 'blue',
    master: 'gold',
  };

  const columns: ColumnsType<Worker> = [
    {
      title: t('production:workers.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: t('production:workers.fullName'),
      dataIndex: 'fullName',
      key: 'fullName',
      ellipsis: true,
    },
    {
      title: t('production:workers.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: t('production:workers.specialty'),
      dataIndex: 'specialty',
      key: 'specialty',
      width: 130,
      render: (specialty: string) => t(`production:workers.specialties.${specialty}`),
    },
    {
      title: t('production:workers.skillLevel'),
      dataIndex: 'skillLevel',
      key: 'skillLevel',
      width: 130,
      render: (level: string) => (
        <Tag color={skillLevelColors[level]}>{t(`production:workers.skillLevels.${level}`)}</Tag>
      ),
    },
    {
      title: t('production:workers.hireDate'),
      dataIndex: 'hireDate',
      key: 'hireDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('production:workers.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {t(`production:workers.statuses.${status}`)}
        </Tag>
      ),
    },
  ];

  const filterComponents = (
    <Select
      placeholder={t('production:filters.status')}
      style={{ width: 150 }}
      allowClear
      value={statusFilter}
      onChange={setStatusFilter}
    >
      <Option value="active">{t('production:workers.statuses.active')}</Option>
      <Option value="inactive">{t('production:workers.statuses.inactive')}</Option>
    </Select>
  );

  return (
    <StandardListPage
      title={t('production:workers.list')}
      createButtonText={t('production:workers.create')}
      onCreateClick={() => navigate('/dashboard/production/workers/new')}
      searchPlaceholder={t('production:workers.searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={filterComponents}
      columns={columns}
      dataSource={data || []}
      loading={isLoading || deleteMutation.isPending}
      onEdit={(record) => navigate(`/dashboard/production/workers/${record.id}`)}
      onDelete={(record) => deleteMutation.mutate(record.id)}
      deleteConfirmTitle={t('production:messages.deleteConfirm')}
      pagination={{
        current: 1,
        pageSize: 10,
        total: data?.length || 0,
        showTotal: (total: number) => t('production:messages.total', { total }),
        onChange: () => {},
      }}
    />
  );
}
