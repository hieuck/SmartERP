import React from 'react';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  orderServiceNew,
  OrderStatus,
  PaymentStatus,
  OrderItem,
} from '../../services/order/orderService';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'default',
  [OrderStatus.PENDING]: 'blue',
  [OrderStatus.CONFIRMED]: 'cyan',
  [OrderStatus.PROCESSING]: 'orange',
  [OrderStatus.SHIPPED]: 'purple',
  [OrderStatus.DELIVERED]: 'green',
  [OrderStatus.CANCELLED]: 'red',
};

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'Nháp',
  [OrderStatus.PENDING]: 'Chờ xử lý',
  [OrderStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.SHIPPED]: 'Đã gửi hàng',
  [OrderStatus.DELIVERED]: 'Đã giao hàng',
  [OrderStatus.CANCELLED]: 'Đã hủy',
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'red',
  [PaymentStatus.PARTIAL]: 'orange',
  [PaymentStatus.PAID]: 'green',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'Chưa thanh toán',
  [PaymentStatus.PARTIAL]: 'Thanh toán một phần',
  [PaymentStatus.PAID]: 'Đã thanh toán',
};

const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderServiceNew.getById(id!),
  });

  const confirmMutation = useMutation({
    mutationFn: () => orderServiceNew.confirm(id!),
    onSuccess: () => {
      message.success('Xác nhận đơn hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: () => {
      message.error('Không thể xác nhận đơn hàng');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderServiceNew.cancel(id!),
    onSuccess: () => {
      message.success('Hủy đơn hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: () => {
      message.error('Không thể hủy đơn hàng');
    },
  });

  const handleConfirm = () => {
    Modal.confirm({
      title: 'Xác nhận đơn hàng',
      content: 'Bạn có chắc chắn muốn xác nhận đơn hàng này?',
      onOk: () => confirmMutation.mutate(),
    });
  };

  const handleCancel = () => {
    Modal.confirm({
      title: 'Hủy đơn hàng',
      content: 'Bạn có chắc chắn muốn hủy đơn hàng này?',
      onOk: () => cancelMutation.mutate(),
    });
  };

  const columns: ColumnsType<OrderItem> = [
    {
      title: 'SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      width: 120,
    },
    {
      title: 'Sản phẩm',
      dataIndex: ['product', 'name'],
      key: 'product',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Text>Không tìm thấy đơn hàng</Text>
        </Card>
      </div>
    );
  }

  const canEdit = order.status === OrderStatus.DRAFT || order.status === OrderStatus.PENDING;
  const canConfirm = order.status === OrderStatus.PENDING;
  const canCancel =
    order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED;

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Title level={3}>Chi tiết đơn hàng: {order.orderNumber}</Title>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/dashboard/orders/sales')}
              >
                Quay lại
              </Button>
              {canEdit && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/dashboard/orders/sales/${id}/edit`)}
                >
                  Chỉnh sửa
                </Button>
              )}
              {canConfirm && (
                <Button type="primary" icon={<CheckOutlined />} onClick={handleConfirm}>
                  Xác nhận
                </Button>
              )}
              {canCancel && (
                <Button danger icon={<CloseOutlined />} onClick={handleCancel}>
                  Hủy đơn
                </Button>
              )}
            </Space>
          </div>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã đơn hàng">{order.orderNumber}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColors[order.status]}>{statusLabels[order.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{order.customerId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Ngày đặt">
              {dayjs(order.orderDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <Text strong style={{ fontSize: 16 }}>
                {order.total.toLocaleString('vi-VN')} ₫
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán">
              <Text style={{ fontSize: 16 }}>{order.paidAmount.toLocaleString('vi-VN')} ₫</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Còn lại">
              <Text
                strong
                style={{
                  fontSize: 16,
                  color: order.paidAmount < order.total ? '#ff4d4f' : '#52c41a',
                }}
              >
                {(order.total - order.paidAmount).toLocaleString('vi-VN')} ₫
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái thanh toán">
              <Tag color={paymentStatusColors[order.paymentStatus]}>
                {paymentStatusLabels[order.paymentStatus]}
              </Tag>
            </Descriptions.Item>
            {order.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {order.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card title="Chi tiết sản phẩm">
          <Table
            columns={columns}
            dataSource={order.items || []}
            rowKey="id"
            pagination={false}
            summary={(pageData) => {
              const total = pageData.reduce((sum, item) => sum + item.total, 0);
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <Text strong>Tổng cộng:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ fontSize: 16 }}>
                        {total.toLocaleString('vi-VN')} ₫
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Card>

        {order.paymentStatus !== PaymentStatus.PAID && (
          <Card>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => navigate(`/dashboard/payments/new?orderId=${id}`)}
            >
              Thanh toán
            </Button>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default OrderDetail;
