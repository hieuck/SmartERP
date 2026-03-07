import React from 'react';
import { Card, Descriptions, Tag, Button, Space, Typography, Spin, message, Modal, Alert } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, RollbackOutlined, ReconciliationOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, PaymentStatus, PaymentMethod } from '../../services/paymentService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'blue',
  [PaymentStatus.COMPLETED]: 'green',
  [PaymentStatus.FAILED]: 'red',
  [PaymentStatus.REFUNDED]: 'orange',
};

const statusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Chờ xử lý',
  [PaymentStatus.COMPLETED]: 'Hoàn thành',
  [PaymentStatus.FAILED]: 'Thất bại',
  [PaymentStatus.REFUNDED]: 'Đã hoàn tiền',
};

const methodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Tiền mặt',
  [PaymentMethod.CARD]: 'Thẻ',
  [PaymentMethod.BANK_TRANSFER]: 'Chuyển khoản',
  [PaymentMethod.CHEQUE]: 'Séc',
  [PaymentMethod.E_WALLET]: 'Ví điện tử',
};

const PaymentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentService.getById(id!),
  });

  const completeMutation = useMutation({
    mutationFn: () => paymentService.complete(id!),
    onSuccess: () => {
      message.success('Hoàn thành thanh toán thành công');
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
    },
    onError: () => {
      message.error('Không thể hoàn thành thanh toán');
    },
  });

  const refundMutation = useMutation({
    mutationFn: (amount: number) => paymentService.refund(id!, { amount, reason: 'Hoàn tiền' }),
    onSuccess: () => {
      message.success('Hoàn tiền thành công');
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
    },
    onError: () => {
      message.error('Không thể hoàn tiền');
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: () => paymentService.reconcile(id!),
    onSuccess: () => {
      message.success('Đối soát thành công');
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
    },
    onError: () => {
      message.error('Không thể đối soát');
    },
  });

  const handleComplete = () => {
    Modal.confirm({
      title: 'Hoàn thành thanh toán',
      content: 'Bạn có chắc chắn muốn đánh dấu thanh toán này là hoàn thành?',
      onOk: () => completeMutation.mutate(),
    });
  };

  const handleRefund = () => {
    Modal.confirm({
      title: 'Hoàn tiền',
      content: `Bạn có chắc chắn muốn hoàn tiền ${payment?.amount.toLocaleString('vi-VN')} ₫?`,
      onOk: () => refundMutation.mutate(payment?.amount || 0),
    });
  };

  const handleReconcile = () => {
    Modal.confirm({
      title: 'Đối soát thanh toán',
      content: 'Bạn có chắc chắn muốn đối soát thanh toán này?',
      onOk: () => reconcileMutation.mutate(),
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Text>Không tìm thấy thanh toán</Text>
        </Card>
      </div>
    );
  }

  const canEdit = payment.status === PaymentStatus.PENDING;
  const canComplete = payment.status === PaymentStatus.PENDING;
  const canRefund = payment.status === PaymentStatus.COMPLETED;
  const canReconcile = payment.status === PaymentStatus.COMPLETED;

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={3}>
              <DollarCircleOutlined /> Chi tiết thanh toán: {payment.paymentNumber}
            </Title>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/payments')}>
                Quay lại
              </Button>
              {canEdit && (
                <Button icon={<EditOutlined />} onClick={() => navigate(`/dashboard/payments/${id}`)}>
                  Chỉnh sửa
                </Button>
              )}
              {canComplete && (
                <Button type="primary" icon={<CheckOutlined />} onClick={handleComplete}>
                  Hoàn thành
                </Button>
              )}
              {canRefund && (
                <Button danger icon={<RollbackOutlined />} onClick={handleRefund}>
                  Hoàn tiền
                </Button>
              )}
              {canReconcile && (
                <Button icon={<ReconciliationOutlined />} onClick={handleReconcile}>
                  Đối soát
                </Button>
              )}
            </Space>
          </div>

          {payment.status === PaymentStatus.FAILED && (
            <Alert
              message="Thanh toán thất bại"
              description="Giao dịch thanh toán này đã thất bại. Vui lòng kiểm tra lại thông tin và thử lại."
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {payment.status === PaymentStatus.REFUNDED && (
            <Alert
              message="Đã hoàn tiền"
              description={`Số tiền ${payment.amount.toLocaleString('vi-VN')} ₫ đã được hoàn trả cho khách hàng.`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã thanh toán">{payment.paymentNumber}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColors[payment.status]}>{statusLabels[payment.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Hóa đơn">{payment.invoiceId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Đơn hàng">{payment.orderId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{payment.customerId}</Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              <Tag>{methodLabels[payment.method]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                {payment.amount.toLocaleString('vi-VN')} ₫
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày thanh toán">
              {dayjs(payment.paymentDate).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            {payment.reference && (
              <Descriptions.Item label="Tham chiếu" span={2}>
                <Text code>{payment.reference}</Text>
              </Descriptions.Item>
            )}
            {payment.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {payment.notes}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày tạo">
              {dayjs(payment.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    </div>
  );
};

export default PaymentDetail;
