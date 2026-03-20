/**
 * Payment List Page - Offline-First
 * Displays and manages payments with filtering and refund functionality
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  App,
  Button,
  Space,
  Tag,
  Select,
  DatePicker,
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
  const { message } = App.useApp();
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

  const getStatusLabel = useCallback((status: string) => {
    return t(`payments:status.${status}`, status.toUpperCase());
  }, [t]);

  const getMethodLabel = useCallback((method: string) => {
    return t(`payments:paymentMethod.${method}`, method.toUpperCase());
  }, [t]);

  const getSyncStatusLabel = useCallback((syncStatus: SyncStatus) => {
    const labels = {
      [SyncStatus.SYNCED]: t('payments:syncStatus.synced'),
      [SyncStatus.PENDING]: t('payments:syncStatus.pending'),
      [SyncStatus.CONFLICT]: t('payments:syncStatus.failed'),
    };
    return labels[syncStatus] || 'Unknown';
  }, [t]);

  const memoizedFormatCurrency = useCallback(
    (value: number) => formatCurrency(value),
    []
  );

  const memoizedFormatDate = useCallback(
    (date: Date | string) => formatDate(date.toString()),
    []
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('PaymentList', 'Network connection restored');
      message.success(t('common:network.restored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('PaymentList', 'Network connection lost');
      message.warning(t('common:network.lost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      logger.debug('PaymentList', 'Loading payments from offline storage');
      const allPayments = await offlineServices.payments.getAll();
      
      let filtered = allPayments;
      
      if (filters.status) {
        filtered = filtered.filter(p => p.status === filters.status);
      }
      
      if (filters.method) {
        filtered = filtered.filter(p => p.paymentMethod === filters.method);
      }
      
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
      message.error(t('payments:messages.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const updateQueueSize = async () => {
    try {
      const size = await syncManager.getQueueSize();
      setQueueSize(size);
    } catch (error) {
      logger.error('PaymentList', 'Failed to get queue size', error as Error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await loadPayments();
      await updateQueueSize();

      if (isOnline) {
        const token = localStorage.getItem('token');
        if (token && !syncManager.isSyncing()) {
          handleSync();
        }
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [filters.status, filters.method, filters.startDate, filters.endDate]);

  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error(t('common:auth.loginRequired'));
      return;
    }

    if (!isOnline) {
      message.warning(t('common:network.offlineMode'));
      return;
    }

    setSyncing(true);
    try {
      logger.info('PaymentList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:sync.success', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadPayments();
        await updateQueueSize();
      } else {
        message.error(t('common:sync.error', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('PaymentList', 'Sync failed', error as Error);
      message.error(t('common:sync.error', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

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

  const handleComplete = async (payment: Payment) => {
    try {
      logger.info('PaymentList', `Completing payment: ${payment.id}`);
      await offlineServices.payments.update(payment.id, { 
        status: 'completed',
        paymentDate: new Date()
      });
      message.success(t('payments:messages.updateSuccess'));
      await loadPayments();
      await updateQueueSize();
    } catch (error) {
      logger.error('PaymentList', 'Failed to complete payment', error as Error);
      message.error(t('payments:messages.updateError'));
    }
  };

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
      
      message.success(t('payments:messages.updateSuccess'));
      setRefundModalVisible(false);
      setSelectedPayment(null);
      form.resetFields();
      await loadPayments();
      await updateQueueSize();
    } catch (error: unknown) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      logger.error('PaymentList', 'Failed to process refund', error as Error);
      message.error(t('payments:messages.updateError'));
    }
  };

  const paginatedPayments = useMemo(
    () => payments.slice(
      (filters.page - 1) * filters.limit,
      filters.page * filters.limit
    ),
    [payments, filters.page, filters.limit]
  );

  const columns = useMemo(() => [
    {
      title: t('payments:table.columns.paymentCode'),
      dataIndex: 'id',
      key: 'id',
      render: (id: string, record: Payment) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/payments/${record.id}`)}
          style={{ padding: 0 }}
        >
          {id}
        </Button>
      ),
    },
    {
      title: t('payments:table.columns.paymentDate'),
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (date: Date) => date ? memoizedFormatDate(date) : '-',
    },
    {
      title: t('payments:table.columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => memoizedFormatCurrency(val),
    },
    {
      title: t('payments:table.columns.paymentMethod'),
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => getMethodLabel(method),
    },
    {
      title: t('payments:table.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: t('payments:table.columns.reference'),
      dataIndex: 'transactionId',
      key: 'transactionId',
      ellipsis: true,
      render: (ref: string) => ref || '-',
    },
    {
      title: t('payments:table.columns.syncStatus'),
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      render: (syncStatus: SyncStatus) => {
        const colors = {
          [SyncStatus.SYNCED]: 'success',
          [SyncStatus.PENDING]: 'warning',
          [SyncStatus.CONFLICT]: 'error',
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {getSyncStatusLabel(syncStatus)}
          </Tag>
        );
      },
    },
    {
      title: t('payments:table.columns.actions'),
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
              {t('common:actions.confirm')}
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
              {t('common:actions.refund')}
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
  ], [t, navigate, memoizedFormatCurrency, memoizedFormatDate, form, getStatusLabel, getMethodLabel, getSyncStatusLabel]);

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
          <Select.Option value="pending">{t('payments:status.pending')}</Select.Option>
          <Select.Option value="processing">{t('payments:status.processing', 'PROCESSING')}</Select.Option>
          <Select.Option value="completed">{t('payments:status.completed')}</Select.Option>
          <Select.Option value="failed">{t('payments:status.failed')}</Select.Option>
          <Select.Option value="refunded">{t('payments:status.refunded', 'REFUNDED')}</Select.Option>
        </Select>
        <Select
          placeholder={t('payments:filters.paymentMethod')}
          style={{ width: isMobile ? '100%' : 150 }}
          allowClear
          value={filters.method}
          onChange={(value) => setFilters({ ...filters, method: value, page: 1 })}
        >
          <Select.Option value="cash">{t('payments:paymentMethod.cash')}</Select.Option>
          <Select.Option value="card">{t('payments:paymentMethod.credit_card')}</Select.Option>
          <Select.Option value="bank_transfer">{t('payments:paymentMethod.bank_transfer')}</Select.Option>
          <Select.Option value="e_wallet">{t('payments:paymentMethod.e_wallet')}</Select.Option>
        </Select>
        <RangePicker
          format="DD/MM/YYYY"
          placeholder={[t('common:filters.startDate'), t('common:filters.endDate')]}
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
        createButtonText={t('payments:createPayment')}
        onCreateClick={() => navigate('/dashboard/payments/new')}
        loading={loading}
        dataSource={paginatedPayments}
        columns={columns}
        filters={filterComponents}
        extraActions={
          <Space>
            <Badge
              status={isOnline ? 'success' : 'error'}
              text={
                <Space size="small">
                  {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                  {isOnline ? t('common:network.online') : t('common:network.offline')}
                </Space>
              }
            />
            
            {queueSize > 0 && (
              <Badge count={queueSize} showZero={false}>
                <Tag color="warning">{t('common:sync.pending')}</Tag>
              </Badge>
            )}

            <Button
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
              disabled={!isOnline}
            >
              {syncing ? t('common:sync.syncing') : t('common:sync.syncNow')}
            </Button>
          </Space>
        }
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: payments.length,
          showSizeChanger: true,
          showTotal: (total: number) => t('common:pagination.total', { total }),
          onChange: (page: number, pageSize: number) => {
            setFilters({ ...filters, page, limit: pageSize });
          },
        }}
        scroll={{ x: 1100 }}
        onMobileItemClick={(record) => navigate(`/dashboard/payments/${record.id}`)}
      />

      <Modal
        title={t('common:actions.refund')}
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
            label={t('payments:amount')}
            name="amount"
            rules={[
              { required: true, message: t('payments:form.amountRequired') },
              {
                type: 'number',
                min: 0,
                max: selectedPayment?.amount || 0,
                message: t('payments:form.amountMin'),
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              placeholder={t('payments:form.amountPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            label={t('payments:notes')}
            name="reason"
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <TextArea rows={4} placeholder={t('payments:form.notesPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
