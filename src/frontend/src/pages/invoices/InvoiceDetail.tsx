import React, { useEffect, useState } from 'react';
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
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SendOutlined,
  CloseOutlined,
  DollarOutlined,
  PrinterOutlined,
  SyncOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  InvoiceStatus,
} from '@/services/accounting/invoiceService';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import type { Invoice } from '@/lib/offline/db';
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

interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

const InvoiceDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueSize, setSyncQueueSize] = useState(0);

  // Load invoice from IndexedDB
  const loadInvoice = async () => {
    try {
      setLoading(true);
      if (!id) return;
      
      const data = await offlineServices.invoices.getById(id);
      setInvoice(data || null);
      logger.info('InvoiceDetail', 'Loaded invoice from IndexedDB', { id });
    } catch (error) {
      logger.error('InvoiceDetail', 'Failed to load invoice', error as Error);
      message.error('Không thể tải thông tin hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync on mount when online
  useEffect(() => {
    const initSync = async () => {
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await syncManager.sync(token);
            logger.info('InvoiceDetail', 'Auto-sync completed');
          } catch (error) {
            logger.error('InvoiceDetail', 'Auto-sync failed', error as Error);
          }
        }
      }
    };

    initSync();
    loadInvoice();
  }, [id]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync queue size
  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await syncManager.getQueueSize();
      setSyncQueueSize(size);
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000);

    return () => clearInterval(interval);
  }, []);

  // Manual sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('Vui lòng đăng nhập');
      return;
    }

    try {
      setSyncing(true);
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(`Đồng bộ thành công: ${result.pulled} pulled, ${result.pushed} pushed`);
        await loadInvoice();
      } else {
        message.error(`Đồng bộ thất bại: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('InvoiceDetail', 'Sync failed', error as Error);
      message.error('Đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const handleSend = async () => {
    if (!invoice) return;

    Modal.confirm({
      title: 'Gửi hóa đơn',
      content: 'Bạn có chắc chắn muốn gửi hóa đơn này cho khách hàng?',
      onOk: async () => {
        try {
          await offlineServices.invoices.update(invoice.id, {
            ...invoice,
            status: InvoiceStatus.SENT,
          });
          message.success('Gửi hóa đơn thành công');
          await loadInvoice();
        } catch (error) {
          logger.error('InvoiceDetail', 'Failed to send invoice', error as Error);
          message.error('Không thể gửi hóa đơn');
        }
      },
    });
  };

  const handleCancel = async () => {
    if (!invoice) return;

    Modal.confirm({
      title: 'Hủy hóa đơn',
      content: 'Bạn có chắc chắn muốn hủy hóa đơn này?',
      onOk: async () => {
        try {
          await offlineServices.invoices.update(invoice.id, {
            ...invoice,
            status: InvoiceStatus.CANCELLED,
          });
          message.success('Hủy hóa đơn thành công');
          await loadInvoice();
        } catch (error) {
          logger.error('InvoiceDetail', 'Failed to cancel invoice', error as Error);
          message.error('Không thể hủy hóa đơn');
        }
      },
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Parse items from invoice.items (Record<string, unknown>)
  const invoiceItems: InvoiceItem[] = invoice?.items 
    ? (Array.isArray(invoice.items) ? invoice.items : []) as InvoiceItem[]
    : [];

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

  if (loading) {
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
        {/* Network Status & Sync */}
        <Card size="small">
          <Space>
            <Badge status={isOnline ? 'success' : 'error'} />
            <Text>{isOnline ? <WifiOutlined /> : <DisconnectOutlined />}</Text>
            <Text>{isOnline ? 'Online' : 'Offline'}</Text>
            {syncQueueSize > 0 && (
              <>
                <Text>|</Text>
                <Text type="warning">{syncQueueSize} thay đổi chưa đồng bộ</Text>
              </>
            )}
            <Button
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
              disabled={!isOnline}
              size="small"
            >
              Đồng bộ
            </Button>
          </Space>
        </Card>

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
              <Tag color={statusColors[invoice.status as InvoiceStatus]}>
                {statusLabels[invoice.status as InvoiceStatus]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{invoice.customerId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Nhà cung cấp">{invoice.supplierId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Ngày phát hành">
              {dayjs(invoice.invoiceDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đến hạn">
              <Text style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
                {invoice.dueDate ? dayjs(invoice.dueDate).format('DD/MM/YYYY') : '-'}
                {isOverdue && ' (Quá hạn)'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng phụ">
              {invoice.subtotal.toLocaleString('vi-VN')} {invoice.currency}
            </Descriptions.Item>
            <Descriptions.Item label="Thuế">
              {invoice.taxAmount.toLocaleString('vi-VN')} {invoice.currency}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng cộng">
              <Text strong style={{ fontSize: 16 }}>
                {invoice.totalAmount.toLocaleString('vi-VN')} {invoice.currency}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán">
              <Text style={{ fontSize: 16 }}>
                {invoice.paidAmount.toLocaleString('vi-VN')} {invoice.currency}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Còn lại">
              <Text
                strong
                style={{
                  fontSize: 16,
                  color: invoice.paidAmount < invoice.totalAmount ? '#ff4d4f' : '#52c41a',
                }}
              >
                {(invoice.totalAmount - invoice.paidAmount).toLocaleString('vi-VN')} {invoice.currency}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái đồng bộ">
              <Tag color={invoice.syncStatus === 'synced' ? 'green' : 'orange'}>
                {invoice.syncStatus === 'synced' ? 'Đã đồng bộ' : 'Chưa đồng bộ'}
              </Tag>
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
            dataSource={invoiceItems}
            rowKey="productId"
            pagination={false}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text>Tổng phụ:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    {invoice.subtotal.toLocaleString('vi-VN')} {invoice.currency}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text>Thuế:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    {invoice.taxAmount.toLocaleString('vi-VN')} {invoice.currency}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text strong>Tổng cộng:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong style={{ fontSize: 16 }}>
                      {invoice.totalAmount.toLocaleString('vi-VN')} {invoice.currency}
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
