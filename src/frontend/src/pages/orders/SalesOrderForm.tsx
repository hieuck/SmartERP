import MobileFormItemCard from '@/components/common/MobileFormItemCard';
import { useResponsive } from '@/hooks/useResponsive';
import { logger } from '@/lib/logger/logger.service';
import { syncManager } from '@/lib/offline/sync-manager';
import { offlineServices } from '@/services/offline-services';
import { formatCurrency } from '@/utils/responsive';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  PlusOutlined,
  SyncOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  message,
  theme,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;
const { useToken } = theme;

interface OrderItem {
  key: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export default function SalesOrderForm() {
  const { isMobile } = useResponsive();
  const { t, i18n } = useTranslation(['orders', 'commonUi']);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useToken();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 });
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  const memoizedFormatCurrency = useCallback(
    (value: number) => formatCurrency(value, i18n.language),
    [i18n.language],
  );

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
            logger.info('SalesOrderForm', 'Auto-sync completed');
          } catch (error) {
            logger.error('SalesOrderForm', 'Auto-sync failed', error as Error);
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
    loadProducts();
    loadCustomers();
    if (id) {
      loadOrder();
    }
  }, [id]);

  useEffect(() => {
    calculateTotals();
  }, [items]);

  const loadProducts = async () => {
    try {
      const allProducts = await offlineServices.products.getAll();
      setProducts(allProducts);
      logger.info('SalesOrderForm', 'Loaded products from IndexedDB', {
        count: allProducts.length,
      });
    } catch (error) {
      logger.error('SalesOrderForm', 'Failed to load products', error as Error);
      message.error(t('orders:messages.loadProductsError'));
    }
  };

  const loadCustomers = async () => {
    try {
      const allCustomers = await offlineServices.customers.getAll();
      setCustomers(allCustomers);
      logger.info('SalesOrderForm', 'Loaded customers from IndexedDB', {
        count: allCustomers.length,
      });
    } catch (error) {
      logger.error('SalesOrderForm', 'Failed to load customers', error as Error);
      message.error(t('orders:messages.loadCustomersError'));
    }
  };

  const loadOrder = async () => {
    try {
      setLoading(true);
      const order = await offlineServices.salesOrders.getById(id!);

      if (order) {
        form.setFieldsValue({
          customerId: order.customerId,
          orderDate: dayjs(order.orderDate),
          deliveryDate: order.deliveryDate ? dayjs(order.deliveryDate) : null,
          tax: Number(order.taxAmount || order.tax) || 0,
          shippingFee: Number(order.shippingFee) || 0,
          discount: Number(order.discountAmount || order.discount) || 0,
          notes: order.notes,
        });

        if (order.items && Array.isArray(order.items)) {
          setItems(
            order.items.map((item: any, index: number) => {
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.unitPrice) || 0;
              const discount = Number(item.discountAmount || item.discount) || 0;

              return {
                key: `${index}`,
                productId: item.productId,
                productName: item.productName,
                quantity,
                unitPrice,
                discount,
                subtotal: quantity * unitPrice - discount,
              };
            }),
          );
        }

        logger.info('SalesOrderForm', 'Loaded order from IndexedDB', { id });
      }
    } catch (error) {
      logger.error('SalesOrderForm', 'Error loading sales order', error as Error);
      message.error(t('orders:messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newItem: OrderItem = {
      key: Date.now().toString(),
      productId: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      subtotal: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (key: string) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const updateItem = (key: string, field: keyof OrderItem, value: any) => {
    const newItems = items.map((item) => {
      if (item.key === key) {
        const updated = { ...item, [field]: value };

        if (field === 'productId') {
          const product = products.find((p) => p.id === value);
          if (product) {
            updated.productName = product.name;
            updated.unitPrice = product.price || 0;
          }
        }

        // ALWAYS recalculate subtotal for any field change
        const quantity = Number(updated.quantity) || 0;
        const unitPrice = Number(updated.unitPrice) || 0;
        const discount = Number(updated.discount) || 0;
        updated.subtotal = quantity * unitPrice - discount;

        return updated;
      }
      return item;
    });
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    const tax = Number(form.getFieldValue('tax')) || 0;
    const shipping = Number(form.getFieldValue('shippingFee')) || 0;
    const discount = Number(form.getFieldValue('discount')) || 0;
    const total = subtotal + tax + shipping - discount;

    setTotals({ subtotal, tax, shipping, discount, total });
  };

  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      message.error(t('orders:form.validation.itemsRequired'));
      return;
    }

    const invalidItems = items.filter((item) => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      message.error(t('orders:form.validation.itemsInvalid'));
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        customerId: values.customerId,
        orderDate: values.orderDate.format('YYYY-MM-DD'),
        expectedDeliveryDate: values.deliveryDate ? values.deliveryDate.format('YYYY-MM-DD') : null,
        discountAmount: values.discount || 0,
        shippingFee: values.shippingFee || 0,
        taxAmount: values.tax || 0,
        totalAmount: totals.total,
        shippingAddress: values.shippingAddress,
        billingAddress: values.billingAddress,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
        status: 'pending',
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discount,
          subtotal: item.subtotal,
        })),
      };

      if (id) {
        await offlineServices.salesOrders.update(id, orderData as any);
        message.success(t('orders:form.messages.updateSuccess'));
        logger.info('SalesOrderForm', 'Updated sales order', { id });
      } else {
        await offlineServices.salesOrders.create(orderData as any);
        message.success(t('orders:form.messages.createSuccess'));
        logger.info('SalesOrderForm', 'Created sales order');
      }

      // Trigger sync if online
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (token) {
          syncManager
            .sync(token)
            .catch((err) => logger.error('SalesOrderForm', 'Sync after save failed', err));
        }
      }

      navigate('/orders/sales');
    } catch (error: any) {
      logger.error('SalesOrderForm', 'Failed to save order', error);
      message.error(error.message || t('orders:form.messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  // Manual sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error(t('commonUi:messages.loginRequired'));
      return;
    }

    try {
      setSyncing(true);
      const result = await syncManager.sync(token);

      if (result.success) {
        message.success(
          t('commonUi:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          }),
        );
        // Reload data after sync
        await loadProducts();
        await loadCustomers();
        if (id) {
          await loadOrder();
        }
      } else {
        message.error(t('commonUi:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('SalesOrderForm', 'Sync failed', error as Error);
      message.error(t('commonUi:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: t('orders:form.table.product'),
        dataIndex: 'productId',
        width: '30%',
        render: (value: string, record: OrderItem) => (
          <Select
            value={value}
            onChange={(val) => updateItem(record.key, 'productId', val)}
            placeholder={t('orders:form.placeholders.selectProduct')}
            showSearch
            filterOption={(input, option) =>
              (option?.children as string).toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: '100%' }}
          >
            {products.map((product) => (
              <Option key={product.id} value={product.id}>
                {product.name} - {product.sku}
              </Option>
            ))}
          </Select>
        ),
      },
      {
        title: t('orders:form.table.quantity'),
        dataIndex: 'quantity',
        width: '15%',
        render: (value: number, record: OrderItem) => (
          <InputNumber
            min={1}
            value={value ?? 1}
            onChange={(val) => updateItem(record.key, 'quantity', val ?? 1)}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: t('orders:form.table.unitPrice'),
        dataIndex: 'unitPrice',
        width: '15%',
        render: (value: number, record: OrderItem) => (
          <InputNumber
            min={0}
            value={value ?? 0}
            onChange={(val) => updateItem(record.key, 'unitPrice', val ?? 0)}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: t('orders:form.table.discount'),
        dataIndex: 'discount',
        width: '15%',
        render: (value: number, record: OrderItem) => (
          <InputNumber
            min={0}
            value={value ?? 0}
            onChange={(val) => updateItem(record.key, 'discount', val ?? 0)}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            style={{ width: '100%' }}
            placeholder="0"
          />
        ),
      },
      {
        title: t('orders:form.table.subtotal'),
        dataIndex: 'subtotal',
        width: '15%',
        render: (value: number) => memoizedFormatCurrency(value || 0),
      },
      {
        title: '',
        width: '10%',
        render: (_: any, record: OrderItem) => (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeItem(record.key)}
          />
        ),
      },
    ],
    [t, products, memoizedFormatCurrency],
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders/sales')}>
            {t('orders:form.buttons.back')}
          </Button>
          <Badge status={isOnline ? 'success' : 'error'} />
          <span>{isOnline ? <WifiOutlined /> : <DisconnectOutlined />}</span>
          <span>{isOnline ? t('orders:sync.online') : t('orders:sync.offline')}</span>
          {queueSize > 0 && (
            <>
              <span>|</span>
              <span style={{ color: '#faad14' }}>
                {t('orders:sync.queueSize', { count: queueSize })}
              </span>
            </>
          )}
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
            size="small"
          >
            {t('orders:sync.syncButton')}
          </Button>
        </Space>
      </div>
      <Card title={id ? t('orders:form.title.edit') : t('orders:form.title.create')}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            orderDate: dayjs(),
            tax: 0,
            shippingFee: 0,
            discount: 0,
          }}
        >
          <Form.Item
            label={t('orders:form.fields.customer')}
            name="customerId"
            rules={[{ required: true, message: t('orders:form.validation.customerRequired') }]}
          >
            <Select
              placeholder={t('orders:form.placeholders.selectCustomer')}
              showSearch
              filterOption={(input, option) =>
                (option?.children as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {customers.map((customer) => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.code}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              label={t('orders:form.fields.orderDate')}
              name="orderDate"
              rules={[{ required: true, message: t('orders:form.validation.orderDateRequired') }]}
            >
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item label={t('orders:form.fields.deliveryDate')} name="deliveryDate">
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
          </Space>

          <div style={{ marginBottom: 16 }}>
            <Button type="dashed" onClick={addItem} icon={<PlusOutlined />} block>
              {t('orders:form.buttons.addProduct')}
            </Button>
          </div>

          {isMobile ? (
            /* Mobile: Card View */
            <div>
              {items.map((item, index) => (
                <MobileFormItemCard
                  key={item.key}
                  index={index}
                  onRemove={() => removeItem(item.key)}
                >
                  <div>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                      {t('orders:form.table.product')}
                    </div>
                    <Select
                      value={item.productId}
                      onChange={(val) => updateItem(item.key, 'productId', val)}
                      placeholder={t('orders:form.placeholders.selectProduct')}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as string).toLowerCase().includes(input.toLowerCase())
                      }
                      style={{ width: '100%' }}
                    >
                      {products.map((product) => (
                        <Option key={product.id} value={product.id}>
                          {product.name} - {product.sku}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                        {t('orders:form.table.quantity')}
                      </div>
                      <InputNumber
                        min={1}
                        value={item.quantity ?? 1}
                        onChange={(val) => updateItem(item.key, 'quantity', val ?? 1)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                        {t('orders:form.table.unitPrice')}
                      </div>
                      <InputNumber
                        min={0}
                        value={item.unitPrice ?? 0}
                        onChange={(val) => updateItem(item.key, 'unitPrice', val ?? 0)}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                        {t('orders:form.table.discount')}
                      </div>
                      <InputNumber
                        min={0}
                        value={item.discount ?? 0}
                        onChange={(val) => updateItem(item.key, 'discount', val ?? 0)}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        style={{ width: '100%' }}
                        placeholder="0"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                        {t('orders:form.table.subtotal')}
                      </div>
                      <div
                        style={{
                          padding: '4px 11px',
                          border: '1px solid #d9d9d9',
                          borderRadius: 6,
                          background: token.colorBgElevated,
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {memoizedFormatCurrency(item.subtotal || 0)}
                      </div>
                    </div>
                  </div>
                </MobileFormItemCard>
              ))}
            </div>
          ) : (
            /* Desktop: Table View */
            <Table
              columns={columns}
              dataSource={items}
              pagination={false}
              bordered
              size="middle"
              scroll={{ x: 'max-content' }}
            />
          )}

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space direction="vertical" style={{ width: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('orders:form.totals.subtotal')}:</span>
                <strong>{memoizedFormatCurrency(totals.subtotal)}</strong>
              </div>

              <Form.Item label={t('orders:form.fields.tax')} name="tax" style={{ marginBottom: 8 }}>
                <InputNumber
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  style={{ width: '100%' }}
                  onChange={calculateTotals}
                />
              </Form.Item>

              <Form.Item
                label={t('orders:form.fields.shippingFee')}
                name="shippingFee"
                style={{ marginBottom: 8 }}
              >
                <InputNumber
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  style={{ width: '100%' }}
                  onChange={calculateTotals}
                />
              </Form.Item>

              <Form.Item
                label={t('orders:form.fields.discount')}
                name="discount"
                style={{ marginBottom: 8 }}
              >
                <InputNumber
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  style={{ width: '100%' }}
                  onChange={calculateTotals}
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
                <span>{t('orders:form.totals.total')}:</span>
                <strong style={{ color: '#1890ff' }}>{memoizedFormatCurrency(totals.total)}</strong>
              </div>
            </Space>
          </div>

          <Form.Item label={t('orders:form.fields.notes')} name="notes">
            <TextArea rows={3} placeholder={t('orders:form.placeholders.notes')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? t('orders:form.buttons.update') : t('orders:form.buttons.create')}
              </Button>
              <Button onClick={() => navigate('/orders/sales')}>
                {t('orders:form.buttons.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
