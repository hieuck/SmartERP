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
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import invoiceService, {
  InvoiceStatus,
  CreateInvoiceDto,
  UpdateInvoiceDto,
} from '@/services/accounting/invoiceService';
import customerService from '@/services/crm/customerService';
import orderService from '@/services/order/orderService';

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
      const response = await customerService.getAll({ page: 1, limit: 1000 });
      setCustomers(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách khách hàng');
    }
  };

  const loadOrders = async (customerId: number) => {
    try {
      const response = await orderService.getAll({ customerId, page: 1, limit: 100 });
      setOrders(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách đơn hàng');
    }
  };

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const invoice = await invoiceService.getById(Number(id));

      form.setFieldsValue({
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        orderId: invoice.orderId,
        issueDate: dayjs(invoice.issueDate),
        dueDate: dayjs(invoice.dueDate),
        status: invoice.status,
        notes: invoice.notes,
      });

      setTax(invoice.taxAmount);
      setDiscount(invoice.discountAmount);

      // Load items if available
      if (invoice.orderId) {
        await loadOrders(invoice.customerId);
      }
    } catch (error) {
      message.error('Không thể tải thông tin hóa đơn');
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

  const handleCustomerChange = (customerId: number) => {
    form.setFieldValue('orderId', undefined);
    setOrders([]);
    loadOrders(customerId);
  };

  const handleOrderChange = async (orderId: number) => {
    try {
      const order = await orderService.getById(orderId);
      const orderItems: InvoiceItem[] = order.items.map((item: any, index: number) => ({
        key: `item-${index}`,
        description: item.product?.name || item.description || 'Sản phẩm',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
      }));
      setItems(orderItems);
    } catch (error) {
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
      message.warning('Vui lòng thêm ít nhất một mục hàng');
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
      };

      if (id) {
        await invoiceService.update(Number(id), invoiceData as UpdateInvoiceDto);
        message.success('Cập nhật hóa đơn thành công');
      } else {
        await invoiceService.create(invoiceData as CreateInvoiceDto);
        message.success('Tạo hóa đơn thành công');
      }

      navigate('/dashboard/invoices');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: InvoiceItem) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.key, 'description', e.target.value)}
          placeholder="Nhập mô tả"
        />
      ),
    },
    {
      title: 'Số lượng',
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
      title: 'Đơn giá',
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
      title: 'Thành tiền',
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
            Quay lại
          </Button>
        </Space>

        <Title level={3}>{id ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}</Title>

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
                label="Khách hàng"
                rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
              >
                <Select
                  showSearch
                  placeholder="Chọn khách hàng"
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
