/**
 * Advance Payment List Page
 * Manage worker advance payments
 * Requirements: 42.1
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
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
} from 'antd';
import { PlusOutlined, CheckOutlined, DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '../../components/common/StandardListPage';
import productionService, {
  AdvancePayment,
  Worker,
} from '../../services/production/productionService';
import { formatCurrency, formatDate } from '../../utils/responsive';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { TextArea } = Input;

export default function AdvancePaymentList() {
  const { t } = useTranslation(['production', 'common']);
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
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      setModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  // Approve advance mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.advance.approveAdvance(id);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.approveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['advances'] });
    },
    onError: () => {
      message.error(t('production:messages.approveError'));
    },
  });

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
    rejected: 'red',
    deducted: 'green',
  };

  const totalAdvance =
    data?.reduce((sum: number, a: AdvancePayment) => sum + a.amount, 0) || 0;
  const pendingAdvance =
    data?.filter((a: AdvancePayment) => a.status === 'pending')
      .reduce((sum: number, a: AdvancePayment) => sum + a.amount, 0) || 0;
  const approvedAdvance =
    data?.filter((a: AdvancePayment) => a.status === 'approved')
      .reduce((sum: number, a: AdvancePayment) => sum + a.amount, 0) || 0;

  const columns: ColumnsType<AdvancePayment> = [
    {
      title: t('production:advances.worker'),
      dataIndex: ['worker', 'fullName'],
      key: 'worker',
      ellipsis: true,
    },
    {
      title: t('production:workers.code'),
      dataIndex: ['worker', 'code'],
      key: 'code',
      width: 120,
    },
    {
      title: t('production:advances.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right' as const,
      render: (value: number) => (
        <strong style={{ color: '#ff4d4f' }}>{formatCurrency(value)}</strong>
      ),
    },
    {
      title: t('production:advances.date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('production:advances.reason'),
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: t('production:advances.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{t(`production:advances.statuses.${status}`)}</Tag>
      ),
    },
  ];

  const filterComponents = (
    <Space wrap>
      <Select
        placeholder={t('production:advances.selectWorker')}
        style={{ width: 200 }}
        allowClear
        value={workerId}
        onChange={setWorkerId}
        showSearch
        optionFilterProp="children"
      >
        {workersData?.map((worker: Worker) => (
          <Option key={worker.id} value={worker.id}>
            {worker.fullName} ({worker.code})
          </Option>
        ))}
      </Select>
      <Select
        placeholder={t('production:filters.status')}
        style={{ width: 150 }}
        allowClear
        value={status}
        onChange={setStatus}
      >
        <Option value="pending">{t('production:advances.statuses.pending')}</Option>
        <Option value="approved">{t('production:advances.statuses.approved')}</Option>
        <Option value="rejected">{t('production:advances.statuses.rejected')}</Option>
        <Option value="deducted">{t('production:advances.statuses.deducted')}</Option>
      </Select>
    </Space>
  );

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('production:advances.title')}
              value={totalAdvance}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title={t('production:advances.statuses.pending')}
              value={pendingAdvance}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title={t('production:advances.statuses.approved')}
              value={approvedAdvance}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <StandardListPage
        title={t('production:advances.list')}
        createButtonText={t('production:advances.requestAdvance')}
        onCreateClick={() => setModalVisible(true)}
        filters={filterComponents}
        columns={columns}
        dataSource={data || []}
        loading={isLoading || createMutation.isPending || approveMutation.isPending}
        pagination={{
          current: 1,
          pageSize: 10,
          total: data?.length || 0,
          showTotal: (total: number) => t('production:messages.total', { total }),
          onChange: () => {},
        }}
        customContent={
          <Space style={{ marginBottom: 16 }}>
            {data?.filter((a: AdvancePayment) => a.status === 'pending').map((advance: AdvancePayment) => (
              <Button
                key={advance.id}
                type="link"
                icon={<CheckOutlined />}
                onClick={() => approveMutation.mutate(advance.id)}
              >
                {t('production:advances.approve')} - {advance.worker?.fullName}
              </Button>
            ))}
          </Space>
        }
      />

      {/* Create Advance Modal */}
      <Modal
        title={t('production:advances.requestAdvance')}
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
            label={t('production:advances.worker')}
            name="workerId"
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <Select
              placeholder={t('production:advances.selectWorker')}
              showSearch
              optionFilterProp="children"
            >
              {workersData?.map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} ({worker.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('production:advances.amount')}
            name="amount"
            rules={[
              { required: true, message: t('production:validation.required') },
              { type: 'number', min: 1, message: t('production:validation.minQuantity') },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              placeholder={t('production:advances.amount')}
            />
          </Form.Item>

          <Form.Item
            label={t('production:advances.date')}
            name="date"
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label={t('production:advances.reason')} name="reason">
            <TextArea rows={3} placeholder={t('production:advances.reason')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                {t('production:actions.save')}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                {t('production:actions.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
