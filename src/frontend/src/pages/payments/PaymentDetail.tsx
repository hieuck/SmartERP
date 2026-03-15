import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Modal,
  Alert,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  RollbackOutlined,
  ReconciliationOutlined,
  DollarCircleOutlined,
  SyncOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PaymentStatus,
  PaymentMethod,
} from '@/services/accounting/paymentService';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import type { Payment } from '@/lib/offline/db';
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
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueSize, setSyncQueueSize] = useState(0);

  // Load payment from IndexedDB
  const loadPayment = async () => {
    try {
      setLoading(true);
      if (!id) return;
      
      const data = await offlineServices.payments.getById(id);
      setPayment(data || null);
      logger.info('PaymentDetail', 'Loaded payment from IndexedDB', { id });
    } catch (error) {
      logger.error('PaymentDetail', 'Failed to load payment', error as Error);
      message.error('Không thể tải thông tin thanh toán');
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync on mount when online
  useEffect(() => {
    const initSync = async () => {
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await syncManager.sync(token);
            logger.info('PaymentDetail', 'Auto-sync completed');
          } catch (error) {
            logger.error('PaymentDetail', 'Auto-sync failed', error as Error);
          }
        }
      }
    };

    initSync();
    loadPayment();
  }, [id]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync queue size
  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await syncManager.getQueueSize();
      setSyncQueueSize(size);
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000);

    return () => clearInterval(interval);
  }, []);

  // Manual sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('Vui lòng đăng nhập');
      return;
    }

    try {
      setSyncing(true);
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(`Đồng bộ thành công: ${result.pulled} pulled, ${result.pushed} pushed`);
        await loadPayment();
      } else {
        message.error(`Đồng bộ thất bại: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('PaymentDetail', 'Sync failed', error as Error);
      message.error('Đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const handleComplete = async () => {
    if (!payment) return;

    Modal.confirm({
      title: 'Hoàn thành thanh toán',
      content: 'Bạn có chắc chắn muốn đánh dấu thanh toán này là hoàn thành?',
      onOk: async () => {
        try {
          await offlineServices.payments.update(payment.id, {
            ...payment,
            status: PaymentStatus.COMPLETED,
          });
          message.success('Hoàn thành thanh toán thành công');
          await loadPayment();
        } catch (error) {
          logger.error('PaymentDetail', 'Failed to complete payment', error as Error);
          message.error('Không thể hoàn thành thanh toán');
        }
      },
    });
  };

  const handleRefund = async () => {
    if (!payment) return;

    Modal.confirm({
      title: 'Hoàn tiền',
      content: `Bạn có chắc chắn muốn hoàn tiền ${payment.amount.toLocaleString('vi-VN')} ₫?`,
      onOk: async () => {
        try {
          await offlineServices.payments.update(payment.id, {
            ...payment,
            status: PaymentStatus.REFUNDED,
          });
          message.success('Hoàn tiền thành công');
          await loadPayment();
        } catch (error) {
          logger.error('PaymentDetail', 'Failed to refund payment', error as Error);
          message.error('Không thể hoàn tiền');
        }
      },
    });
  };

  const handleReconcile = async () => {
    if (!payment) return;

    Modal.confirm({
      title: 'Đối soát thanh toán',
      content: 'Bạn có chắc chắn muốn đối soát thanh toán này?',
      onOk: async () => {
        try {
          // Just mark as reconciled in metadata
          await offlineServices.payments.update(payment.id, {
            ...payment,
            metadata: {
              ...payment.metadata,
              reconciled: true,
              reconciledAt: new Date().toISOString(),
            },
          });
          message.success('Đối soát thành công');
          await loadPayment();
        } catch (error) {
          logger.error('PaymentDetail', 'Failed to reconcile payment', error as Error);
          message.error('Không thể đối soát');
        }
      },
    });
  };

  if (loading) {
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
        {/* Network Status & Sync */}
        <Card size="small">
          <Space>
            <Badge status={isOnline ? 'success' : 'error'} />
            <Text>{isOnline ? <WifiOutlined /> : <DisconnectOutlined />}</Text>
            <Text>{isOnline ? 'Online' : 'Offline'}</Text>
            {syncQueueSize > 0 && (
              <>
                <Text>|</Text>
                <Text type="warning">{syncQueueSize} thay đổi chưa đồng bộ</Text>
              </>
            )}
            <Button
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
              disabled={!isOnline}
              size="small"
            >
              Đồng bộ
            </Button>
          </Space>
        </Card>

        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Title level={3}>
              <DollarCircleOutlined /> Chi tiết thanh toán: {payment.id}
            </Title>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/payments')}>
                Quay lại
              </Button>
              {canEdit && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/dashboard/payments/${id}`)}
                >
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
            <Descriptions.Item label="Mã thanh toán">{payment.id}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColors[payment.status as PaymentStatus]}>
                {statusLabels[payment.status as PaymentStatus]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Đơn hàng">{payment.orderId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              <Tag>{methodLabels[payment.paymentMethod as PaymentMethod]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                {payment.amount.toLocaleString('vi-VN')} {payment.currency}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày thanh toán">
              {payment.paymentDate ? dayjs(payment.paymentDate).format('DD/MM/YYYY HH:mm') : '-'}
            </Descriptions.Item>
            {payment.transactionId && (
              <Descriptions.Item label="Mã giao dịch" span={2}>
                <Text code>{payment.transactionId}</Text>
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
            <Descriptions.Item label="Trạng thái đồng bộ">
              <Tag color={payment.syncStatus === 'synced' ? 'green' : 'orange'}>
                {payment.syncStatus === 'synced' ? 'Đã đồng bộ' : 'Chưa đồng bộ'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    </div>
  );
};

export default PaymentDetail;
