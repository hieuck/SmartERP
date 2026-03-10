import React, { useState } from 'react';
import { Table, Button, Space, Tag, Card, message, Typography, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { WarningOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import inventoryServiceNew from '../../services/inventory/inventoryService';

const { Title, Text } = Typography;

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

const LowStockAlert: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['low-stock', { page, pageSize }],
    queryFn: () => inventoryServiceNew.getLowStock({ page, limit: pageSize }),
  });

  const getStockLevel = (stock: LowStock) => {
    const percentage = (stock.availableQuantity / stock.minQuantity) * 100;
    if (percentage <= 25) {
      return { color: 'red', text: 'Rất thấp', level: 'critical' };
    }
    if (percentage <= 50) {
      return { color: 'orange', text: 'Thấp', level: 'warning' };
    }
    return { color: 'yellow', text: 'Gần hết', level: 'info' };
  };

  const columns: ColumnsType<LowStock> = [
    {
      title: 'Mức độ',
      key: 'level',
      width: 100,
      render: (_: any, record: LowStock) => {
        const level = getStockLevel(record);
        return <Tag color={level.color}>{level.text}</Tag>;
      },
    },
    {
      title: 'SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      width: 120,
      render: (sku: string) => sku || '-',
    },
    {
      title: 'Sản phẩm',
      dataIndex: ['product', 'name'],
      key: 'product',
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: 'Kho',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      width: 150,
      render: (name: string) => name || '-',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {value.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Đã đặt',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      width: 100,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Khả dụng',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {value.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Tồn tối thiểu',
      dataIndex: 'minQuantity',
      key: 'minQuantity',
      width: 120,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Cần nhập',
      key: 'needed',
      width: 100,
      align: 'right',
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

  const criticalCount = data?.data?.filter((item: LowStock) => 
    getStockLevel(item).level === 'critical'
  ).length || 0;

  const warningCount = data?.data?.filter((item: LowStock) => 
    getStockLevel(item).level === 'warning'
  ).length || 0;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <WarningOutlined style={{ color: '#ff4d4f' }} /> Cảnh báo tồn kho thấp
            </Title>
            <Button onClick={() => navigate('/dashboard/inventory/stock')}>
              Quay lại tồn kho
            </Button>
          </div>

          {(criticalCount > 0 || warningCount > 0) && (
            <Alert
              message="Cảnh báo tồn kho"
              description={
                <Space direction="vertical">
                  {criticalCount > 0 && (
                    <Text>
                      <Tag color="red">Rất thấp</Tag>
                      {criticalCount} sản phẩm cần nhập hàng gấp
                    </Text>
                  )}
                  {warningCount > 0 && (
                    <Text>
                      <Tag color="orange">Thấp</Tag>
                      {warningCount} sản phẩm sắp hết hàng
                    </Text>
                  )}
                </Space>
              }
              type="warning"
              showIcon
              icon={<WarningOutlined />}
            />
          )}

          <Table
            columns={columns}
            dataSource={data?.data || []}
            loading={isLoading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total: data?.meta?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} sản phẩm cần chú ý`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
            }}
            scroll={{ x: 1200 }}
            rowClassName={(record) => {
              const level = getStockLevel(record);
              return level.level === 'critical' ? 'row-critical' : '';
            }}
          />
        </Space>
      </Card>

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
};

export default LowStockAlert;
