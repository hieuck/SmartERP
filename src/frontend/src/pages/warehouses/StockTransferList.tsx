/**
 * Stock Transfer List Page
 * Displays and manages stock transfers between warehouses
 * Requirements: 27.3
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Space, Input, Tag, Card, Select, List, Dropdown } from 'antd';
import { PlusOutlined, EyeOutlined, SearchOutlined, MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import warehouseService, { StockTransfer } from '../../services/inventory/warehouseService';
import { useResponsive } from '../../hooks/useResponsive';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

const StockTransferList = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();

  // Fetch stock transfers
  const { data, isLoading } = useQuery({
    queryKey: ['stockTransfers', { search, status }],
    queryFn: () => warehouseService.getStockTransfers({ status }),
  });

  const statusColors: Record<string, string> = {
    draft: 'default',
    pending: 'processing',
    in_transit: 'warning',
    completed: 'success',
    cancelled: 'error',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    in_transit: 'In Transit',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const columns: ColumnsType<StockTransfer> = [
    {
      title: 'Code',
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
      title: 'From Warehouse',
      dataIndex: 'fromWarehouseName',
      key: 'fromWarehouseName',
      width: isMobile ? 100 : 150,
      ellipsis: true,
      render: (text: string) => <span style={{ fontSize: isMobile ? 12 : 14 }}>{text}</span>,
    },
    {
      title: 'To Warehouse',
      dataIndex: 'toWarehouseName',
      key: 'toWarehouseName',
      width: isMobile ? 100 : 150,
      ellipsis: true,
      render: (text: string) => <span style={{ fontSize: isMobile ? 12 : 14 }}>{text}</span>,
    },
    {
      title: 'Transfer Date',
      dataIndex: 'transferDate',
      key: 'transferDate',
      width: isMobile ? 90 : 120,
      render: (date: string) => (
        <span style={{ fontSize: isMobile ? 12 : 14 }}>{dayjs(date).format('DD/MM/YYYY')}</span>
      ),
    },
    ...(!isMobile
      ? [
          {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            width: 80,
            render: (items: any[]) => items?.length || 0,
          },
        ]
      : []),
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 90 : 120,
      render: (status: string) => (
        <Tag color={statusColors[status]} style={{ fontSize: isMobile ? 11 : 12, margin: 0 }}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    ...(!isMobile
      ? [
          {
            title: 'Created By',
            dataIndex: 'createdByName',
            key: 'createdByName',
            width: 150,
          },
        ]
      : []),
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? 60 : 100,
      fixed: isMobile ? false : ('right' as const),
      align: 'center' as const,
      render: (_: any, record: StockTransfer) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/warehouses/transfers/${record.id}`)}
          size="small"
        >
          {!isMobile && 'View'}
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={isMobile ? <div style={{ fontSize: 16 }}>Stock Transfers</div> : 'Stock Transfers'}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/warehouses/transfers/new')}
          size={isMobile ? 'middle' : 'middle'}
        >
          {isMobile ? '' : 'New Transfer'}
        </Button>
      }
      styles={{
        body: { padding: isMobile ? 8 : 24 },
        header: { paddingLeft: isMobile ? 12 : 24, paddingRight: isMobile ? 12 : 24 },
      }}
    >
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Space wrap size="small" style={{ width: '100%' }}>
          <Input
            placeholder="Search transfers..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: isMobile ? '100%' : 300 }}
            size={isMobile ? 'middle' : 'middle'}
          />
          <Select
            placeholder="Filter by status"
            style={{ width: isMobile ? '100%' : 200 }}
            allowClear
            value={status}
            onChange={setStatus}
            size={isMobile ? 'middle' : 'middle'}
            options={[
              { label: 'Draft', value: 'draft' },
              { label: 'Pending', value: 'pending' },
              { label: 'In Transit', value: 'in_transit' },
              { label: 'Completed', value: 'completed' },
              { label: 'Cancelled', value: 'cancelled' },
            ]}
          />
        </Space>
      </Space>

      {isMobile ? (
        /* Mobile: Card View */
        <List
          dataSource={data?.data || []}
          loading={isLoading}
          renderItem={(transfer: StockTransfer) => {
            const menuItems: MenuProps['items'] = [
              {
                key: 'view',
                label: 'Xem chi tiết',
                icon: <EyeOutlined />,
                onClick: () => navigate(`/warehouses/transfers/${transfer.id}`),
              },
            ];

            return (
              <Card
                size="small"
                style={{ marginBottom: 8 }}
                extra={
                  <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                }
              >
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Mã chuyển kho</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{transfer.code}</div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Từ kho → Đến kho</div>
                  <div style={{ fontSize: 14 }}>
                    Kho {transfer.fromWarehouseId} → Kho {transfer.toWarehouseId}
                  </div>
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Ngày chuyển</div>
                    <div style={{ fontSize: 13 }}>
                      {dayjs(transfer.transferDate).format('DD/MM/YYYY')}
                    </div>
                  </div>
                  <Tag color={statusColors[transfer.status]}>{statusLabels[transfer.status]}</Tag>
                </div>
              </Card>
            );
          }}
          pagination={{
            total: data?.meta?.total,
            pageSize: data?.meta?.limit,
            current: data?.meta?.page,
            showSizeChanger: false,
            simple: true,
            size: 'small',
          }}
        />
      ) : (
        /* Desktop: Table View */
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 'max-content' }}
          size="small"
          pagination={{
            total: data?.meta?.total,
            pageSize: data?.meta?.limit,
            current: data?.meta?.page,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} transfers`,
            size: 'default',
          }}
        />
      )}
    </Card>
  );
};

export default StockTransferList;
