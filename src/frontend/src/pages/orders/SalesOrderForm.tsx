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
} from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import orderService from '@/services/order/orderService';
import { productService } from '@/services/inventory/productService';
import { customerService } from '@/services/crm/customerService';
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
      const response = await productService.getProducts({ page: 1, limit: 1000 });
      setProducts(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm');
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomers({ page: 1, limit: 1000 });
      setCustomers(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách khách hàng');
    }
  };

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getSalesOrder(id!);
      const order = response.data || response; // Handle both {data: ...} and direct response

      form.setFieldsValue({
        customerId: order.customerId,
        orderDate: dayjs(order.orderDate),
        deliveryDate: order.deliveryDate ? dayjs(order.deliveryDate) : null,
        tax: Number(order.taxAmount || order.tax) || 0,
        shippingFee: Number(order.shippingFee) || 0,
        discount: Number(order.discountAmount || order.discount) || 0,
        notes: order.notes,
      });

      setItems(
        order.items.map((item: any, index: number) => {
          const quantity = Number(item.quantity) || 0;
          const unitPrice = Number(item.unitPrice) || 0;
          const discount = Number(item.discountAmount || item.discount) || 0;

          return {
            key: `${index}`,
            productId: item.productId,
            productName: item.product?.name || item.productName,
            quantity,
            unitPrice,
            discount,
            subtotal: quantity * unitPrice - discount,
          };
        }),
      );
    } catch (error) {
      console.error('Error loading sales order:', error);
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
        shippingAddress: values.shippingAddress,
        billingAddress: values.billingAddress,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: 0,
          taxPercent: 0,
        })),
      };

      if (id) {
        await orderService.updateSalesOrder(id, orderData);
        message.success('Cập nhật đơn hàng thành công');
        navigate('/orders/sales');
      } else {
        await orderService.createSalesOrder(orderData);
        message.success('Tạo đơn hàng thành công');
        navigate('/orders/sales');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders/sales')}>
          Quay Lại
        </Button>
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
