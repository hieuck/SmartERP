import StandardListPage from '@/components/common/StandardListPage';
import manufacturingService, { WorkCenter } from '@/services/manufacturing/manufacturing.service';
import { DeleteOutlined, EditOutlined, MoreOutlined, SettingOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MenuProps } from 'antd';
import { App, Button, Dropdown, Modal, Space, Switch, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function WorkCenterList() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t } = useTranslation('production');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: workCenters = [], isLoading } = useQuery({
    queryKey: ['work-centers'],
    queryFn: () => manufacturingService.getWorkCenters(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => manufacturingService.deleteWorkCenter(id),
    onSuccess: () => {
      message.success(t('messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-centers'] });
    },
    onError: () => message.error(t('messages.deleteError')),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      manufacturingService.updateWorkCenter(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-centers'] });
    },
    onError: () => message.error(t('messages.saveError')),
  });

  const filtered = workCenters.filter((wc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return wc.code.toLowerCase().includes(q) || wc.name.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getActionMenu = (record: WorkCenter): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('actions.edit'),
      onClick: () => navigate(`/dashboard/production/work-centers/${record.id}/edit`),
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('actions.delete'),
      danger: true,
      onClick: () =>
        Modal.confirm({
          title: t('messages.deleteConfirm'),
          onOk: () => deleteMutation.mutate(record.id),
        }),
    },
  ];

  const columns: ColumnsType<WorkCenter> = [
    {
      title: t('workCenter.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text: string, record: WorkCenter) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => navigate(`/dashboard/production/work-centers/${record.id}/edit`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: t('workCenter.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('workCenter.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v?: string) => v || '-',
    },
    {
      title: t('workCenter.timeEfficiency'),
      dataIndex: 'timeEfficiency',
      key: 'timeEfficiency',
      width: 140,
      align: 'right',
      render: (v: number) => `${v}%`,
    },
    {
      title: t('workCenter.capacityPerCycle'),
      dataIndex: 'capacityPerCycle',
      key: 'capacityPerCycle',
      width: 140,
      align: 'right',
    },
    {
      title: t('workCenter.costPerHour'),
      dataIndex: 'costPerHour',
      key: 'costPerHour',
      width: 130,
      align: 'right',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: t('workCenter.isActive'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center',
      render: (isActive: boolean, record: WorkCenter) => (
        <Switch
          checked={isActive}
          size="small"
          onChange={(checked) => toggleActiveMutation.mutate({ id: record.id, isActive: checked })}
        />
      ),
    },
    {
      title: t('workCenter.status'),
      dataIndex: 'isActive',
      key: 'status',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? t('workCenter.active') : t('workCenter.inactive')}
        </Tag>
      ),
    },
    {
      title: t('actions.actions'),
      key: 'actions',
      width: 60,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, record: WorkCenter) => (
        <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <StandardListPage
      title={
        <Space>
          <SettingOutlined />
          {t('workCenter.title')}
        </Space>
      }
      createButtonText={t('workCenter.create')}
      onCreateClick={() => navigate('/dashboard/production/work-centers/new')}
      searchPlaceholder={t('workCenter.searchPlaceholder')}
      searchValue={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
      columns={columns}
      dataSource={paginated}
      loading={isLoading}
      rowKey="id"
      scroll={{ x: 900 }}
      pagination={{
        current: page,
        pageSize,
        total: filtered.length,
        showSizeChanger: true,
        showTotal: (total) => t('messages.total', { total }),
        onChange: (p, ps) => {
          setPage(p);
          setPageSize(ps);
        },
      }}
    />
  );
}
