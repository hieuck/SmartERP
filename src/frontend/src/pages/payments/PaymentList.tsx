/**
 * Payment List Page - Offline-First
 * Displays and manages payments with filtering and refund functionality
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button,
  Space,
  Tag,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Modal,
  Form,
  InputNumber,
  Input,
  Badge,
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  RollbackOutlined,
  DollarOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import StandardListPage from '@/components/common/StandardListPage';
import { formatCurrency, formatDate } from '@/utils/responsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Payment, SyncStatus } from '@/lib/offline/db';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const statusColors: Record<string, string> = {
  pending: 'warning',
  processing: 'blue',
  completed: 'success',
  failed: 'error',
  refunded: 'default',
};

export default function PaymentList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['payments', 'common']);
  const [form] = Form.useForm();
  const { isMobile } = useResponsive();
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: undefined as string | undefined,
    method: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  // Memoize formatCurrency function
  const memoizedFormatCurrency = useCallback(
    (value: number) => formatCurrency(value),
    []
  );

  // Memoize formatDate function
  const memoizedFormatDate = useCallback(
    (date: Date | string) => formatDate(date.toString()),
    []
  );

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('PaymentList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('PaymentList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load payments from offline storage
  const loadPayments = async () => {
    setLoading(true);
    try {
      logger.debug('PaymentList', 'Loading payments from offline storage');
      const allPayments = await offlineServices.payments.getAll();
      
      // Apply filters
      let filtered = allPayments;
      
      // Status filter
      if (filters.status) {
        filtered = filtered.filter(p => p.status === filters.status);
      }
      
      // Method filter
      if (filters.method) {
        filtered = filtered.filter(p => p.paymentMethod === filters.method);
      }
      
      // Date range filter
      if (filters.startDate && filters.endDate) {
        const start = dayjs(filters.startDate);
        const end = dayjs(filters.endDate);
        filtered = filtered.filter(p => {
          const paymentDate = dayjs(p.paymentDate);
          return paymentDate.isAfter(start) && paymentDate.isBefore(end);
        });
      }

      setPayments(filtered);
      logger.info('PaymentList', `Loaded ${filtered.length} payments`);
    } catch (error) {
      logger.error('PaymentList', 'Failed to load payments', error as Error);
      message.error(t('payments:messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Update queue size
  const updateQueueSize = async () => {
    try {
      const size = await syncManager.getQueueSize();
      setQueueSize(size);
    } catch (error) {
      logger.error('PaymentList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadPayments();
      await updateQueueSize();

      // Auto-sync if online and has token
      if (isOnline) {
        const token = localStorage.getItem('token');
        if (token && !syncManager.isSyncing()) {
          handleSync();
        }
      }
    };

    initializeData();
  }, []);

  // Reload payments when filters change
  useEffect(() => {
    loadPayments();
  }, [filters.status, filters.method, filters.startDate, filters.endDate]);

  // Handle sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error(t('common:messages.loginRequired'));
      return;
    }

    if (!isOnline) {
      message.warning(t('common:messages.offlineMode'));
      return;
    }

    setSyncing(true);
    try {
      logger.info('PaymentList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadPayments();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('PaymentList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (payment: Payment) => {
    try {
      logger.info('PaymentList', `Deleting payment: ${payment.id}`);
      await offlineServices.payments.delete(payment.id);
      message.success(t('payments:messages.deleteSuccess'));
      await loadPayments();
      await updateQueueSize();
    } catch (error) {
      logger.error('PaymentList', 'Failed to delete payment', error as Error);
      message.error(t('payments:messages.deleteError'));
    }
  };

  // Handle complete payment
  const handleComplete = async (payment: Payment) => {
    try {
      logger.info('PaymentList', `Completing payment: ${payment.id}`);
      await offlineServices.payments.update(payment.id, { 
        status: 'completed',
        paymentDate: new Date()
      });
      message.success(t('payments:messages.completeSuccess'));
      await loadPayments();
      await updateQueueSize();
    } catch (error) {
      logger.error('PaymentList', 'Failed to complete payment', error as Error);
      message.error(t('payments:messages.completeError'));
    }
  };

  // Handle refund
  const handleRefund = async () => {
    if (!selectedPayment) return;
    try {
      const values = await form.validateFields();
      logger.info('PaymentList', `Processing refund for payment: ${selectedPayment.id}`);
      
      await offlineServices.payments.update(selectedPayment.id, {
        status: 'refunded',
        notes: values.reason,
        metadata: {
          ...selectedPayment.metadata,
          refundAmount: values.amount,
          refundReason: values.reason,
          refundDate: new Date().toISOString(),
        }
      });
      
      message.success(t('payments:messages.refundSuccess'));
      setRefundModalVisible(false);
      setSelectedPayment(null);
      form.resetFields();
      await loadPayments();
      await updateQueueSize();
    } catch (error: unknown) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      logger.error('PaymentList', 'Failed to process refund', error as Error);
      message.error(t('payments:messages.refundError'));
    }
  };

  // Get paginated data
  const paginatedPayments = useMemo(
    () => payments.slice(
      (filters.page - 1) * filters.limit,
      filters.page * filters.limit
    ),
    [payments, filters.page, filters.limit]
  );

  const columns = useMemo(() => [
    {
      title: t('payments:columns.orderId'),
      dataIndex: 'orderId',
      key: 'orderId',
      render: (orderId: string, record: Payment) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/payments/${record.id}`)}
          style={{ padding: 0 }}
        >
          {orderId}
        </Button>
      ),
    },
    {
      title: t('payments:columns.paymentDate'),
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (date: Date) => date ? memoizedFormatDate(date) : '-',
    },
    {
      title: t('payments:columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => memoizedFormatCurrency(val),
    },
    {
      title: t('payments:columns.method'),
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => method?.toUpperCase() || '-',
    },
    {
      title: t('payments:columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {status?.toUpperCase() || 'PENDING'}
        </Tag>
      ),
    },
    {
      title: t('payments:columns.reference'),
      dataIndex: 'transactionId',
      key: 'transactionId',
      ellipsis: true,
      render: (ref: string) => ref || '-',
    },
    {
      title: 'Sync',
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      render: (syncStatus: SyncStatus) => {
        const colors = {
          [SyncStatus.SYNCED]: 'success',
          [SyncStatus.PENDING]: 'warning',
          [SyncStatus.CONFLICT]: 'error',
        };
        const labels = {
          [SyncStatus.SYNCED]: 'Synced',
          [SyncStatus.PENDING]: 'Pending',
          [SyncStatus.CONFLICT]: 'Conflict',
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || 'Unknown'}
          </Tag>
        );
      },
    },
    {
      title: t('common:actions.title'),
      key: 'action',
      fixed: 'right' as const,
      render: (_: unknown, record: Payment) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/dashboard/payments/${record.id}`)}
          >
            {t('payments:actions.view')}
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record)}
            >
              {t('payments:actions.confirm')}
            </Button>
          )}
          {record.status === 'completed' && (
            <Button
              type="link"
              size="small"
              icon={<RollbackOutlined />}
              onClick={() => {
                setSelectedPayment(record);
                form.setFieldsValue({ amount: record.amount });
                setRefundModalVisible(true);
              }}
            >
              {t('payments:actions.refund')}
            </Button>
          )}
          <Popconfirm
            title={t('payments:messages.deleteConfirm')}
            onConfirm={() => handleDelete(record)}
            okText={t('common:actions.delete')}
            cancelText={t('common:actions.cancel')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('payments:actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [t, navigate, memoizedFormatCurrency, memoizedFormatDate, form]);

  const filterComponents = useMemo(
    () => (
      <Space wrap>
        <Select
          placeholder={t('payments:filters.status')}
          style={{ width: isMobile ? '100%' : 150 }}
          allowClear
          value={filters.status}
          onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
        >
          <Select.Option value="pending">PENDING</Select.Option>
          <Select.Option value="processing">PROCESSING</Select.Option>
          <Select.Option value="completed">COMPLETED</Select.Option>
          <Select.Option value="failed">FAILED</Select.Option>
          <Select.Option value="refunded">REFUNDED</Select.Option>
        </Select>
        <Select
          placeholder={t('payments:filters.method')}
          style={{ width: isMobile ? '100%' : 150 }}
          allowClear
          value={filters.method}
          onChange={(value) => setFilters({ ...filters, method: value, page: 1 })}
        >
          <Select.Option value="cash">CASH</Select.Option>
          <Select.Option value="card">CARD</Select.Option>
          <Select.Option value="bank_transfer">BANK TRANSFER</Select.Option>
          <Select.Option value="e_wallet">E-WALLET</Select.Option>
        </Select>
        <RangePicker
          format="DD/MM/YYYY"
          placeholder={[t('payments:filters.fromDate'), t('payments:filters.toDate')]}
          onChange={(dates) => {
            setFilters({
              ...filters,
              startDate: dates?.[0]?.format('YYYY-MM-DD'),
              endDate: dates?.[1]?.format('YYYY-MM-DD'),
              page: 1,
            });
          }}
        />
      </Space>
    ),
    [t, isMobile, filters]
  );

  return (
    <>
      <StandardListPage
        title={
          <>
            <DollarOutlined /> {t('payments:title')}
          </>
        }
        createButtonText={t('payments:createButton')}
        onCreateClick={() => navigate('/dashboard/payments/new')}
        loading={loading}
        dataSource={paginatedPayments}
        columns={columns}
        filters={filterComponents}
        extraActions={
          <Space>
            {/* Network Status Badge */}
            <Badge
              status={isOnline ? 'success' : 'error'}
              text={
                <Space size="small">
                  {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                  {isOnline ? 'Online' : 'Offline'}
                </Space>
              }
            />
            
            {/* Sync Queue Indicator */}
            {queueSize > 0 && (
              <Badge count={queueSize} showZero={false}>
                <Tag color="warning">Pending Sync</Tag>
              </Badge>
            )}

            {/* Sync Button */}
            <Button
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
              disabled={!isOnline}
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </Space>
        }
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: payments.length,
          showSizeChanger: true,
          showTotal: (total: number) => t('payments:messages.total', { total }),
          onChange: (page: number, pageSize: number) => {
            setFilters({ ...filters, page, limit: pageSize });
          },
        }}
        scroll={{ x: 1100 }}
        onMobileItemClick={(record) => navigate(`/dashboard/payments/${record.id}`)}
      />

      <Modal
        title={t('payments:actions.refund')}
        open={refundModalVisible}
        onOk={handleRefund}
        onCancel={() => {
          setRefundModalVisible(false);
          setSelectedPayment(null);
          form.resetFields();
        }}
        okText={t('common:actions.confirm')}
        cancelText={t('common:actions.cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('payments:columns.amount')}
            name="amount"
            rules={[
              { required: true, message: t('common:validation.required') },
              {
                type: 'number',
                min: 0,
                max: selectedPayment?.amount || 0,
                message: t('common:validation.invalidAmount'),
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              placeholder={t('payments:columns.amount')}
            />
          </Form.Item>
          <Form.Item
            label={t('common:fields.reason')}
            name="reason"
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <TextArea rows={4} placeholder={t('common:fields.reason')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
