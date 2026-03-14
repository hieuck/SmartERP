/**
 * Stock List Page
 * Displays inventory stock levels with warehouse filtering
 * Uses StandardListPage for consistent UI
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Select, Space, Button } from 'antd';
import { InboxOutlined, WarningOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import inventoryServiceNew from '@/services/inventory/inventoryService';
import StandardListPage from '@/components/common/StandardListPage';
import { formatNumber } from '@/utils/responsive';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface Stock {
  id: number;
  productId: number;
  product?: { id: number; name: string; sku: string };
  warehouseId: number;
  warehouse?: { id: number; name: string };
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  lastUpdated: string;
}

export default function StockList() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['inventory', 'commonUi']);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', { page, pageSize, search, warehouseId: warehouseFilter }],
    queryFn: () =>
      inventoryServiceNew.getAll({ page, limit: pageSize, search, warehouseId: warehouseFilter }),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryServiceNew.getAll({ limit: 100 }),
  });

  const getStockStatus = (stock: Stock) => {
    if (stock.availableQuantity <= stock.minQuantity) {
      return { color: 'red', text: t('inventory:status.low') };
    }
    if (stock.availableQuantity >= stock.maxQuantity) {
      return { color: 'orange', text: t('inventory:status.high') };
    }
    return { color: 'green', text: t('inventory:status.normal') };
  };

  const columns: ColumnsType<Stock> = [
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
      title: t('inventory:columns.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value: number) => formatNumber(value, i18n.language),
    },
    {
      title: t('inventory:columns.reservedQuantity'),
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 100,
      align: 'right',
      render: (value: number) => formatNumber(value, i18n.language),
    },
    {
      title: t('inventory:columns.availableQuantity'),
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
      align: 'right',
      render: (value: number, record: Stock) => {
        const status = getStockStatus(record);
        return (
          <span style={{ color: status.color === 'red' ? '#ff4d4f' : undefined }}>
            {formatNumber(value, i18n.language)}
          </span>
        );
      },
    },
    {
      title: t('inventory:columns.minMax'),
      key: 'minMax',
      width: 120,
      align: 'center',
      render: (_: any, record: Stock) => (
        <span style={{ fontSize: 12 }}>
          {record.minQuantity} / {record.maxQuantity}
        </span>
      ),
    },
    {
      title: t('inventory:columns.status'),
      key: 'status',
      width: 120,
      render: (_: any, record: Stock) => {
        const status = getStockStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
  ];

  return (
    <StandardListPage
      title={
        <>
          <InboxOutlined /> {t('inventory:title')}
        </>
      }
      extraActions={
        <Space>
          <Button onClick={() => navigate('/dashboard/inventory/movements')}>
            {t('inventory:actions.movements')}
          </Button>
          <Button
            danger
            icon={<WarningOutlined />}
            onClick={() => navigate('/dashboard/inventory/low-stock')}
          >
            {t('inventory:actions.lowStock')}
          </Button>
        </Space>
      }
      searchPlaceholder={t('inventory:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      filters={
        <Select
          placeholder={t('inventory:filters.warehouse')}
          style={{ width: 200 }}
          value={warehouseFilter}
          onChange={setWarehouseFilter}
          allowClear
        >
          {warehouses?.data?.map((w: any) => (
            <Option key={w.id} value={w.id}>
              {w.warehouse?.name || `${t('inventory:filters.warehouse')} ${w.id}`}
            </Option>
          ))}
        </Select>
      }
      columns={columns}
      dataSource={data?.data || []}
      loading={isLoading}
      rowKey="id"
      pagination={{
        current: page,
        pageSize,
        total: data?.meta?.total || 0,
        showTotal: (total) => t('inventory:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
