import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Space, Select, DatePicker, Card } from 'antd';
import { SyncOutlined, ArrowUpOutlined, ArrowDownOutlined, SwapOutlined, ToolOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { formatDate } from '@/utils/responsive';
import inventoryServiceNew, { StockMovementType } from '@/services/inventory/inventoryService';
import { useResponsive } from '@/hooks/useResponsive';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface StockMovement {
  id: number;
  productId: number;
  product?: { id: number; name: string; sku: string };
  warehouseId: number;
  warehouse?: { id: number; name: string };
  type: StockMovementType;
  quantity: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  createdBy?: { id: number; name: string };
}

export default function StockMovementList() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { t } = useTranslation(['inventory', 'common']);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<StockMovementType | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', { page, pageSize, search, type: typeFilter, dateRange }],
    queryFn: () =>
      inventoryServiceNew.getMovements({
        page,
        limit: pageSize,
        search,
        type: typeFilter,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
      }),
  });

  const movementTypeConfig: Record<
    StockMovementType,
    { color: string; icon: React.ReactNode }
  > = {
    [StockMovementType.IN]: { color: 'green', icon: <ArrowDownOutlined /> },
    [StockMovementType.OUT]: { color: 'red', icon: <ArrowUpOutlined /> },
    [StockMovementType.TRANSFER]: { color: 'blue', icon: <SwapOutlined /> },
    [StockMovementType.ADJUSTMENT]: { color: 'orange', icon: <ToolOutlined /> },
  };

  const columns: ColumnsType<StockMovement> = [
    {
      title: t('inventory:columns.date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('inventory:columns.type'),
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: StockMovementType) => {
        const config = movementTypeConfig[type];
        return (
          <Tag color={config.color} icon={config.icon}>
            {t(`inventory:movements.type.${type}`)}
          </Tag>
        );
      },
    },
    {
      title: t('inventory:columns.sku'),
      dataIndex: ['product', 'sku'],
      key: 'sku',
      width: 120,
      render: (sku: string) => sku || '-',
    },
    {
      title: t('inventory:columns.product'),
      dataIndex: ['product', 'name'],
      key: 'product',
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: t('inventory:columns.warehouse'),
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      width: 150,
      render: (name: string) => name || '-',
    },
    {
      title: t('inventory:form.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (value: number, record: StockMovement) => {
        const isPositive = record.type === StockMovementType.IN;
        return (
          <span style={{ color: isPositive ? '#52c41a' : '#ff4d4f' }}>
            {isPositive ? '+' : '-'}
            {Math.abs(value).toLocaleString('vi-VN')}
          </span>
        );
      },
    },
    {
      title: t('inventory:columns.reference'),
      dataIndex: 'reference',
      key: 'reference',
      width: 150,
      render: (ref: string) => ref || '-',
    },
    {
      title: t('inventory:columns.performer'),
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      width: 150,
      render: (name: string) => name || '-',
    },
    {
      title: t('inventory:columns.notes'),
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
  ];

  const renderMobileItem = (record: StockMovement) => {
    const config = movementTypeConfig[record.type];
    const isPositive = record.type === StockMovementType.IN;
    
    return {
      title: record.product?.name || '-',
      subtitle: formatDate(record.createdAt),
      tags: [{ label: t(`inventory:movements.type.${record.type}`), color: config.color }],
      fields: [
        { label: t('inventory:columns.sku'), value: record.product?.sku || '-' },
        { 
          label: t('inventory:form.quantity'), 
          value: `${isPositive ? '+' : '-'}${Math.abs(record.quantity).toLocaleString('vi-VN')}` 
        },
        { label: t('inventory:columns.warehouse'), value: record.warehouse?.name || '-' },
        { label: t('inventory:columns.reference'), value: record.reference || '-' },
      ],
    };
  };

  const filterComponents = (
    <Space wrap>
      <Select
        placeholder={t('inventory:filters.type')}
        style={{ width: isMobile ? '100%' : 150 }}
        value={typeFilter}
        onChange={setTypeFilter}
        allowClear
      >
        <Select.Option value={StockMovementType.IN}>
          {t('inventory:movements.type.in')}
        </Select.Option>
        <Select.Option value={StockMovementType.OUT}>
          {t('inventory:movements.type.out')}
        </Select.Option>
        <Select.Option value={StockMovementType.TRANSFER}>
          {t('inventory:movements.type.transfer')}
        </Select.Option>
        <Select.Option value={StockMovementType.ADJUSTMENT}>
          {t('inventory:movements.type.adjustment')}
        </Select.Option>
      </Select>
      <RangePicker
        format="DD/MM/YYYY"
        style={{ width: isMobile ? '100%' : 'auto' }}
        onChange={(dates) => {
          if (dates) {
            setDateRange([dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')]);
          } else {
            setDateRange(undefined);
          }
        }}
      />
    </Space>
  );

  return (
    <div>
      <Card 
        size="small" 
        style={{ marginBottom: 16 }}
        extra={
          <Button onClick={() => navigate('/dashboard/inventory/stock')}>
            {t('inventory:movements.backToStock')}
          </Button>
        }
      >
        <Space>
          <SyncOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <span style={{ fontSize: 16, fontWeight: 500 }}>{t('inventory:movements.title')}</span>
        </Space>
      </Card>

      <StandardListPage
        title=""
        searchPlaceholder={t('inventory:searchPlaceholder')}
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterComponents}
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        mobileRenderItem={renderMobileItem}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => t('inventory:messages.totalTransactions', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />
    </div>
  );
}
