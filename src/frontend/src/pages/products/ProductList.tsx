import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Space, Card, Tag, Popconfirm, message, Typography } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../hooks/useResponsive';
import { productService } from '../../services/inventory/productService';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  categoryId: number;
  category?: { id: number; name: string };
  createdAt: string;
}

export default function ProductList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation(['products', 'common']);
  const { isMobile, isTablet } = useResponsive();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, pageSize, search }],
    queryFn: () => productService.getAll({ page, limit: pageSize, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productService.delete(id),
    onSuccess: () => {
      message.success(t('common:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      message.error(t('products:messages.deleteError'));
    },
  });

  // Format currency based on locale
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: i18n.language === 'vi' ? 'VND' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns: ColumnsType<Product> = [
    {
      title: t('products:form.sku'),
      dataIndex: 'sku',
      key: 'sku',
      width: isMobile ? 100 : 120,
    },
    {
      title: t('products:form.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('products:form.category'),
      dataIndex: ['category', 'name'],
      key: 'category',
      width: isMobile ? 100 : 150,
      render: (name: string) => name || '-',
    },
    {
      title: t('products:form.price'),
      dataIndex: 'price',
      key: 'price',
      width: isMobile ? 100 : 120,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('products:form.cost'),
      dataIndex: 'cost',
      key: 'cost',
      width: isMobile ? 100 : 120,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('products:form.stock'),
      dataIndex: 'stock',
      key: 'stock',
      width: isMobile ? 80 : 100,
      render: (stock: number, record: Product) => (
        <Tag color={stock <= record.lowStockThreshold ? 'red' : 'green'}>{stock}</Tag>
      ),
    },
    {
      title: t('common:labels.actions'),
      key: 'action',
      width: isMobile ? 100 : 120,
      fixed: isMobile ? undefined : 'right',
      render: (_: any, record: Product) => (
        <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
          <Button
            type="link"
            size={isMobile ? 'small' : 'middle'}
            icon={<EditOutlined />}
            onClick={() => navigate(`/dashboard/products/${record.id}`)}
          >
            {!isMobile && t('common:buttons.edit')}
          </Button>
          <Popconfirm
            title={t('products:messages.deleteConfirm')}
            description={t('products:messages.deleteDescription')}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText={t('common:buttons.delete')}
            cancelText={t('common:buttons.cancel')}
          >
            <Button
              type="link"
              danger
              size={isMobile ? 'small' : 'middle'}
              icon={<DeleteOutlined />}
            >
              {!isMobile && t('common:buttons.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : isTablet ? 16 : 24 }}>
      <Card size={isMobile ? 'small' : 'default'}>
        <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 'small' : 'large'}>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 12 : 0,
            }}
          >
            <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              <AppstoreOutlined /> {t('products:list.title')}
            </Title>
            <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
              <Button
                style={{ width: isMobile ? '100%' : 'auto' }}
                onClick={() => navigate('/dashboard/products/categories')}
              >
                {t('products:categories.manage')}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ width: isMobile ? '100%' : 'auto' }}
                onClick={() => navigate('/dashboard/products/new')}
              >
                {t('products:form.create')}
              </Button>
            </Space>
          </div>

          <Input
            placeholder={t('products:list.search')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: isMobile ? '100%' : 300 }}
            allowClear
            size={isMobile ? 'middle' : 'large'}
          />

          <Table
            columns={columns}
            dataSource={data?.data || []}
            loading={isLoading}
            rowKey="id"
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              current: page,
              pageSize,
              total: data?.meta?.total || 0,
              showSizeChanger: !isMobile,
              showTotal: (total) => t('products:list.total', { total }),
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
              simple: isMobile,
            }}
            scroll={{ x: isMobile ? 800 : 1000 }}
          />
        </Space>
      </Card>
    </div>
  );
}
