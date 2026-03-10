/**
 * Advance Payment List Page
 * Manage worker advance payments
 * Requirements: 42.1
 */

import { useState } from 'react';
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
  Input,
  Row,
  Col,
  Statistic,
  List,
  Dropdown,
} from 'antd';
import { PlusOutlined, CheckOutlined, DollarOutlined, MoreOutlined } from '@ant-design/icons';
import productionService, { AdvancePayment, Worker } from '../../services/production/productionService';
import dayjs, { Dayjs } from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';
import type { MenuProps } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

const AdvancePaymentList = () => {
  const { isMobile } = useResponsive();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>();
  const [workerId, setWorkerId] = useState<string>();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch workers
  const { data: workersData } = useQuery({
    queryKey: ['workers', { status: 'active' }],
    queryFn: async () => {
      const response = await productionService.worker.getWorkers({ status: 'active' });
      return response.data;
    },
  });

  // Fetch advances
  const { data, isLoading } = useQuery({
    queryKey: ['advances', { status, workerId }],
    queryFn: async () => {
      const response = await productionService.advance.getAdvances({ status, workerId });
      return response.data;
    },
  });

  // Create advance mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await productionService.advance.createAdvance(data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Tạo phiếu tạm ứng thành công');
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      setModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Tạo phiếu tạm ứng thất bại');
    },
  });

  // Approve advance mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.advance.approveAdvance(id);
      return response.data;
    },
    onSuccess: () => {
      message.success('Duyệt tạm ứng thành công');
      queryClient.invalidateQueries({ queryKey: ['advances'] });
    },
    onError: () => {
      message.error('Duyệt tạm ứng thất bại');
    },
  });

  const handleCreate = () => {
    setModalVisible(true);
  };

  const onFinish = (values: any) => {
    createMutation.mutate({
      workerId: values.workerId,
      amount: values.amount,
      date: values.date.toDate(),
      reason: values.reason,
    });
  };

  const statusColors: Record<string, string> = {
    pending: 'orange',
    approved: 'blue',
    deducted: 'green',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    deducted: 'Đã trừ lương',
  };

  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: ['worker', 'fullName'],
      key: 'worker',
    },
    {
      title: 'Mã NV',
      dataIndex: ['worker', 'code'],
      key: 'code',
      width: 100,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (value: number) => (
        <strong style={{ color: '#ff4d4f' }}>{value.toLocaleString('vi-VN')} đ</strong>
      ),
    },
    {
      title: 'Ngày tạm ứng',
      dataIndex: 'date',
      key: 'date',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
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
      render: (_: any, record: AdvancePayment) =>
        record.status === 'pending' && (
          <Button
            type="link"
            icon={<CheckOutlined />}
            onClick={() => approveMutation.mutate(record.id)}
          >
            Duyệt
          </Button>
        ),
    },
  ];

  const totalAdvance =
    data?.data?.reduce((sum: number, a: AdvancePayment) => sum + a.amount, 0) || 0;
  const pendingAdvance =
    data?.data
      ?.filter((a: AdvancePayment) => a.status === 'pending')
      .reduce((sum: number, a: AdvancePayment) => sum + a.amount, 0) || 0;
  const approvedAdvance =
    data?.data
      ?.filter((a: AdvancePayment) => a.status === 'approved')
      .reduce((sum: number, a: AdvancePayment) => sum + a.amount, 0) || 0;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng tạm ứng"
              value={totalAdvance}
              suffix="đ"
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Chờ duyệt"
              value={pendingAdvance}
              suffix="đ"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Đã duyệt"
              value={approvedAdvance}
              suffix="đ"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Quản lý tạm ứng"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="small">
            Tạo phiếu tạm ứng
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="Chọn nhân viên"
              style={{ width: isMobile ? 60 : 200 }}
              allowClear
              value={workerId}
              onChange={setWorkerId}
              showSearch
              optionFilterProp="children"
            >
              {workersData?.data?.map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} ({worker.code})
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
              <Option value="pending">Chờ duyệt</Option>
              <Option value="approved">Đã duyệt</Option>
              <Option value="deducted">Đã trừ lương</Option>
            </Select>
          </Space>
        </Space>

        {isMobile ? (
          /* Mobile: Card View */
          <List
            dataSource={data?.data || []}
            loading={isLoading}
            renderItem={(advance: AdvancePayment) => {
              const menuItems: MenuProps['items'] = [];

              if (advance.status === 'pending') {
                menuItems.push({
                  key: 'approve',
                  label: 'Duyệt',
                  icon: <CheckOutlined />,
                  onClick: () => approveMutation.mutate(advance.id),
                });
              }

              return (
                <Card
                  size="small"
                  style={{ marginBottom: 8 }}
                  extra={
                    menuItems.length > 0 ? (
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
                    ) : null
                  }
                >
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#666' }}>Nhân viên</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{advance.workerName}</div>
                  </div>

                  <Row gutter={8} style={{ marginBottom: 8 }}>
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#666' }}>Số tiền</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1890ff' }}>
                        {advance.amount.toLocaleString('vi-VN')} đ
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#666' }}>Ngày tạm ứng</div>
                      <div style={{ fontSize: 14 }}>
                        {dayjs(advance.advanceDate).format('DD/MM/YYYY')}
                      </div>
                    </Col>
                  </Row>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#666' }}>Trạng thái</div>
                    <div>
                      <Tag color={statusColors[advance.status]}>{statusLabels[advance.status]}</Tag>
                    </div>
                  </div>

                  {advance.reason && (
                    <div>
                      <div style={{ fontSize: 12, color: '#666' }}>Lý do</div>
                      <div style={{ fontSize: 13, color: '#666' }}>{advance.reason}</div>
                    </div>
                  )}
                </Card>
              );
            }}
            pagination={false}
          />
        ) : (
          /* Desktop: Table View */
          <Table
            columns={columns}
            dataSource={data?.data || []}
            rowKey="id"
            loading={isLoading}
            pagination={false}
          />
        )}
      </Card>

      {/* Create Advance Modal */}
      <Modal
        title="Tạo phiếu tạm ứng"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            date: dayjs(),
          }}
        >
          <Form.Item
            label="Nhân viên"
            name="workerId"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select placeholder="Chọn nhân viên" showSearch optionFilterProp="children">
              {workersData?.data?.map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} ({worker.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Số tiền"
            name="amount"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              addonAfter="đ"
              placeholder="Nhập số tiền"
            />
          </Form.Item>

          <Form.Item
            label="Ngày tạm ứng"
            name="date"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label="Lý do" name="reason">
            <TextArea rows={3} placeholder="Nhập lý do tạm ứng" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                Tạo phiếu
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
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

export default AdvancePaymentList;
