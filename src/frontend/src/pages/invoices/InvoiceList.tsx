import { useState } from 'react';
import { Button, Space, Tag, Select, DatePicker, message, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Invoice, InvoiceStatus } from '../../services/accounting/invoiceService';
import StandardListPage from '../../components/common/StandardListPage';
import { formatCurrency, formatDate } from '../../utils/responsive';
import { useInvoices, useDeleteInvoice, useSendInvoice } from '../../hooks/useInvoices';

const { RangePicker } = DatePicker;

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
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: undefined as InvoiceStatus | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  const { data: invoices = [], isLoading } = useInvoices(filters);
  const deleteInvoiceMutation = useDeleteInvoice();
  const sendInvoiceMutation = useSendInvoice();

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoiceMutation.mutateAsync(id);
      message.success(t('invoices:messages.deleteSuccess'));
    } catch (error: unknown) {
      message.error(t('invoices:messages.deleteError'));
    }
  };

  const handleSend = async (id: string) => {
    try {
      await sendInvoiceMutation.mutateAsync(id);
      message.success(t('invoices:messages.sendSuccess'));
    } catch (error: unknown) {
      message.error(t('invoices:messages.sendError'));
    }
  };

  const columns = [
    {
      title: t('invoices:columns.invoiceNumber'),
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 150,
    },
    {
      title: t('invoices:columns.customer'),
      dataIndex: ['customer', 'name'],
      key: 'customer',
      ellipsis: true,
    },
    {
      title: t('invoices:columns.issueDate'),
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('invoices:columns.dueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('invoices:columns.total'),
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: t('invoices:columns.paidAmount'),
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 150,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: t('invoices:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: InvoiceStatus) => (
        <Tag color={statusColors[status]}>{t(`invoices:status.${status}`)}</Tag>
      ),
    },
    {
      title: t('common:actions.title'),
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Invoice) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/dashboard/invoices/${record.id}`)}
          >
            {t('invoices:actions.view')}
          </Button>
          {record.status === InvoiceStatus.DRAFT && (
            <>
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSend(record.id)}
              >
                {t('invoices:actions.send')}
              </Button>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/dashboard/invoices/${record.id}/edit`)}
              >
                {t('invoices:actions.edit')}
              </Button>
            </>
          )}
          <Popconfirm
            title={t('invoices:messages.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common:actions.delete')}
            cancelText={t('common:actions.cancel')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('invoices:actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filterComponents = (
    <Space wrap>
      <Select
        placeholder={t('invoices:filters.status')}
        style={{ width: 150 }}
        allowClear
        value={filters.status}
        onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
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
    <StandardListPage
      title={t('invoices:title')}
      createButtonText={t('invoices:createButton')}
      onCreateClick={() => navigate('/dashboard/invoices/new')}
      loading={isLoading || deleteInvoiceMutation.isPending || sendInvoiceMutation.isPending}
      dataSource={invoices}
      columns={columns}
      filters={filterComponents}
      pagination={{
        current: filters.page,
        pageSize: filters.limit,
        total: invoices.length,
        showTotal: (total: number) => t('invoices:messages.total', { total }),
        onChange: (page: number, pageSize: number) => {
          setFilters({ ...filters, page, limit: pageSize });
        },
      }}
    />
  );
}
