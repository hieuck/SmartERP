import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Card, Alert, Space } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import inventoryServiceNew from '@/services/inventory/inventoryService';
import { useResponsive } from '@/hooks/useResponsive';
import type { ColumnsType } from 'antd/es/table';

interface LowStock {
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

export default function LowStockAlert() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { t } = useTranslation(['inventory', 'common']);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['low-stock', { page, pageSize }],
    queryFn: () => inventoryServiceNew.getLowStock({ page, limit: pageSize }),
  });

  const getStockLevel = (stock: LowStock) => {
    const percentage = (stock.availableQuantity / stock.minQuantity) * 100;
    if (percentage <= 25) {
      return { color: 'red', level: 'critical' };
    }
    if (percentage <= 50) {
      return { color: 'orange', level: 'warning' };
    }
    return { color: 'yellow', level: 'info' };
  };

  const columns: ColumnsType<LowStock> = [
    {
      title: t('inventory:columns.level'),
      key: 'level',
      width: 100,
      render: (_: any, record: LowStock) => {
        const level = getStockLevel(record);
        return (
          <Tag color={level.color}>
            {t(`inventory:lowStock.level.${level.level}`)}
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
      title: t('inventory:columns.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {value.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: t('inventory:columns.reserved'),
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 100,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: t('inventory:columns.available'),
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {value.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: t('inventory:columns.minQuantity'),
      dataIndex: 'minQuantity',
      key: 'minQuantity',
      width: 120,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: t('inventory:columns.needed'),
      key: 'needed',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: LowStock) => {
        const needed = Math.max(0, record.maxQuantity - record.availableQuantity);
        return (
          <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
            {needed.toLocaleString('vi-VN')}
          </span>
        );
      },
    },
  ];

  const renderMobileItem = (record: LowStock) => {
    const level = getStockLevel(record);
    const needed = Math.max(0, record.maxQuantity - record.availableQuantity);
    
    return {
      title: record.product?.name || '-',
      subtitle: record.product?.sku || '-',
      tags: [{ label: t(`inventory:lowStock.level.${level.level}`), color: level.color }],
      fields: [
        { label: t('inventory:columns.warehouse'), value: record.warehouse?.name || '-' },
        { label: t('inventory:columns.quantity'), value: record.quantity.toLocaleString('vi-VN') },
        { label: t('inventory:columns.available'), value: record.availableQuantity.toLocaleString('vi-VN') },
        { label: t('inventory:columns.minQuantity'), value: record.minQuantity.toLocaleString('vi-VN') },
        { label: t('inventory:columns.needed'), value: needed.toLocaleString('vi-VN') },
      ],
    };
  };

  const criticalCount =
    data?.data?.filter((item: LowStock) => getStockLevel(item).level === 'critical').length || 0;

  const warningCount =
    data?.data?.filter((item: LowStock) => getStockLevel(item).level === 'warning').length || 0;

  return (
    <div>
      <Card 
        size="small" 
        style={{ marginBottom: 16 }}
        extra={
          <Button onClick={() => navigate('/dashboard/inventory/stock')}>
            {t('inventory:lowStock.backToStock')}
          </Button>
        }
      >
        <Space>
          <WarningOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
          <span style={{ fontSize: 16, fontWeight: 500 }}>{t('inventory:lowStock.title')}</span>
        </Space>
      </Card>

      {(criticalCount > 0 || warningCount > 0) && (
        <Alert
          message={t('inventory:lowStock.alertMessage')}
          description={
            <Space direction="vertical">
              {criticalCount > 0 && (
                <div>
                  <Tag color="red">{t('inventory:lowStock.level.critical')}</Tag>
                  {t('inventory:lowStock.criticalAlert', { count: criticalCount })}
                </div>
              )}
              {warningCount > 0 && (
                <div>
                  <Tag color="orange">{t('inventory:lowStock.level.warning')}</Tag>
                  {t('inventory:lowStock.warningAlert', { count: warningCount })}
                </div>
              )}
            </Space>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <StandardListPage
        title=""
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        mobileRenderItem={renderMobileItem}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => t('inventory:messages.totalProducts', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />

      <style>{`
        .row-critical {
          background-color: #fff1f0;
        }
        .row-critical:hover > td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
}
