import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Input,
  Button,
  Table,
  Space,
  message,
  Tabs,
  Tag,
  List,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import orderService from '@/services/order/orderService';
import { customerService } from '@/services/crm/customerService';
import { supplierService } from '@/services/logistics/supplierService';
import dayjs from 'dayjs';
import { useResponsive } from '@/hooks/useResponsive';
import { logger } from '@/lib/logger/logger.service';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

export default function PaymentPage() {
  const { isMobile } = useResponsive();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('receivable');
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
    loadSuppliers();
    loadReceivables();
    loadPayables();
    loadPayments();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getCustomers({ page: 1, limit: 1000 });
      setCustomers(data.data || []);
    } catch (error) {
      logger.error('PaymentPage', 'Error loading customers', error as Error);
      setCustomers([]);
      message.error('Không thể tải danh sách khách hàng');
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getSuppliers({ page: 1, limit: 1000 });
      setSuppliers(data.data || []);
    } catch (error) {
      logger.error('PaymentPage', 'Error loading suppliers', error as Error);
      setSuppliers([]);
      message.error('Không thể tải danh sách nhà cung cấp');
    }
  };

  const loadReceivables = async () => {
    try {
      const data = await orderService.getAccountsReceivable();
      setReceivables(data.data || []);
    } catch (error) {
      logger.error('PaymentPage', 'Error loading receivables', error as Error);
      setReceivables([]);
    }
  };

  const loadPayables = async () => {
    try {
      const data = await orderService.getAccountsPayable();
      setPayables(data.data || []);
    } catch (error) {
      logger.error('PaymentPage', 'Error loading payables', error as Error);
      setPayables([]);
    }
  };

  const loadPayments = async () => {
    try {
      const data = await orderService.getPayments();
      setPayments(data.data || []);
    } catch (error) {
      logger.error('PaymentPage', 'Error loading payments', error as Error);
      setPayments([]);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const paymentData = {
        ...values,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        type: activeTab === 'receivable' ? 'receipt' : 'payment',
      };

      await orderService.createPayment(paymentData);
      message.success('Ghi nhận thanh toán thành công');
      form.resetFields();
      loadReceivables();
      loadPayables();
      loadPayments();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const receivableColumns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Tổng nợ',
      dataIndex: 'totalDebt',
      key: 'totalDebt',
      align: 'right' as const,
      render: (value: number) => `${(value || 0).toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paid',
      key: 'paid',
      align: 'right' as const,
      render: (value: number) => `${(value || 0).toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Còn lại',
      dataIndex: 'remaining',
      key: 'remaining',
      align: 'right' as const,
      render: (value: number) => (
        <strong style={{ color: value > 0 ? '#ff4d4f' : '#52c41a' }}>
          {(value || 0).toLocaleString('vi-VN')} đ
        </strong>
      ),
    },
  ];

  const payableColumns = [
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: 'Tổng nợ',
      dataIndex: 'totalDebt',
      key: 'totalDebt',
      align: 'right' as const,
      render: (value: number) => `${(value || 0).toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paid',
      key: 'paid',
      align: 'right' as const,
      render: (value: number) => `${(value || 0).toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Còn lại',
      dataIndex: 'remaining',
      key: 'remaining',
      align: 'right' as const,
      render: (value: number) => (
        <strong style={{ color: value > 0 ? '#ff4d4f' : '#52c41a' }}>
          {(value || 0).toLocaleString('vi-VN')} đ
        </strong>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: 'Ngày',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'receipt' ? 'green' : 'blue'}>
          {type === 'receipt' ? 'Thu tiền' : 'Chi tiền'}
        </Tag>
      ),
    },
    {
      title: 'Đối tượng',
      dataIndex: 'partnerName',
      key: 'partnerName',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (value: number) => `${(value || 0).toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      width: 120,
      render: (method: string) => {
        const labels: Record<string, string> = {
          cash: 'Tiền mặt',
          bank: 'Chuyển khoản',
          card: 'Thẻ',
          other: 'Khác',
        };
        return labels[method] || method;
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Ghi nhận thanh toán" style={{ marginBottom: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Thu tiền từ khách hàng" key="receivable">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                paymentDate: dayjs(),
                method: 'cash',
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

              <Space size="large">
                <Form.Item
                  label="Số tiền"
                  name="amount"
                  rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
                >
                  <InputNumber
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    style={{ width: 200 }}
                  />
                </Form.Item>

                <Form.Item
                  label="Ngày thanh toán"
                  name="paymentDate"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                  <DatePicker format="DD/MM/YYYY" />
                </Form.Item>

                <Form.Item
                  label="Phương thức"
                  name="method"
                  rules={[{ required: true, message: 'Vui lòng chọn phương thức' }]}
                >
                  <Select style={{ width: 150 }}>
                    <Option value="cash">Tiền mặt</Option>
                    <Option value="bank">Chuyển khoản</Option>
                    <Option value="card">Thẻ</Option>
                    <Option value="other">Khác</Option>
                  </Select>
                </Form.Item>
              </Space>

              <Form.Item label="Ghi chú" name="notes">
                <TextArea rows={2} placeholder="Ghi chú thanh toán" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
                  Ghi nhận thu tiền
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="Chi tiền cho nhà cung cấp" key="payable">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                paymentDate: dayjs(),
                method: 'cash',
              }}
            >
              <Form.Item
                label="Nhà cung cấp"
                name="supplierId"
                rules={[{ required: true, message: 'Vui lòng chọn nhà cung cấp' }]}
              >
                <Select
                  placeholder="Chọn nhà cung cấp"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {suppliers.map((supplier) => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.name} - {supplier.code}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Space size="large">
                <Form.Item
                  label="Số tiền"
                  name="amount"
                  rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
                >
                  <InputNumber
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    style={{ width: 200 }}
                  />
                </Form.Item>

                <Form.Item
                  label="Ngày thanh toán"
                  name="paymentDate"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                  <DatePicker format="DD/MM/YYYY" />
                </Form.Item>

                <Form.Item
                  label="Phương thức"
                  name="method"
                  rules={[{ required: true, message: 'Vui lòng chọn phương thức' }]}
                >
                  <Select style={{ width: 150 }}>
                    <Option value="cash">Tiền mặt</Option>
                    <Option value="bank">Chuyển khoản</Option>
                    <Option value="card">Thẻ</Option>
                    <Option value="other">Khác</Option>
                  </Select>
                </Form.Item>
              </Space>

              <Form.Item label="Ghi chú" name="notes">
                <TextArea rows={2} placeholder="Ghi chú thanh toán" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
                  Ghi nhận chi tiền
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>

      <Card title="Công nợ phải thu" style={{ marginBottom: 24 }}>
        {isMobile ? (
          <List
            dataSource={receivables}
            renderItem={(item: any) => (
              <Card size="small" style={{ marginBottom: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Khách hàng</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.customerName}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Tổng nợ</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#ff4d4f' }}>
                      {item.totalDebt?.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Đã thanh toán</div>
                    <div style={{ fontSize: 14, color: '#52c41a' }}>
                      {item.paidAmount?.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              </Card>
            )}
          />
        ) : (
          <Table
            size="middle"
            scroll={{ x: 'max-content' }}
            columns={receivableColumns}
            dataSource={receivables}
            rowKey="customerId"
            pagination={false}
          />
        )}
      </Card>

      <Card title="Công nợ phải trả" style={{ marginBottom: 24 }}>
        {isMobile ? (
          <List
            dataSource={payables}
            renderItem={(item: any) => (
              <Card size="small" style={{ marginBottom: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Nhà cung cấp</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.supplierName}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Tổng nợ</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#ff4d4f' }}>
                      {item.totalDebt?.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Đã thanh toán</div>
                    <div style={{ fontSize: 14, color: '#52c41a' }}>
                      {item.paidAmount?.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              </Card>
            )}
          />
        ) : (
          <Table
            size="middle"
            scroll={{ x: 'max-content' }}
            columns={payableColumns}
            dataSource={payables}
            rowKey="supplierId"
            pagination={false}
          />
        )}
      </Card>

      <Card title="Lịch sử thanh toán">
        {isMobile ? (
          <List
            dataSource={payments}
            renderItem={(item: any) => (
              <Card size="small" style={{ marginBottom: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Mã thanh toán</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.code}</div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Đối tượng</div>
                  <div style={{ fontSize: 14 }}>{item.customerName || item.supplierName}</div>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Số tiền</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1890ff' }}>
                      {item.amount?.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Ngày</div>
                    <div style={{ fontSize: 13 }}>
                      {dayjs(item.paymentDate).format('DD/MM/YYYY')}
                    </div>
                  </div>
                </div>
              </Card>
            )}
            pagination={{ pageSize: 20, simple: true }}
          />
        ) : (
          <Table
            size="middle"
            scroll={{ x: 'max-content' }}
            columns={paymentColumns}
            dataSource={payments}
            rowKey="id"
            pagination={{ pageSize: 20 }}
          />
        )}
      </Card>
    </div>
  );
}
