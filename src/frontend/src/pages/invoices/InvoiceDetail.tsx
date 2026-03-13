import React from 'react';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SendOutlined,
  CloseOutlined,
  DollarOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  invoiceService,
  InvoiceStatus,
  InvoiceItem,
} from '../../services/accounting/invoiceService';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

const statusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'default',
  [InvoiceStatus.SENT]: 'blue',
  [InvoiceStatus.PAID]: 'green',
  [InvoiceStatus.OVERDUE]: 'red',
  [InvoiceStatus.CANCELLED]: 'red',
};

const statusLabels: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Nháp',
  [InvoiceStatus.SENT]: 'Đã gửi',
  [InvoiceStatus.PAID]: 'Đã thanh toán',
  [InvoiceStatus.OVERDUE]: 'Quá hạn',
  [InvoiceStatus.CANCELLED]: 'Đã hủy',
};

const InvoiceDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getById(id!),
  });

  const sendMutation = useMutation({
    mutationFn: () => invoiceService.send(id!),
    onSuccess: () => {
      message.success('Gửi hóa đơn thành công');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
    onError: () => {
      message.error('Không thể gửi hóa đơn');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => invoiceService.cancel(id!),
    onSuccess: () => {
      message.success('Hủy hóa đơn thành công');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
    onError: () => {
      message.error('Không thể hủy hóa đơn');
    },
  });

  const handleSend = () => {
    Modal.confirm({
      title: 'Gửi hóa đơn',
      content: 'Bạn có chắc chắn muốn gửi hóa đơn này cho khách hàng?',
      onOk: () => sendMutation.mutate(),
    });
  };

  const handleCancel = () => {
    Modal.confirm({
      title: 'Hủy hóa đơn',
      content: 'Bạn có chắc chắn muốn hủy hóa đơn này?',
      onOk: () => cancelMutation.mutate(),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const columns: ColumnsType<InvoiceItem> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discount',
      key: 'discount',
      width: 100,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Thuế',
      dataIndex: 'tax',
      key: 'tax',
      width: 100,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Text>Không tìm thấy hóa đơn</Text>
        </Card>
      </div>
    );
  }

  const canEdit = invoice.status === InvoiceStatus.DRAFT;
  const canSend = invoice.status === InvoiceStatus.DRAFT;
  const canCancel =
    invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.CANCELLED;
  const isOverdue = invoice.status === InvoiceStatus.OVERDUE;

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Title level={3}>Chi tiết hóa đơn: {invoice.invoiceNumber}</Title>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/invoices')}>
                Quay lại
              </Button>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                In
              </Button>
              {canEdit && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/dashboard/invoices/${id}`)}
                >
                  Chỉnh sửa
                </Button>
              )}
              {canSend && (
                <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
                  Gửi hóa đơn
                </Button>
              )}
              {canCancel && (
                <Button danger icon={<CloseOutlined />} onClick={handleCancel}>
                  Hủy
                </Button>
              )}
            </Space>
          </div>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="Số hóa đơn">{invoice.invoiceNumber}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColors[invoice.status]}>{statusLabels[invoice.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{invoice.customerId}</Descriptions.Item>
            <Descriptions.Item label="Đơn hàng">{invoice.orderId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Ngày phát hành">
              {dayjs(invoice.issueDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đến hạn">
              <Text style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
                {dayjs(invoice.dueDate).format('DD/MM/YYYY')}
                {isOverdue && ' (Quá hạn)'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng phụ">
              {invoice.subtotal.toLocaleString('vi-VN')} ₫
            </Descriptions.Item>
            <Descriptions.Item label="Thuế">
              {invoice.tax.toLocaleString('vi-VN')} ₫
            </Descriptions.Item>
            <Descriptions.Item label="Giảm giá">
              {invoice.discount.toLocaleString('vi-VN')} ₫
            </Descriptions.Item>
            <Descriptions.Item label="Tổng cộng">
              <Text strong style={{ fontSize: 16 }}>
                {invoice.total.toLocaleString('vi-VN')} ₫
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán">
              <Text style={{ fontSize: 16 }}>{invoice.paidAmount.toLocaleString('vi-VN')} ₫</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Còn lại">
              <Text
                strong
                style={{
                  fontSize: 16,
                  color: invoice.paidAmount < invoice.total ? '#ff4d4f' : '#52c41a',
                }}
              >
                {(invoice.total - invoice.paidAmount).toLocaleString('vi-VN')} ₫
              </Text>
            </Descriptions.Item>
            {invoice.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {invoice.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card title="Chi tiết sản phẩm">
          <Table
            columns={columns}
            dataSource={invoice.items || []}
            rowKey="productId"
            pagination={false}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text>Tổng phụ:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    {invoice.subtotal.toLocaleString('vi-VN')} ₫
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text>Thuế:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    {invoice.tax.toLocaleString('vi-VN')} ₫
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text>Giảm giá:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    -{invoice.discount.toLocaleString('vi-VN')} ₫
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text strong>Tổng cộng:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong style={{ fontSize: 16 }}>
                      {invoice.total.toLocaleString('vi-VN')} ₫
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>

        {invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.CANCELLED && (
          <Card>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => navigate(`/dashboard/payments/new?invoiceId=${id}`)}
            >
              Thanh toán
            </Button>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default InvoiceDetail;
