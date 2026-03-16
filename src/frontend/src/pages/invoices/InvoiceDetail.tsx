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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['invoices', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueSize, setSyncQueueSize] = useState(0);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      if (!id) return;
      
      const data = await offlineServices.invoices.getById(id);
      setInvoice(data || null);
      logger.info('InvoiceDetail', 'Loaded invoice from IndexedDB', { id });
    } catch (error) {
      logger.error('InvoiceDetail', 'Failed to load invoice', error as Error);
      message.error(t('invoices:messages.loadInvoiceError'));
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await syncManager.getQueueSize();
      setSyncQueueSize(size);
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error(t('common:messages.loginRequired'));
      return;
    }

    try {
      setSyncing(true);
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(t('common:messages.syncSuccess', { pulled: result.pulled, pushed: result.pushed }));
        await loadInvoice();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('InvoiceDetail', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  const handleSend = async () => {
    if (!invoice) return;

    Modal.confirm({
      title: t('invoices:detail.sendConfirmTitle'),
      content: t('invoices:detail.sendConfirmContent'),
      onOk: async () => {
        try {
          await offlineServices.invoices.update(invoice.id, {
            ...invoice,
            status: InvoiceStatus.SENT,
          });
          message.success(t('invoices:messages.sendSuccess'));
          await loadInvoice();
        } catch (error) {
          logger.error('InvoiceDetail', 'Failed to send invoice', error as Error);
          message.error(t('invoices:messages.sendError'));
        }
      },
    });
  };

  const handleCancel = async () => {
    if (!invoice) return;

    Modal.confirm({
      title: t('invoices:detail.cancelConfirmTitle'),
      content: t('invoices:detail.cancelConfirmContent'),
      onOk: async () => {
        try {
          await offlineServices.invoices.update(invoice.id, {
            ...invoice,
            status: InvoiceStatus.CANCELLED,
          });
          message.success(t('invoices:messages.cancelSuccess'));
          await loadInvoice();
        } catch (error) {
          logger.error('InvoiceDetail', 'Failed to cancel invoice', error as Error);
          message.error(t('invoices:messages.cancelError'));
        }
      },
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const invoiceItems: InvoiceItem[] = invoice?.items 
    ? (Array.isArray(invoice.items) ? invoice.items : []) as InvoiceItem[]
    : [];

  const columns: ColumnsType<InvoiceItem> = [
    {
      title: t('invoices:detail.product'),
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: t('invoices:detail.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: t('invoices:detail.unitPrice'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} `,
    },
    {
      title: t('invoices:detail.discount'),
      dataIndex: 'discount',
      key: 'discount',
      width: 100,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} `,
    },
    {
      title: t('invoices:form.tax'),
      dataIndex: 'tax',
      key: 'tax',
      width: 100,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} `,
    },
    {
      title: t('invoices:detail.amount'),
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} `,
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
          <Text>{t('invoices:detail.notFound')}</Text>
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
        <Card size="small">
          <Space>
            <Badge status={isOnline ? 'success' : 'error'} />
            <Text>{isOnline ? <WifiOutlined /> : <DisconnectOutlined />}</Text>
            <Text>{isOnline ? t('common:status.online') : t('common:status.offline')}</Text>
            {syncQueueSize > 0 && (
              <>
                <Text>|</Text>
                <Text type="warning">{syncQueueSize} {t('common:sync.pendingChanges')}</Text>
              </>
            )}
            <Button
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
              disabled={!isOnline}
              size="small"
            >
              {t('common:actions.sync')}
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
            <Title level={3}>{t('invoices:detail.title')}: {invoice.invoiceNumber}</Title>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/invoices')}>
                {t('invoices:actions.back')}
              </Button>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                {t('invoices:actions.print')}
              </Button>
              {canEdit && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/dashboard/invoices/${id}`)}
                >
                  {t('invoices:actions.edit')}
                </Button>
              )}
              {canSend && (
                <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
                  {t('invoices:actions.send')}
                </Button>
              )}
              {canCancel && (
                <Button danger icon={<CloseOutlined />} onClick={handleCancel}>
                  {t('invoices:actions.cancel')}
                </Button>
              )}
            </Space>
          </div>

          <Descriptions bordered column={2}>
            <Descriptions.Item label={t('invoices:detail.invoiceNumber')}>{invoice.invoiceNumber}</Descriptions.Item>
            <Descriptions.Item label={t('invoices:detail.status')}>
              <Tag color={statusColors[invoice.status as InvoiceStatus]}>
                {t(`invoices:status.${invoice.status}`)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('invoices:detail.customer')}>{invoice.customerId || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('invoices:detail.supplier')}>{invoice.supplierId || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('invoices:detail.issueDate')}>
              {dayjs(invoice.invoiceDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label={t('invoices:detail.dueDate')}>
              <Text style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
                {invoice.dueDate ? dayjs(invoice.dueDate).format('DD/MM/YYYY') : '-'}
                {isOverdue && ` ${t('invoices:detail.overdue')}`}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('invoices:detail.subtotal')}>
              {invoice.subtotal.toLocaleString('vi-VN')} {invoice.currency}
            </Descriptions.Item>
            <Descriptions.Item label={t('invoices:detail.tax')}>
              {invoice.taxAmount.toLocaleString('vi-VN')} {invoice.currency}
            </Descriptions.Item>
            <Descriptions.Item label={t('invoices:detail.totalAmount')}>
              <Text strong style={{ fontSize: 16 }}>
                {invoice.totalAmount.toLocaleString('vi-VN')} {invoice.currency}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('invoices:detail.paidAmount')}>
              <Text style={{ fontSize: 16 }}>
                {invoice.paidAmount.toLocaleString('vi-VN')} {invoice.currency}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('invoices:detail.remainingAmount')}>
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
            <Descriptions.Item label={t('invoices:detail.syncStatus')}>
              <Tag color={invoice.syncStatus === 'synced' ? 'green' : 'orange'}>
                {invoice.syncStatus === 'synced' ? t('invoices:sync.synced') : t('invoices:sync.pending')}
              </Tag>
            </Descriptions.Item>
            {invoice.notes && (
              <Descriptions.Item label={t('invoices:form.notes')} span={2}>
                {invoice.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card title={t('invoices:detail.productDetails')}>
          <Table
            columns={columns}
            dataSource={invoiceItems}
            rowKey="productId"
            pagination={false}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text>{t('invoices:detail.subtotal')}:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    {invoice.subtotal.toLocaleString('vi-VN')} {invoice.currency}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text>{t('invoices:detail.tax')}:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    {invoice.taxAmount.toLocaleString('vi-VN')} {invoice.currency}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text strong>{t('invoices:detail.totalAmount')}:</Text>
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
              {t('invoices:actions.payment')}
            </Button>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default InvoiceDetail;
