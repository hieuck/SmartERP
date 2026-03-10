/**
 * Production Order List Page
 * Displays and manages production orders
 * Requirements: 37.1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Space, Tag, message, Select, Progress, Popconfirm, Dropdown } from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import StandardListPage from '../../components/common/StandardListPage';
import MobileListCard from '../../components/common/MobileListCard';
import { COLUMN_WIDTHS, formatDate } from '../../constants/ui';
import productionService, { ProductionOrder } from '../../services/production/productionService';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;

const ProductionOrderList = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();

  // Fetch production orders
  const { data, isLoading } = useQuery({
    queryKey: ['production-orders', { search, status }],
    queryFn: async () => {
      const response = await productionService.productionOrder.getProductionOrders({
        search,
        status,
      });
      return response.data;
    },
  });

  // Start order mutation
  const startMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.productionOrder.startProductionOrder(id);
      return response.data;
    },
    onSuccess: () => {
      message.success('Bắt đầu lệnh sản xuất thành công');
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
    },
    onError: () => {
      message.error('Bắt đầu lệnh sản xuất thất bại');
    },
  });

  // Complete order mutation
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.productionOrder.completeProductionOrder(id);
      return response.data;
    },
    onSuccess: () => {
      message.success('Hoàn thành lệnh sản xuất thành công');
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
    },
    onError: () => {
      message.error('Hoàn thành lệnh sản xuất thất bại');
    },
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.productionOrder.cancelProductionOrder(id);
      return response.data;
    },
    onSuccess: () => {
      message.success('Hủy lệnh sản xuất thành công');
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
    },
    onError: () => {
      message.error('Hủy lệnh sản xuất thất bại');
    },
  });

  const statusColors: Record<string, string> = {
    draft: 'default',
    in_progress: 'blue',
    paused: 'orange',
    completed: 'green',
    cancelled: 'red',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Nháp',
    in_progress: 'Đang thực hiện',
    paused: 'Tạm dừng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const columns: ColumnsType<ProductionOrder> = [
    {
      title: 'Mã lệnh',
      dataIndex: 'code',
      key: 'code',
      width: COLUMN_WIDTHS.code,
    },
    {
      title: 'Sản phẩm',
      dataIndex: ['product', 'name'],
      key: 'product',
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 150,
      render: (_: any, record: ProductionOrder) => (
        <div>
          <div>
            {record.producedQuantity} / {record.quantity}
          </div>
          <Progress
            percent={Math.round((record.producedQuantity / record.quantity) * 100)}
            size="small"
            status={record.status === 'completed' ? 'success' : 'active'}
          />
        </div>
      ),
    },
    {
      title: 'Lỗi/Phế phẩm',
      key: 'defects',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: ProductionOrder) => (
        <span style={{ color: record.defectQuantity > 0 ? '#ff4d4f' : undefined }}>
          {record.defectQuantity + record.wasteQuantity}
        </span>
      ),
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      width: COLUMN_WIDTHS.date,
      render: formatDate,
    },
    {
      title: 'Ngày dự kiến',
      dataIndex: 'expectedEndDate',
      key: 'expectedEndDate',
      width: COLUMN_WIDTHS.date,
      render: formatDate,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: isMobile ? 60 : 200,
      render: (_: any, record: ProductionOrder) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/production/orders/${record.id}`)}
          >
            Chi tiết
          </Button>
          {record.status === 'draft' && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => startMutation.mutate(record.id)}
            >
              Bắt đầu
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Popconfirm
              title="Xác nhận hoàn thành lệnh sản xuất?"
              onConfirm={() => completeMutation.mutate(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="link" icon={<CheckCircleOutlined />} size="small">
                Hoàn thành
              </Button>
            </Popconfirm>
          )}
          {(record.status === 'draft' || record.status === 'in_progress') && (
            <Popconfirm
              title="Bạn có chắc muốn hủy lệnh này?"
              onConfirm={() => cancelMutation.mutate(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="link" danger size="small">
                Hủy
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const renderMobileItem = (order: ProductionOrder) => {
    const menuItems: MenuProps['items'] = [
      {
        key: 'detail',
        label: 'Chi tiết',
        icon: <EditOutlined />,
        onClick: () => navigate(`/production/orders/${order.id}`),
      },
    ];

    if (order.status === 'draft') {
      menuItems.push({
        key: 'start',
        label: 'Bắt đầu',
        icon: <PlayCircleOutlined />,
        onClick: () => startMutation.mutate(order.id),
      });
    }

    if (order.status === 'in_progress') {
      menuItems.push({
        key: 'complete',
        label: 'Hoàn thành',
        icon: <CheckCircleOutlined />,
        onClick: () => {
          if (window.confirm('Xác nhận hoàn thành lệnh sản xuất?')) {
            completeMutation.mutate(order.id);
          }
        },
      });
    }

    if (order.status === 'draft' || order.status === 'in_progress') {
      menuItems.push({
        key: 'cancel',
        label: 'Hủy',
        danger: true,
        onClick: () => {
          if (window.confirm('Bạn có chắc muốn hủy lệnh này?')) {
            cancelMutation.mutate(order.id);
          }
        },
      });
    }

    return (
      <MobileListCard
        title={order.code}
        subtitle={order.productName}
        tags={[
          <Tag key="status" color={statusColors[order.status]}>
            {statusLabels[order.status]}
          </Tag>,
        ]}
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
        details={[
          { label: 'Số lượng', value: order.quantity.toString() },
          { label: 'Ngày bắt đầu', value: formatDate(order.startDate) },
          { label: 'Ngày dự kiến', value: formatDate(order.expectedEndDate) },
        ]}
      />
    );
  };

  return (
    <StandardListPage
      title="Lệnh sản xuất"
      createButtonText="Tạo lệnh sản xuất"
      onCreateClick={() => navigate('/production/orders/new')}
      searchPlaceholder="Tìm kiếm lệnh sản xuất..."
      searchValue={search}
      onSearchChange={setSearch}
      filters={
        <Select
          placeholder="Trạng thái"
          style={{ width: 150 }}
          allowClear
          value={status}
          onChange={setStatus}
        >
          <Option value="draft">Nháp</Option>
          <Option value="in_progress">Đang thực hiện</Option>
          <Option value="paused">Tạm dừng</Option>
          <Option value="completed">Hoàn thành</Option>
          <Option value="cancelled">Đã hủy</Option>
        </Select>
      }
      columns={columns}
      dataSource={data?.data || []}
      loading={isLoading}
      pagination={false}
      mobileRenderItem={renderMobileItem}
      onMobileItemClick={(order) => navigate(`/production/orders/${order.id}`)}
    />
  );
};

export default ProductionOrderList;
