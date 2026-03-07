import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, DatePicker, Card, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { invoiceService, Invoice, InvoiceStatus } from '../../services/invoiceService';
import dayjs from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';

const { RangePicker } = DatePicker;

const statusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'default',
  [InvoiceStatus.SENT]: 'processing',
  [InvoiceStatus.PAID]: 'success',
  [InvoiceStatus.OVERDUE]: 'error',
  [InvoiceStatus.CANCELLED]: 'default',
};

const statusLabels: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Nháp',
  [InvoiceStatus.SENT]: 'Đã gửi',
  [InvoiceStatus.PAID]: 'Đã thanh toán',
  [InvoiceStatus.OVERDUE]: 'Quá hạn',
  [InvoiceStatus.CANCELLED]: 'Đã hủy',
};

export default function InvoiceList() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: undefined as InvoiceStatus | undefined,
    customerId: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await invoiceService.getAll(filters);
      setInvoices(response.data || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      message.error('Không thể tải danh sách hóa đơn: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await invoiceService.delete(id);
      message.success('Xóa hóa đơn thành công');
      fetchInvoices();
    } catch (error: any) {
      message.error('Không thể xóa hóa đơn: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleSend = async (id: string) => {
    try {
      await invoiceService.send(id);
      message.success('Gửi hóa đơn thành công');
      fetchInvoices();
    } catch (error: any) {
      message.error('Không thể gửi hóa đơn: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const columns = [
    {
      title: 'Số HĐ',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 150,
    },
    {
      title: 'Khách hàng',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      ellipsis: true,
    },
    {
      title: 'Ngày phát hành',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày đáo hạn',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right' as const,
      render: (val: number) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(val),
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 150,
      align: 'right' as const,
      render: (val: number) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(val),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: InvoiceStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Invoice) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/dashboard/invoices/${record.id}`)}
          >
            Xem
          </Button>
          {record.status === InvoiceStatus.DRAFT && (
            <>
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSend(record.id)}
              >
                Gửi
              </Button>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/dashboard/invoices/${record.id}/edit`)}
              >
                Sửa
              </Button>
            </>
          )}
          <Popconfirm
            title="Bạn có chắc muốn xóa hóa đơn này?"
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
        title="Danh sách hóa đơn"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/invoices/new')}
          >
            Tạo hóa đơn
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
            loading={loading}
            dataSource={invoices}
            columns={columns}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} hóa đơn`,
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
