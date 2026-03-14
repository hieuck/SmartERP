import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, message, Modal } from 'antd';
import { CheckOutlined, CloseOutlined, PrinterOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { createExpandableRender } from '@/components/common/ExpandableContent';
import { formatCurrency, formatDate } from '@/utils/responsive';
import { inventoryService, StockIssue } from '@/services/inventory/inventoryService';
import { printDocument } from '@/components/PrintTemplate';
import { useResponsive } from '@/hooks/useResponsive';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

export default function StockIssueList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsive();
  const { t } = useTranslation(['inventory', 'common']);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['stockIssues', { page, pageSize }],
    queryFn: () => inventoryService.getStockIssues({ page, limit: pageSize }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => inventoryService.approveStockIssue(id),
    onSuccess: () => {
      message.success(t('inventory:messages.issueApproveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['stockIssues'] });
    },
    onError: () => {
      message.error(t('inventory:messages.issueApproveError'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => inventoryService.cancelStockIssue(id),
    onSuccess: () => {
      message.success(t('inventory:messages.issueCancelSuccess'));
      queryClient.invalidateQueries({ queryKey: ['stockIssues'] });
    },
    onError: () => {
      message.error(t('inventory:messages.issueCancelError'));
    },
  });

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string }> = {
      draft: { color: 'default' },
      pending: { color: 'processing' },
      approved: { color: 'success' },
      cancelled: { color: 'error' },
    };
    const { color } = statusMap[status] || statusMap.draft;
    return (
      <Tag color={color} style={{ fontSize: isMobile ? 11 : 12, margin: 0 }}>
        {t(`inventory:status.${status}`)}
      </Tag>
    );
  };

  const getActionMenu = (record: StockIssue): MenuProps['items'] => [
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: t('inventory:actions.print'),
      onClick: () => printDocument('issue', record),
    },
    ...(record.status === 'pending'
      ? [
          {
            key: 'approve',
            icon: <CheckOutlined />,
            label: t('inventory:actions.approve'),
            onClick: () => {
              Modal.confirm({
                title: t('inventory:messages.issueApproveConfirm'),
                onOk: () => approveMutation.mutate(record.id),
                okText: t('inventory:actions.approve'),
                cancelText: t('common:actions.cancel'),
              });
            },
          },
          {
            key: 'cancel',
            icon: <CloseOutlined />,
            label: t('inventory:actions.cancel'),
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: t('inventory:messages.issueCancelConfirm'),
                onOk: () => cancelMutation.mutate(record.id),
                okText: t('inventory:actions.cancel'),
                cancelText: t('common:actions.cancel'),
              });
            },
          },
        ]
      : []),
  ];

  const columns: ColumnsType<StockIssue> = [
    {
      title: t('inventory:columns.code'),
      dataIndex: 'code',
      key: 'code',
      width: isMobile ? 90 : 120,
      render: (code, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/inventory/issues/${record.id}`)}
          style={{ padding: 0, fontSize: isMobile ? 12 : 14 }}
        >
          {code}
        </Button>
      ),
    },
    {
      title: t('inventory:columns.issueDate'),
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: isMobile ? 85 : 120,
      render: (date) => <span style={{ fontSize: isMobile ? 12 : 14 }}>{formatDate(date)}</span>,
    },
    {
      title: t('inventory:columns.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: isMobile ? 85 : 150,
      align: 'right' as const,
      render: (amount) => (
        <span style={{ fontSize: isMobile ? 12 : 14 }}>{formatCurrency(amount)}</span>
      ),
    },
    {
      title: t('inventory:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 80 : 120,
      render: getStatusTag,
    },
    ...(!isMobile
      ? [
          {
            title: t('inventory:columns.notes'),
            dataIndex: 'notes',
            key: 'notes',
            width: 150,
            ellipsis: true,
          },
        ]
      : []),
  ];

  const renderMobileItem = (record: StockIssue) => {
    return {
      title: record.code,
      subtitle: formatDate(record.issueDate),
      tags: [{ label: t(`inventory:status.${record.status}`), color: getStatusTag(record.status).props.color }],
      fields: [
        { label: t('inventory:columns.totalAmount'), value: formatCurrency(record.totalAmount) },
        { label: t('inventory:columns.notes'), value: record.notes || '-' },
      ],
      actions: getActionMenu(record),
    };
  };

  return (
    <StandardListPage
      title={t('inventory:issues.title')}
      createButtonText={t('inventory:issues.createButton')}
      onCreateClick={() => navigate('/inventory/issues/new')}
      searchPlaceholder={t('inventory:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={data || []}
      loading={isLoading}
      enableSelection
      selectedRowKeys={selectedRowKeys}
      onSelectionChange={(keys) => setSelectedRowKeys(keys as string[])}
      mobileRenderItem={renderMobileItem}
      onMobileItemClick={(record) => navigate(`/inventory/issues/${record.id}`)}
      expandable={{
        expandedRowRender: createExpandableRender<StockIssue>(
          (record) => [
            { label: t('inventory:columns.code'), value: record.code },
            { label: t('inventory:columns.issueDate'), value: formatDate(record.issueDate) },
            { label: t('inventory:columns.totalAmount'), value: formatCurrency(record.totalAmount) },
            { label: t('inventory:columns.notes'), value: record.notes, span: 3 },
          ],
          { column: 3, bordered: true },
        ),
      }}
      pagination={{
        current: page,
        pageSize,
        total: data?.meta?.total || 0,
        showSizeChanger: true,
        showTotal: (total) => t('inventory:messages.totalIssues', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
