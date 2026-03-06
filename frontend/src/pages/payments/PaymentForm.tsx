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
  message,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  Alert,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import paymentService, {
  PaymentMethod,
  PaymentStatus,
  CreatePaymentDto,
  UpdatePaymentDto,
} from '../../services/paymentService';
import invoiceService from '../../services/invoiceService';
import orderService from '../../services/orderService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PaymentForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    loadInvoices();
    loadOrders();
    if (id) {
      loadPayment();
    }
  }, [id]);

  const loadInvoices = async () => {
    try {
      const response = await invoiceService.getAll({ page: 1, limit: 1000 });
      setInvoices(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách hóa đơn');
    }
  };

  const loadOrders = async () => {
    try {
      const response = await orderService.getAll({ page: 1, limit: 1000 });
      setOrders(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách đơn hàng');
    }
  };

  const loadPayment = async () => {
    try {
      setLoading(true);
      const payment = await paymentService.getById(Number(id));
      
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
        const invoice = await invoiceService.getById(payment.invoiceId);
        setSelectedInvoice(invoice);
      }

      if (payment.orderId) {
        const order = await orderService.getById(payment.orderId);
        setSelectedOrder(order);
      }
    } catch (error) {
      message.error('Không thể tải thông tin thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceChange = async (invoiceId: number) => {
    try {
      const invoice = await invoiceService.getById(invoiceId);
      setSelectedInvoice(invoice);
      form.setFieldValue('amount', invoice.totalAmount - invoice.paidAmount);
    } catch (error) {
      message.error('Không thể tải thông tin hóa đơn');
    }
  };

  const handleOrderChange = async (orderId: number) => {
    try {
      const order = await orderService.getById(orderId);
      setSelectedOrder(order);
      form.setFieldValue('amount', order.totalAmount - order.paidAmount);
    } catch (error) {
      message.error('Không thể tải thông tin đơn hàng');
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
        await paymentService.update(Number(id), paymentData as UpdatePaymentDto);
        message.success('Cập nhật thanh toán thành công');
      } else {
        await paymentService.create(paymentData as CreatePaymentDto);
        message.success('Tạo thanh toán thành công');
      }
      
      navigate('/dashboard/payments');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
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
            Quay lại
          </Button>
        </Space>

        <Title level={3}>
          <DollarOutlined /> {id ? 'Chỉnh sửa thanh toán' : 'Tạo thanh toán mới'}
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
              <Form.Item name="invoiceId" label="Hóa đơn (tùy chọn)">
                <Select
                  showSearch
                  placeholder="Chọn hóa đơn"
                  allowClear
                  onChange={handleInvoiceChange}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {invoices.map(invoice => (
                    <Option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.totalAmount.toLocaleString('vi-VN')} ₫
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="orderId" label="Đơn hàng (tùy chọn)">
                <Select
                  showSearch
                  placeholder="Chọn đơn hàng"
                  allowClear
                  onChange={handleOrderChange}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {orders.map(order => (
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
              message="Thông tin thanh toán"
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedInvoice && (
                    <>
                      <Text>Hóa đơn: {selectedInvoice.invoiceNumber}</Text>
                      <Text>Tổng tiền: {selectedInvoice.totalAmount.toLocaleString('vi-VN')} ₫</Text>
                      <Text>Đã thanh toán: {selectedInvoice.paidAmount.toLocaleString('vi-VN')} ₫</Text>
                      <Text strong>
                        Còn lại: {(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString('vi-VN')} ₫
                      </Text>
                    </>
                  )}
                  {selectedOrder && (
                    <>
                      <Text>Đơn hàng: {selectedOrder.orderNumber}</Text>
                      <Text>Tổng tiền: {selectedOrder.totalAmount.toLocaleString('vi-VN')} ₫</Text>
                      <Text>Đã thanh toán: {selectedOrder.paidAmount.toLocaleString('vi-VN')} ₫</Text>
                      <Text strong>
                        Còn lại: {(selectedOrder.totalAmount - selectedOrder.paidAmount).toLocaleString('vi-VN')} ₫
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
                label="Số tiền"
                rules={[
                  { required: true, message: 'Vui lòng nhập số tiền' },
                  { type: 'number', min: 0, message: 'Số tiền phải lớn hơn 0' },
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
                label="Phương thức thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn phương thức' }]}
              >
                <Select>
                  <Option value={PaymentMethod.CASH}>
                    {getPaymentMethodIcon(PaymentMethod.CASH)} Tiền mặt
                  </Option>
                  <Option value={PaymentMethod.CARD}>
                    {getPaymentMethodIcon(PaymentMethod.CARD)} Thẻ
                  </Option>
                  <Option value={PaymentMethod.BANK_TRANSFER}>
                    {getPaymentMethodIcon(PaymentMethod.BANK_TRANSFER)} Chuyển khoản
                  </Option>
                  <Option value={PaymentMethod.CHEQUE}>
                    {getPaymentMethodIcon(PaymentMethod.CHEQUE)} Séc
                  </Option>
                  <Option value={PaymentMethod.E_WALLET}>
                    {getPaymentMethodIcon(PaymentMethod.E_WALLET)} Ví điện tử
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="paymentDate"
                label="Ngày thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn ngày thanh toán' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" showTime />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="transactionId" label="Mã giao dịch">
                <Input placeholder="Nhập mã giao dịch (nếu có)" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Option value={PaymentStatus.PENDING}>Chờ xử lý</Option>
                  <Option value={PaymentStatus.COMPLETED}>Hoàn thành</Option>
                  <Option value={PaymentStatus.FAILED}>Thất bại</Option>
                  <Option value={PaymentStatus.REFUNDED}>Đã hoàn tiền</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={4} placeholder="Nhập ghi chú" />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                {id ? 'Cập nhật' : 'Tạo thanh toán'}
              </Button>
              <Button onClick={() => navigate('/dashboard/payments')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PaymentForm;
