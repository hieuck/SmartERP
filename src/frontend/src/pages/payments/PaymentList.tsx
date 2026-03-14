import { useState } from 'react';
import {
  Button,
  Space,
  Tag,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Modal,
  Form,
  InputNumber,
  Input,
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Payment, PaymentMethod, PaymentStatus } from '../../services/accounting/paymentService';
import StandardListPage from '../../components/common/StandardListPage';
import { formatCurrency, formatDate } from '../../utils/responsive';
import {
  usePayments,
  useDeletePayment,
  useCompletePayment,
  useProcessRefund,
} from '../../hooks/usePayments';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const statusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'warning',
  [PaymentStatus.COMPLETED]: 'success',
  [PaymentStatus.FAILED]: 'error',
  [PaymentStatus.REFUNDED]: 'default',
};

export default function PaymentList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['payments', 'common']);
  const [form] = Form.useForm();
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: undefined as PaymentStatus | undefined,
    method: undefined as PaymentMethod | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  const { data: payments = [], isLoading } = usePayments(filters);
  const deletePaymentMutation = useDeletePayment();
  const completePaymentMutation = useCompletePayment();
  const refundMutation = useProcessRefund();

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentMutation.mutateAsync(id);
      message.success(t('payments:messages.deleteSuccess'));
    } catch (error: unknown) {
      message.error(t('payments:messages.deleteError'));
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completePaymentMutation.mutateAsync(id);
      message.success(t('payments:messages.completeSuccess'));
    } catch (error: unknown) {
      message.error(t('payments:messages.completeError'));
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    try {
      const values = await form.validateFields();
      await refundMutation.mutateAsync({
        id: selectedPayment.id,
        amount: values.amount,
        reason: values.reason,
      });
      message.success(t('payments:messages.refundSuccess'));
      setRefundModalVisible(false);
      setSelectedPayment(null);
      form.resetFields();
    } catch (error: unknown) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      message.error(t('payments:messages.refundError'));
    }
  };

  const columns = [
    {
      title: t('payments:columns.paymentNumber'),
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      width: 150,
    },
    {
      title: t('payments:columns.customer'),
      dataIndex: ['customer', 'name'],
      key: 'customer',
      ellipsis: true,
    },
    {
      title: t('payments:columns.paymentDate'),
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('payments:columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: t('payments:columns.method'),
      dataIndex: 'method',
      key: 'method',
      width: 130,
      render: (method: PaymentMethod) => t(`payments:methods.${method}`),
    },
    {
      title: t('payments:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: PaymentStatus) => (
        <Tag color={statusColors[status]}>{t(`payments:status.${status}`)}</Tag>
      ),
    },
    {
      title: t('payments:columns.reference'),
      dataIndex: 'reference',
      key: 'reference',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('common:actions.title'),
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Payment) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/dashboard/payments/${record.id}`)}
          >
            {t('payments:actions.view')}
          </Button>
          {record.status === PaymentStatus.PENDING && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record.id)}
            >
              {t('payments:actions.confirm')}
            </Button>
          )}
          {record.status === PaymentStatus.COMPLETED && (
            <Button
              type="link"
              size="small"
              icon={<RollbackOutlined />}
              onClick={() => {
                setSelectedPayment(record);
                form.setFieldsValue({ amount: record.amount });
                setRefundModalVisible(true);
              }}
            >
              {t('payments:actions.refund')}
            </Button>
          )}
          <Popconfirm
            title={t('payments:messages.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common:actions.delete')}
            cancelText={t('common:actions.cancel')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('payments:actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filterComponents = (
    <Space wrap>
      <Select
        placeholder={t('payments:filters.status')}
        style={{ width: 150 }}
        allowClear
        value={filters.status}
        onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
      >
        {Object.values(PaymentStatus).map((status) => (
          <Select.Option key={status} value={status}>
            {t(`payments:status.${status}`)}
          </Select.Option>
        ))}
      </Select>
      <Select
        placeholder={t('payments:filters.method')}
        style={{ width: 150 }}
        allowClear
        value={filters.method}
        onChange={(value) => setFilters({ ...filters, method: value, page: 1 })}
      >
        {Object.values(PaymentMethod).map((method) => (
          <Select.Option key={method} value={method}>
            {t(`payments:methods.${method}`)}
          </Select.Option>
        ))}
      </Select>
      <RangePicker
        format="DD/MM/YYYY"
        placeholder={[t('payments:filters.fromDate'), t('payments:filters.toDate')]}
        onChange={(dates) => {
          setFilters({
            ...filters,
            startDate: dates?.[0]?.format('YYYY-MM-DD'),
            endDate: dates?.[1]?.format('YYYY-MM-DD'),
            page: 1,
          });
        }}
      />
    </Space>
  );

  return (
    <>
      <StandardListPage
        title={t('payments:title')}
        createButtonText={t('payments:createButton')}
        onCreateClick={() => navigate('/dashboard/payments/new')}
        loading={
          isLoading ||
          deletePaymentMutation.isPending ||
          completePaymentMutation.isPending ||
          refundMutation.isPending
        }
        dataSource={payments}
        columns={columns}
        filters={filterComponents}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: payments.length,
          showTotal: (total: number) => t('payments:messages.total', { total }),
          onChange: (page: number, pageSize: number) => {
            setFilters({ ...filters, page, limit: pageSize });
          },
        }}
      />

      <Modal
        title={t('payments:actions.refund')}
        open={refundModalVisible}
        onOk={handleRefund}
        onCancel={() => {
          setRefundModalVisible(false);
          setSelectedPayment(null);
          form.resetFields();
        }}
        okText={t('common:actions.confirm')}
        cancelText={t('common:actions.cancel')}
        confirmLoading={refundMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('payments:columns.amount')}
            name="amount"
            rules={[
              { required: true, message: t('common:validation.required') },
              {
                type: 'number',
                min: 0,
                max: selectedPayment?.amount || 0,
                message: t('common:validation.invalidAmount'),
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              placeholder={t('payments:columns.amount')}
            />
          </Form.Item>
          <Form.Item
            label={t('common:fields.reason')}
            name="reason"
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <TextArea rows={4} placeholder={t('common:fields.reason')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
