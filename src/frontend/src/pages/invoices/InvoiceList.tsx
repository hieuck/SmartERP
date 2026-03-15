/**
 * Invoice List Page - Offline-First
 * Displays list of invoices with offline-first support
 * Features: auto-sync, manual sync, network status, sync queue, status & date filtering
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Tag,
  Popconfirm,
  message,
  Typography,
  Badge,
  Select,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
  EyeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Invoice, SyncStatus } from '@/lib/offline/db';
import { formatCurrency, formatDate } from '@/utils/responsive';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Invoice status enum (matching backend)
enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

const statusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'default',
  [InvoiceStatus.SENT]: 'processing',
  [InvoiceStatus.PAID]: 'success',
  [InvoiceStatus.OVERDUE]: 'error',
  [InvoiceStatus.CANCELLED]: 'default',
};

export default function InvoiceList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['invoices', 'common']);
  const { isMobile, isTablet } = useResponsive();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>();
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('InvoiceList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('InvoiceList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load invoices from offline storage
  const loadInvoices = async () => {
    setLoading(true);
    try {
      logger.debug('InvoiceList', 'Loading invoices from offline storage');
      const allInvoices = await offlineServices.invoices.getAll();
      
      // Filter by search, status, and date range
      let filtered = allInvoices;
      
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (inv) =>
            inv.invoiceNumber?.toLowerCase().includes(searchLower) ||
            inv.customerName?.toLowerCase().includes(searchLower)
        );
      }
      
      if (statusFilter) {
        filtered = filtered.filter((inv) => inv.status === statusFilter);
      }
      
      if (dateRange[0] && dateRange[1]) {
        const startDate = dayjs(dateRange[0]);
        const endDate = dayjs(dateRange[1]);
        filtered = filtered.filter((inv) => {
          const issueDate = dayjs(inv.issueDate);
          return issueDate.isAfter(startDate) && issueDate.isBefore(endDate);
        });
      }

      setInvoices(filtered);
      logger.info('InvoiceList', `Loaded ${filtered.length} invoices`);
    } catch (error) {
      logger.error('InvoiceList', 'Failed to load invoices', error as Error);
      message.error(t('invoices:messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Update queue size
  const updateQueueSize = async () => {
    try {
      const size = await syncManager.getQueueSize();
      setQueueSize(size);
    } catch (error) {
      logger.error('InvoiceList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadInvoices();
      await updateQueueSize();

      if (isOnline) {
        const token = localStorage.getItem('token');
        if (token && !syncManager.isSyncing()) {
          handleSync();
        }
      }
    };

    initializeData();
  }, []);

  // Reload invoices when filters change
  useEffect(() => {
    loadInvoices();
  }, [search, statusFilter, dateRange]);

  // Handle sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error(t('common:messages.loginRequired'));
      return;
    }

    if (!isOnline) {
      message.warning(t('common:messages.offlineMode'));
      return;
    }

    setSyncing(true);
    try {
      logger.info('InvoiceList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadInvoices();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('InvoiceList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (invoice: Invoice) => {
    try {
      logger.info('InvoiceList', `Deleting invoice: ${invoice.id}`);
      await offlineServices.invoices.delete(invoice.id);
      message.success(t('invoices:messages.deleteSuccess'));
      await loadInvoices();
      await updateQueueSize();
    } catch (error) {
      logger.error('InvoiceList', 'Failed to delete invoice', error as Error);
      message.error(t('invoices:messages.deleteError'));
    }
  };

  // Handle send (update status to SENT)
  const handleSend = async (invoice: Invoice) => {
    try {
      logger.info('InvoiceList', `Sending invoice: ${invoice.id}`);
      await offlineServices.invoices.update(invoice.id, { status: InvoiceStatus.SENT });
      message.success(t('invoices:messages.sendSuccess'));
      await loadInvoices();
      await updateQueueSize();
    } catch (error) {
      logger.error('InvoiceList', 'Failed to send invoice', error as Error);
      message.error(t('invoices:messages.sendError'));
    }
  };

  // Get paginated data
  const paginatedInvoices = invoices.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Invoice> = [
    {
      title: t('invoices:columns.invoiceNumber'),
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 150,
    },
    {
      title: t('invoices:columns.customer'),
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: t('invoices:columns.issueDate'),
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 120,
      render: (date: string) => (date ? formatDate(date) : '-'),
    },
    {
      title: t('invoices:columns.dueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => (date ? formatDate(date) : '-'),
    },
    {
      title: t('invoices:columns.total'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      align: 'right',
      render: (val: number) => (val ? formatCurrency(val) : '-'),
    },
    {
      title: t('invoices:columns.paidAmount'),
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 150,
      align: 'right',
      render: (val: number) => (val ? formatCurrency(val) : '-'),
    },
    {
      title: t('invoices:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status as InvoiceStatus] || 'default'}>
          {t(`invoices:status.${status}`)}
        </Tag>
      ),
    },
    {
      title: 'Sync',
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      width: isMobile ? 80 : 100,
      render: (syncStatus: SyncStatus) => {
        const colors = {
          [SyncStatus.SYNCED]: 'success',
          [SyncStatus.PENDING]: 'warning',
          [SyncStatus.CONFLICT]: 'error',
        };
        const labels = {
          [SyncStatus.SYNCED]: 'Synced',
          [SyncStatus.PENDING]: 'Pending',
          [SyncStatus.CONFLICT]: 'Conflict',
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || 'Unknown'}
          </Tag>
        );
      },
    },
    {
      title: t('common:actions.title'),
      key: 'action',
      width: isMobile ? 150 : 200,
      fixed: isMobile ? undefined : 'right',
      render: (_: any, record: Invoice) => (
        <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/dashboard/invoices/${record.id}`)}
          >
            {!isMobile && t('invoices:actions.view')}
          </Button>
          {record.status === InvoiceStatus.DRAFT && (
            <>
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSend(record)}
              >
                {!isMobile && t('invoices:actions.send')}
              </Button>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/dashboard/invoices/${record.id}/edit`)}
              >
                {!isMobile && t('invoices:actions.edit')}
              </Button>
            </>
          )}
          <Popconfirm
            title={t('invoices:messages.deleteConfirm')}
            onConfirm={() => handleDelete(record)}
            okText={t('common:actions.delete')}
            cancelText={t('common:actions.cancel')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {!isMobile && t('invoices:actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : isTablet ? 16 : 24 }}>
      <Card size={isMobile ? 'small' : 'default'}>
        <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 'small' : 'large'}>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 12 : 0,
            }}
          >
            <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              <FileTextOutlined /> {t('invoices:title')}
            </Title>
            <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
              <Badge
                status={isOnline ? 'success' : 'error'}
                text={
                  <Space size="small">
                    {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                    {isOnline ? 'Online' : 'Offline'}
                  </Space>
                }
              />
              
              {queueSize > 0 && (
                <Badge count={queueSize} showZero={false}>
                  <Tag color="warning">Pending Sync</Tag>
                </Badge>
              )}

              <Button
                icon={<SyncOutlined spin={syncing} />}
                onClick={handleSync}
                loading={syncing}
                disabled={!isOnline}
                style={{ width: isMobile ? '100%' : 'auto' }}
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ width: isMobile ? '100%' : 'auto' }}
                onClick={() => navigate('/dashboard/invoices/new')}
              >
                {t('invoices:createButton')}
              </Button>
            </Space>
          </div>

          <Space direction={isMobile ? 'vertical' : 'horizontal'} wrap style={{ width: isMobile ? '100%' : 'auto' }}>
            <Input
              placeholder={t('invoices:searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: isMobile ? '100%' : 250 }}
              allowClear
              size={isMobile ? 'middle' : 'large'}
            />
            
            <Select
              placeholder={t('invoices:filters.status')}
              style={{ width: isMobile ? '100%' : 150 }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              size={isMobile ? 'middle' : 'large'}
            >
              {Object.values(InvoiceStatus).map((status) => (
                <Select.Option key={status} value={status}>
                  {t(`invoices:status.${status}`)}
                </Select.Option>
              ))}
            </Select>
            
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={[t('invoices:filters.fromDate'), t('invoices:filters.toDate')]}
              style={{ width: isMobile ? '100%' : 'auto' }}
              size={isMobile ? 'middle' : 'large'}
              onChange={(dates) => {
                setDateRange([
                  dates?.[0]?.format('YYYY-MM-DD'),
                  dates?.[1]?.format('YYYY-MM-DD'),
                ]);
              }}
            />
          </Space>

          <Table
            columns={columns}
            dataSource={paginatedInvoices}
            loading={loading}
            rowKey="id"
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              current: page,
              pageSize,
              total: invoices.length,
              showSizeChanger: !isMobile,
              showTotal: (total) => t('invoices:messages.total', { total }),
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
              simple: isMobile,
            }}
            scroll={{ x: isMobile ? 1200 : 1400 }}
          />
        </Space>
      </Card>
    </div>
  );
}
