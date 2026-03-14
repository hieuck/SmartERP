import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Tag, Select, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { formatDate } from '@/utils/responsive';
import warehouseService, { StockTransfer } from '@/services/inventory/warehouseService';
import { useResponsive } from '@/hooks/useResponsive';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

export default function StockTransferList() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { t } = useTranslation(['warehouses', 'common']);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['stockTransfers', { search, status, page, pageSize }],
    queryFn: () => warehouseService.getStockTransfers({ status }),
  });

  const statusColors: Record<string, string> = {
    draft: 'default',
    pending: 'processing',
    in_transit: 'warning',
    completed: 'success',
    cancelled: 'error',
  };

  const getActionMenu = (record: StockTransfer): MenuProps['items'] => [
    {
      key: 'view',
      label: t('warehouses:actions.viewDetail'),
      icon: <EyeOutlined />,
      onClick: () => navigate(`/warehouses/transfers/${record.id}`),
    },
  ];

  const columns: ColumnsType<StockTransfer> = [
    {
      title: t('warehouses:columns.code'),
      dataIndex: 'code',
      key: 'code',
      width: isMobile ? 90 : 120,
      render: (code: string, record: StockTransfer) => (
        <Button
          type="link"
          onClick={() => navigate(`/warehouses/transfers/${record.id}`)}
          style={{ padding: 0, fontSize: isMobile ? 12 : 14 }}
        >
          {code}
        </Button>
      ),
    },
    {
      title: t('warehouses:columns.fromWarehouse'),
      dataIndex: 'fromWarehouseName',
      key: 'fromWarehouseName',
      width: isMobile ? 100 : 150,
      ellipsis: true,
      render: (text: string) => <span style={{ fontSize: isMobile ? 12 : 14 }}>{text}</span>,
    },
    {
      title: t('warehouses:columns.toWarehouse'),
      dataIndex: 'toWarehouseName',
      key: 'toWarehouseName',
      width: isMobile ? 100 : 150,
      ellipsis: true,
      render: (text: string) => <span style={{ fontSize: isMobile ? 12 : 14 }}>{text}</span>,
    },
    {
      title: t('warehouses:columns.transferDate'),
      dataIndex: 'transferDate',
      key: 'transferDate',
      width: isMobile ? 90 : 120,
      render: (date: string) => (
        <span style={{ fontSize: isMobile ? 12 : 14 }}>{formatDate(date)}</span>
      ),
    },
    ...(!isMobile
      ? [
          {
            title: t('warehouses:columns.items'),
            dataIndex: 'items',
            key: 'items',
            width: 80,
            render: (items: any[]) => items?.length || 0,
          },
        ]
      : []),
    {
      title: t('warehouses:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 90 : 120,
      render: (status: string) => (
        <Tag color={statusColors[status]} style={{ fontSize: isMobile ? 11 : 12, margin: 0 }}>
          {t(`warehouses:status.${status}`)}
        </Tag>
      ),
    },
    ...(!isMobile
      ? [
          {
            title: t('warehouses:columns.createdBy'),
            dataIndex: 'createdByName',
            key: 'createdByName',
            width: 150,
          },
        ]
      : []),
  ];

  const renderMobileItem = (transfer: StockTransfer) => {
    return {
      title: transfer.code,
      subtitle: formatDate(transfer.transferDate),
      tags: [{ label: t(`warehouses:status.${transfer.status}`), color: statusColors[transfer.status] }],
      fields: [
        { 
          label: t('warehouses:transfer.from') + ' → ' + t('warehouses:transfer.to'), 
          value: `${transfer.fromWarehouseName || transfer.fromWarehouseId} → ${transfer.toWarehouseName || transfer.toWarehouseId}` 
        },
        { label: t('warehouses:columns.items'), value: transfer.items?.length || 0 },
      ],
      actions: getActionMenu(transfer),
    };
  };

  const filterComponents = (
    <Space wrap>
      <Select
        placeholder={t('warehouses:transfer.filters.status')}
        style={{ width: isMobile ? '100%' : 200 }}
        allowClear
        value={status}
        onChange={setStatus}
        size={isMobile ? 'middle' : 'middle'}
        options={[
          { label: t('warehouses:transfer.filters.draft'), value: 'draft' },
          { label: t('warehouses:transfer.filters.pending'), value: 'pending' },
          { label: t('warehouses:transfer.filters.in_transit'), value: 'in_transit' },
          { label: t('warehouses:transfer.filters.completed'), value: 'completed' },
          { label: t('warehouses:transfer.filters.cancelled'), value: 'cancelled' },
        ]}
      />
    </Space>
  );

  return (
    <StandardListPage
      title={t('warehouses:transfer.title')}
      createButtonText={t('warehouses:transfer.create')}
      onCreateClick={() => navigate('/warehouses/transfers/new')}
      searchPlaceholder={t('warehouses:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={filterComponents}
      columns={columns}
      dataSource={data?.data || []}
      loading={isLoading}
      mobileRenderItem={renderMobileItem}
      onMobileItemClick={(record) => navigate(`/warehouses/transfers/${record.id}`)}
      pagination={{
        current: page,
        pageSize,
        total: data?.meta?.total || 0,
        showSizeChanger: true,
        showTotal: (total) => t('warehouses:messages.totalTransfers', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
