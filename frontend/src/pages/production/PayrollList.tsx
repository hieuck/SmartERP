/**
 * Payroll List Page
 * Displays and manages worker payrolls
 * Requirements: 34.7, 34.10
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Space,
  Select,
  Tag,
  message,
  Card,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Statistic,
  List,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import productionService, { Payroll } from '../../services/productionService';
import dayjs from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';
import type { MenuProps } from 'antd';

const { Option } = Select;

const PayrollList = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [status, setStatus] = useState<string>();
  const [calculateModalVisible, setCalculateModalVisible] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll>();
  const [form] = Form.useForm();
  const [payForm] = Form.useForm();

  // Fetch payrolls
  const { data, isLoading } = useQuery({
    queryKey: ['payrolls', { month, year, status }],
    queryFn: () => productionService.payroll.getPayrolls({ month, year, status }),
  });

  // Calculate payroll mutation
  const calculateMutation = useMutation({
    mutationFn: (data: any) => productionService.payroll.calculatePayroll(data),
    onSuccess: () => {
      message.success('Tính lương thành công');
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      setCalculateModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Tính lương thất bại');
    },
  });

  // Approve payroll mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => productionService.payroll.approvePayroll(id),
    onSuccess: () => {
      message.success('Duyệt bảng lương thành công');
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
    },
    onError: () => {
      message.error('Duyệt bảng lương thất bại');
    },
  });

  // Pay payroll mutation
  const payMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productionService.payroll.payPayroll(id, data),
    onSuccess: () => {
      message.success('Thanh toán lương thành công');
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      setPayModalVisible(false);
      payForm.resetFields();
    },
    onError: () => {
      message.error('Thanh toán lương thất bại');
    },
  });

  const handleCalculate = () => {
    setCalculateModalVisible(true);
  };

  const handlePay = (record: Payroll) => {
    setSelectedPayroll(record);
    setPayModalVisible(true);
  };

  const onCalculateFinish = (values: any) => {
    calculateMutation.mutate({
      month: values.month.month() + 1,
      year: values.month.year(),
    });
  };

  const onPayFinish = (values: any) => {
    if (selectedPayroll) {
      payMutation.mutate({
        id: selectedPayroll.id,
        data: {
          paymentMethod: values.paymentMethod,
          paymentDate: values.paymentDate.toDate(),
        },
      });
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'default',
    approved: 'blue',
    paid: 'green',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Nháp',
    approved: 'Đã duyệt',
    paid: 'Đã thanh toán',
  };

  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: ['worker', 'fullName'],
      key: 'worker',
    },
    {
      title: 'Tháng/Năm',
      key: 'period',
      render: (_: any, record: Payroll) => `${record.month}/${record.year}`,
    },
    {
      title: 'Lương cơ bản',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      align: 'right' as const,
      render: (value: number) => value.toLocaleString('vi-VN') + ' đ',
    },
    {
      title: 'Phụ cấp',
      key: 'allowances',
      align: 'right' as const,
      render: (_: any, record: Payroll) => {
        const total = record.overtimePay + record.nightShiftAllowance + record.holidayPay;
        return total.toLocaleString('vi-VN') + ' đ';
      },
    },
    {
      title: 'Khấu trừ',
      key: 'totalDeductions',
      align: 'right' as const,
      render: (_: any, record: Payroll) => {
        const total = record.deductions + record.advanceDeduction;
        return total.toLocaleString('vi-VN') + ' đ';
      },
    },
    {
      title: 'Thực lĩnh',
      dataIndex: 'netSalary',
      key: 'netSalary',
      align: 'right' as const,
      render: (value: number) => (
        <strong style={{ color: '#52c41a' }}>{value.toLocaleString('vi-VN')} đ</strong>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: Payroll) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/production/payrolls/${record.id}`)}
          >
            Chi tiết
          </Button>
          {record.status === 'draft' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => approveMutation.mutate(record.id)}
            >
              Duyệt
            </Button>
          )}
          {record.status === 'approved' && (
            <Button type="link" icon={<DollarOutlined />} onClick={() => handlePay(record)}>
              Thanh toán
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const totalSalary = data?.data?.reduce((sum: number, p: Payroll) => sum + p.netSalary, 0) || 0;
  const paidSalary =
    data?.data
      ?.filter((p: Payroll) => p.status === 'paid')
      .reduce((sum: number, p: Payroll) => sum + p.netSalary, 0) || 0;
  const unpaidSalary = totalSalary - paidSalary;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng lương"
              value={totalSalary}
              suffix="đ"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Đã thanh toán"
              value={paidSalary}
              suffix="đ"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Chưa thanh toán"
              value={unpaidSalary}
              suffix="đ"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Bảng lương"
        extra={
          <Button
            type="primary"
            icon={<CalculatorOutlined />}
            onClick={handleCalculate}
            size="small"
          >
            Tính lương
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="Tháng"
              style={{ width: isMobile ? 60 : 100 }}
              value={month}
              onChange={setMonth}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <Option key={m} value={m}>
                  Tháng {m}
                </Option>
              ))}
            </Select>
            <Select placeholder="Năm" style={{ width: 100 }} value={year} onChange={setYear}>
              {Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i).map((y) => (
                <Option key={y} value={y}>
                  {y}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Trạng thái"
              style={{ width: 150 }}
              allowClear
              value={status}
              onChange={setStatus}
            >
              <Option value="draft">Nháp</Option>
              <Option value="approved">Đã duyệt</Option>
              <Option value="paid">Đã thanh toán</Option>
            </Select>
          </Space>
        </Space>

        {isMobile ? (
          /* Mobile: Card View */
          <List
            dataSource={data?.data || []}
            loading={isLoading}
            renderItem={(payroll: Payroll) => {
              const menuItems: MenuProps['items'] = [
                {
                  key: 'detail',
                  label: 'Chi tiết',
                  icon: <FileTextOutlined />,
                  onClick: () => navigate(`/production/payrolls/${payroll.id}`),
                },
              ];

              if (payroll.status === 'draft') {
                menuItems.push({
                  key: 'approve',
                  label: 'Duyệt',
                  icon: <CheckOutlined />,
                  onClick: () => approveMutation.mutate(payroll.id),
                });
              }

              if (payroll.status === 'approved') {
                menuItems.push({
                  key: 'pay',
                  label: 'Thanh toán',
                  icon: <DollarOutlined />,
                  onClick: () => handlePay(payroll),
                });
              }

              return (
                <Card
                  size="small"
                  style={{ marginBottom: 8 }}
                  extra={
                    <Dropdown
                      menu={{ items: menuItems }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <Button
                        type="text"
                        icon={<MoreOutlined />}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>
                  }
                >
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#666' }}>Nhân viên</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{payroll.workerName}</div>
                  </div>

                  <Row gutter={8} style={{ marginBottom: 8 }}>
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#666' }}>Tháng</div>
                      <div style={{ fontSize: 14 }}>
                        {payroll.month}/{payroll.year}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#666' }}>Trạng thái</div>
                      <div>
                        <Tag color={statusColors[payroll.status]}>
                          {statusLabels[payroll.status]}
                        </Tag>
                      </div>
                    </Col>
                  </Row>

                  <Row gutter={8}>
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#666' }}>Lương cơ bản</div>
                      <div style={{ fontSize: 14 }}>
                        {payroll.baseSalary.toLocaleString('vi-VN')} đ
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#666' }}>Thực lĩnh</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#52c41a' }}>
                        {payroll.netSalary.toLocaleString('vi-VN')} đ
                      </div>
                    </Col>
                  </Row>
                </Card>
              );
            }}
            pagination={{
              total: data?.meta?.total,
              pageSize: data?.meta?.limit,
              current: data?.meta?.page,
              showSizeChanger: false,
              simple: true,
              showTotal: (total) => `Tổng ${total} bản ghi`,
            }}
          />
        ) : (
          /* Desktop: Table View */
          <Table
            columns={columns}
            dataSource={data?.data || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              total: data?.meta?.total,
              pageSize: data?.meta?.limit,
              current: data?.meta?.page,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} bản ghi`,
            }}
          />
        )}
      </Card>

      {/* Calculate Payroll Modal */}
      <Modal
        title="Tính lương"
        open={calculateModalVisible}
        onCancel={() => {
          setCalculateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onCalculateFinish}
          initialValues={{
            month: dayjs(),
          }}
        >
          <Form.Item
            label="Tháng/Năm"
            name="month"
            rules={[{ required: true, message: 'Vui lòng chọn tháng' }]}
          >
            <DatePicker picker="month" style={{ width: '100%' }} format="MM/YYYY" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={calculateMutation.isPending}>
                Tính lương
              </Button>
              <Button
                onClick={() => {
                  setCalculateModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Pay Payroll Modal */}
      <Modal
        title="Thanh toán lương"
        open={payModalVisible}
        onCancel={() => {
          setPayModalVisible(false);
          payForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={payForm}
          layout="vertical"
          onFinish={onPayFinish}
          initialValues={{
            paymentDate: dayjs(),
            paymentMethod: 'bank_transfer',
          }}
        >
          <p>
            Nhân viên: <strong>{selectedPayroll?.worker?.fullName}</strong>
          </p>
          <p>
            Số tiền: <strong>{selectedPayroll?.netSalary.toLocaleString('vi-VN')} đ</strong>
          </p>

          <Form.Item
            label="Phương thức thanh toán"
            name="paymentMethod"
            rules={[{ required: true, message: 'Vui lòng chọn phương thức' }]}
          >
            <Select>
              <Option value="cash">Tiền mặt</Option>
              <Option value="bank_transfer">Chuyển khoản</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Ngày thanh toán"
            name="paymentDate"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={payMutation.isPending}>
                Xác nhận thanh toán
              </Button>
              <Button
                onClick={() => {
                  setPayModalVisible(false);
                  payForm.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PayrollList;
