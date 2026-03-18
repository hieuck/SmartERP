import StandardListPage from '@/components/common/StandardListPage';
import manufacturingService, { BOM, BOMType } from '@/services/manufacturing/manufacturing.service';
import { ApartmentOutlined, DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MenuProps } from 'antd';
import { Button, Dropdown, message, Modal, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function BOMList() {
  const navigate = useNavigate();
  const { t } = useTranslation('production');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [productIdFilter] = useState<string | undefined>();

  const { data: boms = [], isLoading } = useQuery({
    queryKey: ['boms', productIdFilter],
    queryFn: () =>
      productIdFilter
        ? manufacturingService.getBOMsByProduct(productIdFilter)
        : manufacturingService.getBOMs(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => manufacturingService.deleteBOM(id),
    onSuccess: () => {
      message.success(t('messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['boms'] });
    },
    onError: () => message.error(t('messages.deleteError')),
  });

  const filtered = boms.filter((bom) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      bom.reference.toLowerCase().includes(q) ||
      (bom.product?.name?.toLowerCase().includes(q) ?? false)
    );
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getActionMenu = (record: BOM): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('actions.edit'),
      onClick: () => navigate(`/dashboard/production/bom/${record.id}/edit`),
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

  const columns: ColumnsType<BOM> = [
    {
      title: t('bom.reference'),
      dataIndex: 'reference',
      key: 'reference',
      width: 160,
      render: (text: string, record: BOM) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => navigate(`/dashboard/production/bom/${record.id}/edit`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: t('workOrders.product'),
      key: 'product',
      ellipsis: true,
      render: (_: unknown, r: BOM) => r.product?.name || r.productId,
    },
    {
      title: t('bom.type'),
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: BOMType) => (
        <Tag color={type === BOMType.MANUFACTURE ? 'blue' : 'purple'}>{t(`bom.types.${type}`)}</Tag>
      ),
    },
    {
      title: t('bom.productQty'),
      dataIndex: 'productQty',
      key: 'productQty',
      width: 120,
      align: 'right',
    },
    {
      title: t('bom.linesCount'),
      key: 'linesCount',
      width: 100,
      align: 'center',
      render: (_: unknown, r: BOM) => r.lines?.length ?? 0,
    },
    {
      title: t('bom.totalCost'),
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 130,
      align: 'right',
      render: (v: number) => (v != null ? v.toLocaleString() : '-'),
    },
    {
      title: t('bom.isActive'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>
          {v ? t('workCenter.active') : t('workCenter.inactive')}
        </Tag>
      ),
    },
    {
      title: t('actions.actions'),
      key: 'actions',
      width: 60,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, record: BOM) => (
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
          <ApartmentOutlined />
          {t('bom.title')}
        </Space>
      }
      createButtonText={t('bom.create')}
      onCreateClick={() => navigate('/dashboard/production/bom/new')}
      searchPlaceholder={t('bom.searchPlaceholder')}
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
