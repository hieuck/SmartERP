import StandardListPage from '@/components/common/StandardListPage';
import { useQuery } from '@tanstack/react-query';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EcommerceOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  confirmed: 'blue',
  processing: 'processing',
  shipped: 'cyan',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'default',
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'warning',
  paid: 'success',
  failed: 'error',
  refunded: 'default',
};

export default function EcommerceOrderList() {
  const { t } = useTranslation('ecommerce');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ecommerce-orders'],
    queryFn: async () => {
      const res = await axios.get('/api/orders');
      return res.data;
    },
  });

  const orders: EcommerceOrder[] = Array.isArray(data) ? data : (data?.data ?? []);
  const filtered = search
    ? orders.filter((o) => o.orderNumber?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  const columns: ColumnsType<EcommerceOrder> = [
    {
      title: t('orders.columns.orderNumber'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
    },
    { title: t('orders.columns.customer'), dataIndex: 'customerId', key: 'customerId' },
    {
      title: t('orders.columns.total'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => v?.toLocaleString(),
    },
    {
      title: t('orders.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v] ?? 'default'}>
          {t(`orders.status.${v}`, { defaultValue: v })}
        </Tag>
      ),
    },
    {
      title: t('orders.columns.paymentStatus'),
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 130,
      render: (v: string) => (
        <Tag color={PAYMENT_COLORS[v] ?? 'default'}>
          {t(`orders.paymentStatus.${v}`, { defaultValue: v })}
        </Tag>
      ),
    },
    {
      title: t('orders.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : ''),
    },
  ];

  return (
    <StandardListPage
      title={t('orders.title')}
      searchPlaceholder={t('orders.searchPlaceholder')}
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
        showTotal: (tot) => t('orders.messages.total', { total: tot }),
        onChange: () => {},
      }}
    />
  );
}
