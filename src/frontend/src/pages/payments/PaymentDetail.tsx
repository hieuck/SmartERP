import React, { useEffect, useState, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
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

const PaymentDetail: React.FC = () => {
  const { t } = useTranslation(['payments', 'common', 'invoices', 'orders']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueSize, setSyncQueueSize] = useState(0);

  // Memoized translation functions
  const statusColors: Record<PaymentStatus, string> = useMemo(() => ({
    [PaymentStatus.PENDING]: 'blue',
    [PaymentStatus.COMPLETED]: 'green',
    [PaymentStatus.FAILED]: 'red',
    [PaymentStatus.REFUNDED]: 'orange',
  }), []);

  const getStatusLabel = useMemo(() => {
    return (status: PaymentStatus) => {
      const labels: Record<PaymentStatus, string> = {
        [PaymentStatus.PENDING]: t('payments:status.pending'),
        [PaymentStatus.COMPLETED]: t('payments:status.completed'),
        [PaymentStatus.FAILED]: t('payments:status.failed'),
        [PaymentStatus.REFUNDED]: t('payments:status.refunded'),
      };
      return labels[status] || status;
    };
  }, [t]);

  const getMethodLabel = useMemo(() => {
    return (method: PaymentMethod) => {
      const labels: Record<PaymentMethod, string> = {
        [PaymentMethod.CASH]: t('payments:paymentMethod.cash'),
        [PaymentMethod.CARD]: t('payments:paymentMethod.card'),
        [PaymentMethod.BANK_TRANSFER]: t('payments:paymentMethod.bankTransfer'),
        [PaymentMethod.CHEQUE]: t('payments:paymentMethod.cheque'),
        [PaymentMethod.E_WALLET]: t('payments:paymentMethod.eWallet'),
      };
      return labels[method] || method;
    };
  }, [t]);

  const getSyncStatusLabel = useMemo(() => {
    return (status: string) => {
      const labels: Record<string, string> = {
        'synced': t('payments:syncStatus.synced'),
        'pending': t('payments:syncStatus.pending'),
        'failed': t('payments:syncStatus.failed'),
      };
      return labels[status] || status;
    };
  }, [t]);

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
      message.error(t('payments:messages.fetchDetailError'));
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
      message.error(t('common:messages.loginRequired'));
      return;
    }

    try {
      setSyncing(true);
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(t('common:sync.syncSuccess', { pulled: result.pulled, pushed: result.pushed }));
        await loadPayment();
      } else {
        message.error(t('common:sync.syncFailed', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('PaymentDetail', 'Sync failed', error as Error);
      message.error(t('common:sync.syncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const handleComplete = async () => {
    if (!payment) return;

    Modal.confirm({
      title: t('common:actions.complete'),
      content: t('payments:messages.completeConfirm'),
      onOk: async () => {
        try {
          await offlineServices.payments.update(payment.id, {
            ...payment,
            status: PaymentStatus.COMPLETED,
          });
          message.success(t('payments:messages.updateSuccess'));
          await loadPayment();
        } catch (error) {
          logger.error('PaymentDetail', 'Failed to complete payment', error as Error);
          message.error(t('payments:messages.updateError'));
        }
      },
    });
  };

  const handleRefund = async () => {
    if (!payment) return;

    Modal.confirm({
      title: t('common:actions.refund'),
      content: t('payments:messages.refundConfirm', { amount: payment.amount.toLocaleString('vi-VN') }),
      onOk: async () => {
        try {
          await offlineServices.payments.update(payment.id, {
            ...payment,
            status: PaymentStatus.REFUNDED,
          });
          message.success(t('payments:messages.updateSuccess'));
          await loadPayment();
        } catch (error) {
          logger.error('PaymentDetail', 'Failed to refund payment', error as Error);
          message.error(t('payments:messages.updateError'));
        }
      },
    });
  };

  const handleReconcile = async () => {
    if (!payment) return;

    Modal.confirm({
      title: t('payments:actions.reconcile'),
      content: t('payments:messages.reconcileConfirm'),
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
          message.success(t('payments:messages.updateSuccess'));
          await loadPayment();
        } catch (error) {
          logger.error('PaymentDetail', 'Failed to reconcile payment', error as Error);
          message.error(t('payments:messages.updateError'));
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
          <Text>{t('payments:empty.title')}</Text>
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
            <Text>{isOnline ? t('common:network.online') : t('common:network.offline')}</Text>
            {syncQueueSize > 0 && (
              <>
                <Text>|</Text>
                <Text type="warning">{t('common:sync.pendingChanges', { count: syncQueueSize })}</Text>
              </>
            )}
            <Button
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
              disabled={!isOnline}
              size="small"
            >
              {t('common:sync.syncNow')}
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
              <DollarCircleOutlined /> {t('payments:paymentDetail')}: {payment.id}
            </Title>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/payments')}>
                {t('common:actions.back')}
              </Button>
              {canEdit && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/dashboard/payments/${id}`)}
                >
                  {t('common:actions.edit')}
                </Button>
              )}
              {canComplete && (
                <Button type="primary" icon={<CheckOutlined />} onClick={handleComplete}>
                  {t('common:actions.complete')}
                </Button>
              )}
              {canRefund && (
                <Button danger icon={<RollbackOutlined />} onClick={handleRefund}>
                  {t('common:actions.refund')}
                </Button>
              )}
              {canReconcile && (
                <Button icon={<ReconciliationOutlined />} onClick={handleReconcile}>
                  {t('payments:actions.reconcile')}
                </Button>
              )}
            </Space>
          </div>

          {payment.status === PaymentStatus.FAILED && (
            <Alert
              message={t('payments:messages.paymentFailed')}
              description={t('payments:messages.paymentFailedDesc')}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {payment.status === PaymentStatus.REFUNDED && (
            <Alert
              message={t('payments:messages.refunded')}
              description={t('payments:messages.refundedDesc', { amount: payment.amount.toLocaleString('vi-VN') })}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Descriptions bordered column={2}>
            <Descriptions.Item label={t('payments:paymentCode')}>{payment.id}</Descriptions.Item>
            <Descriptions.Item label={t('payments:status')}>
              <Tag color={statusColors[payment.status as PaymentStatus]}>
                {getStatusLabel(payment.status as PaymentStatus)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('orders:orderNumber')}>{payment.orderId || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('payments:paymentMethod')}>
              <Tag>{getMethodLabel(payment.paymentMethod as PaymentMethod)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('payments:amount')}>
              <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                {payment.amount.toLocaleString('vi-VN')} {payment.currency}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('payments:paymentDate')}>
              {payment.paymentDate ? dayjs(payment.paymentDate).format('DD/MM/YYYY HH:mm') : '-'}
            </Descriptions.Item>
            {payment.transactionId && (
              <Descriptions.Item label={t('payments:reference')} span={2}>
                <Text code>{payment.transactionId}</Text>
              </Descriptions.Item>
            )}
            {payment.notes && (
              <Descriptions.Item label={t('payments:notes')} span={2}>
                {payment.notes}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('payments:createdAt')}>
              {dayjs(payment.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label={t('payments:syncStatus')}>
              <Tag color={payment.syncStatus === 'synced' ? 'green' : 'orange'}>
                {getSyncStatusLabel(payment.syncStatus)}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    </div>
  );
};

export default PaymentDetail;
