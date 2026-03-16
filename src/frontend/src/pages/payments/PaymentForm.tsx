import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  DatePicker,
  InputNumber,
  message,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  Alert,
  Badge,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, DollarOutlined, SyncOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  PaymentMethod,
  PaymentStatus,
} from '@/services/accounting/paymentService';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PaymentForm: React.FC = () => {
  const { t } = useTranslation(['payments', 'common']);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Memoized translation functions
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

  // Auto-sync on mount when online
  useEffect(() => {
    const initSync = async () => {
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await syncManager.sync(token);
            logger.info('PaymentForm', 'Auto-sync completed');
          } catch (error) {
            logger.error('PaymentForm', 'Auto-sync failed', error as Error);
          }
        }
      }
    };

    initSync();
  }, []);

  // Update sync queue size
  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await syncManager.getQueueSize();
      setQueueSize(size);
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadInvoices();
    loadOrders();
    if (id) {
      loadPayment();
    }
  }, [id]);

  const loadInvoices = async () => {
    try {
      const allInvoices = await offlineServices.invoices.getAll();
      setInvoices(allInvoices);
      logger.info('PaymentForm', 'Loaded invoices from IndexedDB', { count: allInvoices.length });
    } catch (error) {
      logger.error('PaymentForm', 'Failed to load invoices', error as Error);
      message.error(t('common:messages.fetchError'));
    }
  };

  const loadOrders = async () => {
    try {
      const allOrders = await offlineServices.salesOrders.getAll();
      setOrders(allOrders);
      logger.info('PaymentForm', 'Loaded orders from IndexedDB', { count: allOrders.length });
    } catch (error) {
      logger.error('PaymentForm', 'Failed to load orders', error as Error);
      message.error(t('common:messages.fetchError'));
    }
  };

  const loadPayment = async () => {
    try {
      setLoading(true);
      const payment = await offlineServices.payments.getById(id!);

      if (payment) {
        form.setFieldsValue({
          invoiceId: payment.invoiceId,
          orderId: payment.orderId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentDate: dayjs(payment.paymentDate),
          status: payment.status,
          transactionId: payment.transactionId,
          notes: payment.notes,
        });

        if (payment.invoiceId) {
          const invoice = await offlineServices.invoices.getById(payment.invoiceId);
          if (invoice) setSelectedInvoice(invoice);
        }

        if (payment.orderId) {
          const order = await offlineServices.salesOrders.getById(payment.orderId);
          if (order) setSelectedOrder(order);
        }

        logger.info('PaymentForm', 'Loaded payment from IndexedDB', { id });
      }
    } catch (error) {
      logger.error('PaymentForm', 'Failed to load payment', error as Error);
      message.error(t('payments:messages.fetchDetailError'));
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceChange = async (invoiceId: string) => {
    try {
      const invoice = await offlineServices.invoices.getById(invoiceId);
      if (invoice) {
        setSelectedInvoice(invoice);
        const remaining = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
        form.setFieldValue('amount', remaining);
        logger.info('PaymentForm', 'Loaded invoice from IndexedDB', { invoiceId });
      }
    } catch (error) {
      logger.error('PaymentForm', 'Failed to load invoice', error as Error);
      message.error(t('common:messages.fetchError'));
    }
  };

  const handleOrderChange = async (orderId: string) => {
    try {
      const order = await offlineServices.salesOrders.getById(orderId);
      if (order) {
        setSelectedOrder(order);
        const remaining = (order.totalAmount || 0) - (order.paidAmount || 0);
        form.setFieldValue('amount', remaining);
        logger.info('PaymentForm', 'Loaded order from IndexedDB', { orderId });
      }
    } catch (error) {
      logger.error('PaymentForm', 'Failed to load order', error as Error);
      message.error(t('common:messages.fetchError'));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const paymentData = {
        invoiceId: values.invoiceId,
        orderId: values.orderId,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        paymentDate: values.paymentDate.toISOString(),
        status: values.status || PaymentStatus.PENDING,
        transactionId: values.transactionId,
        notes: values.notes,
      };

      if (id) {
        await offlineServices.payments.update(id, paymentData);
        message.success(t('payments:messages.updateSuccess'));
        logger.info('PaymentForm', 'Updated payment', { id });
      } else {
        await offlineServices.payments.create(paymentData);
        message.success(t('payments:messages.createSuccess'));
        logger.info('PaymentForm', 'Created payment');
      }

      // Trigger sync if online
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (token) {
          syncManager.sync(token).catch(err => 
            logger.error('PaymentForm', 'Sync after save failed', err)
          );
        }
      }

      navigate('/dashboard/payments');
    } catch (error: any) {
      logger.error('PaymentForm', 'Failed to save payment', error);
      message.error(error.message || t('common:messages.error'));
    } finally {
      setLoading(false);
    }
  };

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
        // Reload data after sync
        await loadInvoices();
        await loadOrders();
        if (id) {
          await loadPayment();
        }
      } else {
        message.error(t('common:sync.syncFailed', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('PaymentForm', 'Sync failed', error as Error);
      message.error(t('common:sync.syncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    const icons: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: '💵',
      [PaymentMethod.CARD]: '💳',
      [PaymentMethod.BANK_TRANSFER]: '🏦',
      [PaymentMethod.CHEQUE]: '📝',
      [PaymentMethod.E_WALLET]: '📱',
    };
    return icons[method] || '💰';
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/payments')}>
            {t('common:actions.back')}
          </Button>
          <Badge status={isOnline ? 'success' : 'error'} />
          <span>{isOnline ? <WifiOutlined /> : <DisconnectOutlined />}</span>
          <span>{isOnline ? t('common:network.online') : t('common:network.offline')}</span>
          {queueSize > 0 && (
            <>
              <span>|</span>
              <span style={{ color: '#faad14' }}>{t('common:sync.pendingChanges', { count: queueSize })}</span>
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

        <Title level={3}>
          <DollarOutlined /> {id ? t('payments:editPayment') : t('payments:createPayment')}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            paymentDate: dayjs(),
            status: PaymentStatus.PENDING,
            paymentMethod: PaymentMethod.CASH,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="invoiceId" label={t('invoices:title')}>
                <Select
                  showSearch
                  placeholder={t('common:actions.select')}
                  allowClear
                  onChange={handleInvoiceChange}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {invoices.map((invoice) => (
                    <Option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.totalAmount.toLocaleString('vi-VN')} ₫
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="orderId" label={t('orders:title')}>
                <Select
                  showSearch
                  placeholder={t('common:actions.select')}
                  allowClear
                  onChange={handleOrderChange}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {orders.map((order) => (
                    <Option key={order.id} value={order.id}>
                      {order.orderNumber} - {order.totalAmount.toLocaleString('vi-VN')} ₫
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {(selectedInvoice || selectedOrder) && (
            <Alert
              message={t('payments:paymentInfo')}
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedInvoice && (
                    <>
                      <Text>{t('invoices:invoiceNumber')}: {selectedInvoice.invoiceNumber}</Text>
                      <Text>
                        {t('common:totalAmount')}: {selectedInvoice.totalAmount.toLocaleString('vi-VN')} ₫
                      </Text>
                      <Text>
                        {t('common:paidAmount')}: {selectedInvoice.paidAmount.toLocaleString('vi-VN')} ₫
                      </Text>
                      <Text strong>
                        {t('common:remainingAmount')}:{' '}
                        {(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString(
                          'vi-VN',
                        )}{' '}
                        ₫
                      </Text>
                    </>
                  )}
                  {selectedOrder && (
                    <>
                      <Text>{t('orders:orderNumber')}: {selectedOrder.orderNumber}</Text>
                      <Text>{t('common:totalAmount')}: {selectedOrder.totalAmount.toLocaleString('vi-VN')} ₫</Text>
                      <Text>
                        {t('common:paidAmount')}: {selectedOrder.paidAmount.toLocaleString('vi-VN')} ₫
                      </Text>
                      <Text strong>
                        {t('common:remainingAmount')}:{' '}
                        {(selectedOrder.totalAmount - selectedOrder.paidAmount).toLocaleString(
                          'vi-VN',
                        )}{' '}
                        ₫
                      </Text>
                    </>
                  )}
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="amount"
                label={t('payments:amount')}
                rules={[
                  { required: true, message: t('payments:form.amountRequired') },
                  { type: 'number', min: 0, message: t('payments:form.amountMin') },
                ]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="₫"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="paymentMethod"
                label={t('payments:paymentMethod')}
                rules={[{ required: true, message: t('payments:form.paymentMethodRequired') }]}
              >
                <Select>
                  <Option value={PaymentMethod.CASH}>
                    {getPaymentMethodIcon(PaymentMethod.CASH)} {getMethodLabel(PaymentMethod.CASH)}
                  </Option>
                  <Option value={PaymentMethod.CARD}>
                    {getPaymentMethodIcon(PaymentMethod.CARD)} {getMethodLabel(PaymentMethod.CARD)}
                  </Option>
                  <Option value={PaymentMethod.BANK_TRANSFER}>
                    {getPaymentMethodIcon(PaymentMethod.BANK_TRANSFER)} {getMethodLabel(PaymentMethod.BANK_TRANSFER)}
                  </Option>
                  <Option value={PaymentMethod.CHEQUE}>
                    {getPaymentMethodIcon(PaymentMethod.CHEQUE)} {getMethodLabel(PaymentMethod.CHEQUE)}
                  </Option>
                  <Option value={PaymentMethod.E_WALLET}>
                    {getPaymentMethodIcon(PaymentMethod.E_WALLET)} {getMethodLabel(PaymentMethod.E_WALLET)}
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="paymentDate"
                label={t('payments:paymentDate')}
                rules={[{ required: true, message: t('payments:form.paymentDateRequired') }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" showTime />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="transactionId" label={t('payments:reference')}>
                <Input placeholder={t('payments:form.referencePlaceholder')} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="status" label={t('payments:status')}>
                <Select>
                  <Option value={PaymentStatus.PENDING}>{getStatusLabel(PaymentStatus.PENDING)}</Option>
                  <Option value={PaymentStatus.COMPLETED}>{getStatusLabel(PaymentStatus.COMPLETED)}</Option>
                  <Option value={PaymentStatus.FAILED}>{getStatusLabel(PaymentStatus.FAILED)}</Option>
                  <Option value={PaymentStatus.REFUNDED}>{getStatusLabel(PaymentStatus.REFUNDED)}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label={t('payments:notes')}>
            <TextArea rows={4} placeholder={t('payments:form.notesPlaceholder')} />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                {id ? t('common:actions.update') : t('payments:createPayment')}
              </Button>
              <Button onClick={() => navigate('/dashboard/payments')}>{t('common:actions.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PaymentForm;
