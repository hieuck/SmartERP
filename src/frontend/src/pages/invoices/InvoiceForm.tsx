import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  DatePicker,
  InputNumber,
  Table,
  Space,
  message,
  Row,
  Col,
  Divider,
  Typography,
  Badge,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined, SyncOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { InvoiceStatus } from '@/services/accounting/invoiceService';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface InvoiceItem {
  key: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

const InvoiceForm: React.FC = () => {
  const { t } = useTranslation(['invoices', 'common']);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

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
            logger.info('InvoiceForm', 'Auto-sync completed');
          } catch (error) {
            logger.error('InvoiceForm', 'Auto-sync failed', error as Error);
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
    loadCustomers();
    if (id) {
      loadInvoice();
    }
  }, [id]);

  useEffect(() => {
    calculateTotals();
  }, [items, tax, discount]);

  const loadCustomers = async () => {
    try {
      const allCustomers = await offlineServices.customers.getAll();
      setCustomers(allCustomers);
      logger.info('InvoiceForm', 'Loaded customers from IndexedDB', { count: allCustomers.length });
    } catch (error) {
      logger.error('InvoiceForm', 'Failed to load customers', error as Error);
      message.error(t('invoices:messages.loadCustomersError'));
    }
  };

  const loadOrders = async (customerId: string) => {
    try {
      const allOrders = await offlineServices.salesOrders.getAll();
      const customerOrders = allOrders.filter(order => order.customerId === customerId);
      setOrders(customerOrders);
      logger.info('InvoiceForm', 'Loaded orders from IndexedDB', { count: customerOrders.length });
    } catch (error) {
      logger.error('InvoiceForm', 'Failed to load orders', error as Error);
      message.error('Không thể tải danh sách đơn hàng');
    }
  };

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const invoice = await offlineServices.invoices.getById(id!);

      if (invoice) {
        form.setFieldsValue({
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          orderId: invoice.orderId,
          issueDate: dayjs(invoice.issueDate),
          dueDate: dayjs(invoice.dueDate),
          status: invoice.status,
          notes: invoice.notes,
        });

        setTax(invoice.taxAmount || 0);
        setDiscount(invoice.discountAmount || 0);

        // Load items if available
        if (invoice.orderId) {
          await loadOrders(invoice.customerId);
        }

        logger.info('InvoiceForm', 'Loaded invoice from IndexedDB', { id });
      }
    } catch (error) {
      logger.error('InvoiceForm', 'Failed to load invoice', error as Error);
      message.error(t('invoices:messages.loadInvoiceError'));
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const sub = items.reduce((sum, item) => sum + item.amount, 0);
    setSubtotal(sub);
    const totalAmount = sub + tax - discount;
    setTotal(totalAmount);
  };

  const handleCustomerChange = (customerId: string) => {
    form.setFieldValue('orderId', undefined);
    setOrders([]);
    loadOrders(customerId);
  };

  const handleOrderChange = async (orderId: string) => {
    try {
      const order = await offlineServices.salesOrders.getById(orderId);
      if (order && order.items) {
        const orderItems: InvoiceItem[] = order.items.map((item: any, index: number) => ({
          key: `item-${index}`,
          description: item.productName || item.description || 'Sản phẩm',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        }));
        setItems(orderItems);
        logger.info('InvoiceForm', 'Loaded order items from IndexedDB', { orderId, count: orderItems.length });
      }
    } catch (error) {
      logger.error('InvoiceForm', 'Failed to load order', error as Error);
      message.error('Không thể tải thông tin đơn hàng');
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      key: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (key: string) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const updateItem = (key: string, field: keyof InvoiceItem, value: any) => {
    const newItems = items.map((item) => {
      if (item.key === key) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    });
    setItems(newItems);
  };

  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      message.warning(t('common:messages.addItemRequired'));
      return;
    }

    try {
      setLoading(true);

      const invoiceData = {
        customerId: values.customerId,
        orderId: values.orderId,
        issueDate: values.issueDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        subtotal,
        taxAmount: tax,
        discountAmount: discount,
        totalAmount: total,
        status: values.status || InvoiceStatus.DRAFT,
        notes: values.notes,
        invoiceNumber: values.invoiceNumber || `INV-${Date.now()}`,
      };

      if (id) {
        await offlineServices.invoices.update(id, invoiceData);
        message.success(t('invoices:messages.updateSuccess'));
        logger.info('InvoiceForm', 'Updated invoice', { id });
      } else {
        await offlineServices.invoices.create(invoiceData);
        message.success(t('invoices:messages.createSuccess'));
        logger.info('InvoiceForm', 'Created invoice', { invoiceNumber: invoiceData.invoiceNumber });
      }

      // Trigger sync if online
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (token) {
          syncManager.sync(token).catch(err => 
            logger.error('InvoiceForm', 'Sync after save failed', err)
          );
        }
      }

      navigate('/dashboard/invoices');
    } catch (error: any) {
      logger.error('InvoiceForm', 'Failed to save invoice', error);
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
        message.success(`${t('common:messages.syncSuccess')}: ${result.pulled} pulled, ${result.pushed} pushed`);
        // Reload data after sync
        await loadCustomers();
        if (id) {
          await loadInvoice();
        }
      } else {
        message.error(`Đồng bộ thất bại: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('InvoiceForm', 'Sync failed', error as Error);
      message.error('Đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    {
      title: t('common:columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: InvoiceItem) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.key, 'description', e.target.value)}
          placeholder={t('common:placeholders.enterDescription')}
        />
      ),
    },
    {
      title: t('common:columns.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (value: number, record: InvoiceItem) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => updateItem(record.key, 'quantity', val || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: t('common:columns.unitPrice'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      render: (value: number, record: InvoiceItem) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(val) => updateItem(record.key, 'unitPrice', val || 0)}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: t('common:columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (value: number) => <Text strong>{value.toLocaleString('vi-VN')} ₫</Text>,
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_: any, record: InvoiceItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.key)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/invoices')}>
            {t('invoices:actions.back')}
          </Button>
          <Badge status={isOnline ? 'success' : 'error'} />
          <span>{isOnline ? <WifiOutlined /> : <DisconnectOutlined />}</span>
          <span>{isOnline ? t('common:status.online') : t('common:status.offline')}</span>
          {queueSize > 0 && (
            <>
              <span>|</span>
              <span style={{ color: '#faad14' }}>{queueSize} {t('common:sync.pendingChanges')}</span>
            </>
          )}
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
            size="small"
          >
            {t('common:actions.sync')}
          </Button>
        </Space>

        <Title level={3}>{id ? t('invoices:form.editTitle') : t('invoices:form.createTitle')}</Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            issueDate: dayjs(),
            dueDate: dayjs().add(30, 'day'),
            status: InvoiceStatus.DRAFT,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="customerId"
                label={t('invoices:form.customer')}
                rules={[{ required: true, message: t('invoices:form.customerRequired') }]}
              >
                <Select
                  showSearch
                  placeholder={t('invoices:form.selectCustomer')}
                  optionFilterProp="children"
                  onChange={handleCustomerChange}
                  filterOption={(input, option) =>
                    (option?.children as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {customers.map((customer) => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="orderId" label="Đơn hàng (tùy chọn)">
                <Select placeholder="Chọn đơn hàng" allowClear onChange={handleOrderChange}>
                  {orders.map((order) => (
                    <Option key={order.id} value={order.id}>
                      {order.orderNumber} - {order.totalAmount.toLocaleString('vi-VN')} ₫
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="issueDate"
                label="Ngày phát hành"
                rules={[{ required: true, message: 'Vui lòng chọn ngày phát hành' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="dueDate"
                label="Ngày đáo hạn"
                rules={[{ required: true, message: 'Vui lòng chọn ngày đáo hạn' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Option value={InvoiceStatus.DRAFT}>Nháp</Option>
                  <Option value={InvoiceStatus.SENT}>Đã gửi</Option>
                  <Option value={InvoiceStatus.PAID}>Đã thanh toán</Option>
                  <Option value={InvoiceStatus.OVERDUE}>Quá hạn</Option>
                  <Option value={InvoiceStatus.CANCELLED}>Đã hủy</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Chi tiết hóa đơn</Divider>

          <Button
            type="dashed"
            onClick={addItem}
            icon={<PlusOutlined />}
            style={{ marginBottom: 16, width: '100%' }}
          >
            Thêm mục hàng
          </Button>

          <Table columns={columns} dataSource={items} pagination={false} bordered size="small" />

          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col xs={24} md={12}>
              <Form.Item name="notes" label="Ghi chú">
                <TextArea rows={4} placeholder="Nhập ghi chú" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row justify="space-between">
                    <Text>Tạm tính:</Text>
                    <Text strong>{subtotal.toLocaleString('vi-VN')} ₫</Text>
                  </Row>

                  <Row justify="space-between" align="middle">
                    <Text>Thuế:</Text>
                    <InputNumber
                      min={0}
                      value={tax}
                      onChange={(val) => setTax(val || 0)}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                      style={{ width: 150 }}
                    />
                  </Row>

                  <Row justify="space-between" align="middle">
                    <Text>Giảm giá:</Text>
                    <InputNumber
                      min={0}
                      value={discount}
                      onChange={(val) => setDiscount(val || 0)}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                      style={{ width: 150 }}
                    />
                  </Row>

                  <Divider style={{ margin: '12px 0' }} />

                  <Row justify="space-between">
                    <Title level={5}>Tổng cộng:</Title>
                    <Title level={5} type="danger">
                      {total.toLocaleString('vi-VN')} ₫
                    </Title>
                  </Row>
                </Space>
              </Card>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                {id ? 'Cập nhật' : 'Tạo hóa đơn'}
              </Button>
              <Button onClick={() => navigate('/dashboard/invoices')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default InvoiceForm;
