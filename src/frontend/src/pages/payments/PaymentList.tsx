import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  DatePicker,
  Card,
  message,
  Popconfirm,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Payment, PaymentMethod, PaymentStatus } from '../../services/accounting/paymentService';
import dayjs from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';
import {
  usePayments,
  useDeletePayment,
  useCompletePayment,
  useProcessRefund,
} from '../../hooks/usePayments';

const { RangePicker } = DatePicker;

const statusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'warning',
  [PaymentStatus.COMPLETED]: 'success',
  [PaymentStatus.FAILED]: 'error',
  [PaymentStatus.REFUNDED]: 'default',
};

const statusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Chờ xử lý',
  [PaymentStatus.COMPLETED]: 'Hoàn thành',
  [PaymentStatus.FAILED]: 'Thất bại',
  [PaymentStatus.REFUNDED]: 'Đã hoàn tiền',
};

const methodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Tiền mặt',
  [PaymentMethod.CARD]: 'Thẻ',
  [PaymentMethod.BANK_TRANSFER]: 'Chuyển khoản',
  [PaymentMethod.CHEQUE]: 'Séc',
  [PaymentMethod.E_WALLET]: 'Ví điện tử',
};

export default function PaymentList() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: undefined as PaymentStatus | undefined,
  });

  // Hooks for payment operations
  const { data: payments = [], isLoading } = usePayments(filters);
  const deletePaymentMutation = useDeletePayment();
  const completePaymentMutation = useCompletePayment();
  const refundMutation = useProcessRefund();

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentMutation.mutateAsync(id);
      message.success('Xóa thanh toán thành công');
    } catch (error: any) {
      message.error('Không thể xóa thanh toán: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completePaymentMutation.mutateAsync(id);
      message.success('Xác nhận thanh toán thành công');
    } catch (error: any) {
      message.error('Không thể xác nhận thanh toán: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleRefund = async (amount: number, reason: string) => {
    if (!selectedPayment) return;
    try {
      await refundMutation.mutateAsync({
        id: selectedPayment.id,
        amount,
        reason,
      });
      message.success('Hoàn tiền thành công');
      setRefundModalVisible(false);
      setSelectedPayment(null);
    } catch (error: any) {
      message.error('Không thể hoàn tiền: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const columns = [
    {
      title: 'Mã TT',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      width: 150,
    },
    {
      title: 'Khách hàng',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      ellipsis: true,
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right' as const,
      render: (val: number) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(val),
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      width: 130,
      render: (method: PaymentMethod) => methodLabels[method],
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: PaymentStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Tham chiếu',
      dataIndex: 'reference',
      key: 'reference',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Payment) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/dashboard/payments/${record.id}`)}
          >
            Xem
          </Button>
          {record.status === PaymentStatus.PENDING && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record.id)}
            >
              Xác nhận
            </Button>
          )}
          {record.status === PaymentStatus.COMPLETED && (
            <Button
              type="link"
              size="small"
              icon={<RollbackOutlined />}
              onClick={() => {
                setSelectedPayment(record);
                setRefundModalVisible(true);
              }}
            >
              Hoàn tiền
            </Button>
          )}
          <Popconfirm
            title="Bạn có chắc muốn xóa thanh toán này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Danh sách thanh toán"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/payments/new')}
          >
            Tạo thanh toán
          </Button>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Select
              placeholder="Trạng thái"
              style={{ width: 150 }}
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Phương thức"
              style={{ width: 150 }}
              allowClear
              value={filters.method}
              onChange={(value) => setFilters({ ...filters, method: value, page: 1 })}
            >
              {Object.entries(methodLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
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

          <Table
            loading={
              isLoading ||
              deletePaymentMutation.isPending ||
              completePaymentMutation.isPending ||
              refundMutation.isPending
            }
            dataSource={payments}
            columns={columns}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} thanh toán`,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, limit: pageSize });
              },
            }}
          />
        </Space>
      </Card>
    </div>
  );
}
