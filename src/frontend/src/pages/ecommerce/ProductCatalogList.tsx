import StandardListPage from '@/components/common/StandardListPage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Space, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface EcommerceProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  stockQuantity: number;
  isPublished: boolean;
}

export default function ProductCatalogList() {
  const { t } = useTranslation('ecommerce');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['ecommerce-products', search],
    queryFn: async () => {
      const res = await axios.get('/api/ecommerce/products', { params: { search } });
      return res.data;
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => axios.patch(`/api/ecommerce/products/${id}/publish`),
    onSuccess: () => {
      message.success(t('catalog.messages.publishSuccess'));
      queryClient.invalidateQueries({ queryKey: ['ecommerce-products'] });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => axios.patch(`/api/ecommerce/products/${id}/unpublish`),
    onSuccess: () => {
      message.success(t('catalog.messages.unpublishSuccess'));
      queryClient.invalidateQueries({ queryKey: ['ecommerce-products'] });
    },
  });

  const products: EcommerceProduct[] = Array.isArray(data) ? data : (data?.data ?? []);

  const columns: ColumnsType<EcommerceProduct> = [
    { title: t('catalog.columns.sku'), dataIndex: 'sku', key: 'sku', width: 120 },
    { title: t('catalog.columns.name'), dataIndex: 'name', key: 'name' },
    {
      title: t('catalog.columns.price'),
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => v?.toLocaleString(),
    },
    {
      title: t('catalog.columns.stock'),
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
    },
    {
      title: t('catalog.columns.status'),
      dataIndex: 'isPublished',
      key: 'isPublished',
      width: 120,
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'default'}>
          {v ? t('catalog.status.published') : t('catalog.status.unpublished')}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          {record.isPublished ? (
            <Button size="small" onClick={() => unpublishMutation.mutate(record.id)}>
              {t('catalog.actions.unpublish')}
            </Button>
          ) : (
            <Button size="small" type="primary" onClick={() => publishMutation.mutate(record.id)}>
              {t('catalog.actions.publish')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <StandardListPage
      title={t('catalog.title')}
      createButtonText={t('catalog.createButton')}
      onCreateClick={() => navigate('/dashboard/ecommerce/products/new')}
      searchPlaceholder={t('catalog.searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={products}
      loading={isLoading}
      rowKey="id"
      pagination={{
        current: 1,
        pageSize: 20,
        total: products.length,
        showTotal: (tot) => t('catalog.messages.total', { total: tot }),
        onChange: () => {},
      }}
    />
  );
}
