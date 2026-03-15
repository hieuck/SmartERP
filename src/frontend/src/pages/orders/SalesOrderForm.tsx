import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Table,
  message,
  Card,
  Space,
  DatePicker,
  Badge,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined, SyncOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { logger } from '@/lib/logger/logger.service';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { useResponsive } from '@/hooks/useResponsive';
import MobileFormItemCard from '@/components/common/MobileFormItemCard';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

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
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 });
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
      logger.info('SalesOrderForm', 'Loaded products from IndexedDB', { count: allProducts.length });
    } catch (error) {
      logger.error('SalesOrderForm', 'Failed to load products', error as Error);
      message.error('Không thể tải danh sách sản phẩm');
    }
  };

  const loadCustomers = async () => {
    try {
      const allCustomers = await offlineServices.customers.getAll();
      setCustomers(allCustomers);
      logger.info('SalesOrderForm', 'Loaded customers from IndexedDB', { count: allCustomers.length });
    } catch (error) {
      logger.error('SalesOrderForm', 'Failed to load customers', error as Error);
      message.error('Không thể tải danh sách khách hàng');
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
      message.error('Không thể tải đơn hàng');
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
      message.error('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }

    const invalidItems = items.filter((item) => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      message.error('Vui lòng điền đầy đủ thông tin sản phẩm');
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
        await offlineServices.salesOrders.update(id, orderData);
        message.success('Cập nhật đơn hàng thành công');
        logger.info('SalesOrderForm', 'Updated sales order', { id });
      } else {
        await offlineServices.salesOrders.create(orderData);
        message.success('Tạo đơn hàng thành công');
        logger.info('SalesOrderForm', 'Created sales order');
      }

      // Trigger sync if online
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (token) {
          syncManager.sync(token).catch(err => 
            logger.error('SalesOrderForm', 'Sync after save failed', err)
          );
        }
      }

      navigate('/orders/sales');
    } catch (error: any) {
      logger.error('SalesOrderForm', 'Failed to save order', error);
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

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
        // Reload data after sync
        await loadProducts();
        await loadCustomers();
        if (id) {
          await loadOrder();
        }
      } else {
        message.error(`Đồng bộ thất bại: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('SalesOrderForm', 'Sync failed', error as Error);
      message.error('Đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productId',
      width: '30%',
      render: (value: string, record: OrderItem) => (
        <Select
          value={value}
          onChange={(val) => updateItem(record.key, 'productId', val)}
          placeholder="Chọn sản phẩm"
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
      title: 'Số lượng',
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
      title: 'Đơn giá',
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
      title: 'Giảm giá',
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
      title: 'Thành tiền',
      dataIndex: 'subtotal',
      width: '15%',
      render: (value: number) => (value || 0).toLocaleString('vi-VN'),
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
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders/sales')}>
            Quay Lại
          </Button>
          <Badge status={isOnline ? 'success' : 'error'} />
          <span>{isOnline ? <WifiOutlined /> : <DisconnectOutlined />}</span>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
          {queueSize > 0 && (
            <>
              <span>|</span>
              <span style={{ color: '#faad14' }}>{queueSize} thay đổi chưa đồng bộ</span>
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
      </div>
      <Card title={id ? 'Sửa đơn hàng' : 'Tạo đơn hàng mới'}>
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
            label="Khách hàng"
            name="customerId"
            rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
          >
            <Select
              placeholder="Chọn khách hàng"
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
              label="Ngày đặt hàng"
              name="orderDate"
              rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
            >
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item label="Ngày giao hàng" name="deliveryDate">
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
          </Space>

          <div style={{ marginBottom: 16 }}>
            <Button type="dashed" onClick={addItem} icon={<PlusOutlined />} block>
              Thêm sản phẩm
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
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Sản phẩm</div>
                    <Select
                      value={item.productId}
                      onChange={(val) => updateItem(item.key, 'productId', val)}
                      placeholder="Chọn sản phẩm"
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
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Số lượng</div>
                      <InputNumber
                        min={1}
                        value={item.quantity ?? 1}
                        onChange={(val) => updateItem(item.key, 'quantity', val ?? 1)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Đơn giá</div>
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
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Giảm giá</div>
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
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Thành tiền</div>
                      <div
                        style={{
                          padding: '4px 11px',
                          border: '1px solid #d9d9d9',
                          borderRadius: 6,
                          background: '#f5f5f5',
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {(item.subtotal || 0).toLocaleString('vi-VN')} đ
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
                <span>Tạm tính:</span>
                <strong>{totals.subtotal.toLocaleString('vi-VN')} đ</strong>
              </div>

              <Form.Item label="Thuế" name="tax" style={{ marginBottom: 8 }}>
                <InputNumber
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label="Phí vận chuyển" name="shippingFee" style={{ marginBottom: 8 }}>
                <InputNumber
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label="Giảm giá" name="discount" style={{ marginBottom: 8 }}>
                <InputNumber
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
                <span>Tổng cộng:</span>
                <strong style={{ color: '#1890ff' }}>
                  {totals.total.toLocaleString('vi-VN')} đ
                </strong>
              </div>
            </Space>
          </div>

          <Form.Item label="Ghi chú" name="notes">
            <TextArea rows={3} placeholder="Ghi chú đơn hàng" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? 'Cập nhật' : 'Tạo đơn hàng'}
              </Button>
              <Button onClick={() => navigate('/orders/sales')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
