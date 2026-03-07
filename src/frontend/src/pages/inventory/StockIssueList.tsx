import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Space, Popconfirm, message, Modal } from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  PrinterOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StandardListPage from '../../components/common/StandardListPage';
import MobileListCard from '../../components/common/MobileListCard';
import { createExpandableRender } from '../../components/common/ExpandableContent';
import {
  formatCurrency,
  formatDate,
  COLUMN_WIDTHS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from '../../constants/ui';
import { inventoryService, StockIssue } from '../../services/inventoryService';
import { printDocument } from '../../components/PrintTemplate';
import { useResponsive } from '../../hooks/useResponsive';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

export default function StockIssueList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsive();
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
      message.success('Duyệt phiếu xuất thành công!');
      queryClient.invalidateQueries({ queryKey: ['stockIssues'] });
    },
    onError: () => {
      message.error('Duyệt phiếu xuất thất bại!');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => inventoryService.cancelStockIssue(id),
    onSuccess: () => {
      message.success('Hủy phiếu xuất thành công!');
      queryClient.invalidateQueries({ queryKey: ['stockIssues'] });
    },
    onError: () => {
      message.error('Hủy phiếu xuất thất bại!');
    },
  });

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: 'Nháp' },
      pending: { color: 'processing', text: 'Chờ Duyệt' },
      approved: { color: 'success', text: 'Đã Duyệt' },
      cancelled: { color: 'error', text: 'Đã Hủy' },
    };
    const { color, text } = statusMap[status] || statusMap.draft;
    return (
      <Tag color={color} style={{ fontSize: isMobile ? 11 : 12, margin: 0 }}>
        {text}
      </Tag>
    );
  };

  const getActionMenu = (record: StockIssue): MenuProps['items'] => [
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'In phiếu',
      onClick: () => printDocument('issue', record),
    },
    ...(record.status === 'pending'
      ? [
          {
            key: 'approve',
            icon: <CheckOutlined />,
            label: 'Duyệt phiếu',
            onClick: () => {
              Modal.confirm({
                title: 'Bạn có chắc muốn duyệt phiếu xuất này?',
                onOk: () => approveMutation.mutate(record.id),
                okText: 'Duyệt',
                cancelText: 'Hủy',
              });
            },
          },
          {
            key: 'cancel',
            icon: <CloseOutlined />,
            label: 'Hủy phiếu',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: 'Bạn có chắc muốn hủy phiếu xuất này?',
                onOk: () => cancelMutation.mutate(record.id),
                okText: 'Hủy Phiếu',
                cancelText: 'Không',
              });
            },
          },
        ]
      : []),
  ];

  const columns: ColumnsType<StockIssue> = [
    {
      title: 'Mã Phiếu',
      dataIndex: 'code',
      key: 'code',
      width: isMobile ? 90 : COLUMN_WIDTHS.code,
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
      title: 'Ngày Xuất',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: isMobile ? 85 : COLUMN_WIDTHS.date,
      render: (date) => <span style={{ fontSize: isMobile ? 12 : 14 }}>{formatDate(date)}</span>,
    },
    {
      title: 'Tổng Tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: isMobile ? 85 : COLUMN_WIDTHS.price,
      align: 'right' as const,
      render: (amount) => (
        <span style={{ fontSize: isMobile ? 12 : 14 }}>{formatCurrency(amount)}</span>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 80 : COLUMN_WIDTHS.status,
      render: getStatusTag,
    },
    ...(!isMobile
      ? [
          {
            title: 'Ghi Chú',
            dataIndex: 'notes',
            key: 'notes',
            width: 150,
            ellipsis: true,
          },
        ]
      : []),
    {
      title: 'Thao Tác',
      key: 'actions',
      width: isMobile ? 60 : 150,
      fixed: isMobile ? false : ('right' as const),
      render: (_, record) =>
        isMobile ? (
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              // Menu sẽ được xử lý bởi MobileListCard
            }}
          />
        ) : (
          <Space size="small">
            <Button
              type="link"
              icon={<PrinterOutlined />}
              onClick={() => printDocument('issue', record)}
            />
            {record.status === 'pending' && (
              <>
                <Popconfirm
                  title="Bạn có chắc muốn duyệt phiếu xuất này?"
                  onConfirm={() => approveMutation.mutate(record.id)}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button type="link" icon={<CheckOutlined />} />
                </Popconfirm>
                <Popconfirm
                  title="Bạn có chắc muốn hủy phiếu xuất này?"
                  onConfirm={() => cancelMutation.mutate(record.id)}
                  okText="Hủy Phiếu"
                  cancelText="Không"
                >
                  <Button type="link" danger icon={<CloseOutlined />} />
                </Popconfirm>
              </>
            )}
          </Space>
        ),
    },
  ];

  const renderMobileItem = (record: StockIssue) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: 'Nháp' },
      pending: { color: 'processing', text: 'Chờ Duyệt' },
      approved: { color: 'success', text: 'Đã Duyệt' },
      cancelled: { color: 'error', text: 'Đã Hủy' },
    };
    const { color, text } = statusMap[record.status] || statusMap.draft;

    return (
      <MobileListCard
        title={record.code}
        subtitle={formatDate(record.issueDate)}
        tags={[{ label: text, color }]}
        fields={[
          { label: 'Tổng tiền', value: formatCurrency(record.totalAmount) },
          { label: 'Ghi chú', value: record.notes || '-' },
        ]}
        actions={getActionMenu(record)}
        onClick={() => navigate(`/inventory/issues/${record.id}`)}
      />
    );
  };

  return (
    <StandardListPage
      title="Phiếu Xuất Kho"
      createButtonText="Tạo Phiếu Xuất"
      onCreateClick={() => navigate('/inventory/issues/new')}
      searchPlaceholder="Tìm kiếm phiếu xuất..."
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
            { label: 'Mã Phiếu', value: record.code },
            { label: 'Ngày Xuất', value: formatDate(record.issueDate, 'datetime') },
            { label: 'Tổng Tiền', value: formatCurrency(record.totalAmount) },
            { label: 'Ghi Chú', value: record.notes, span: 3 },
          ],
          { column: 3, bordered: true },
        ),
      }}
      pagination={{
        current: page,
        pageSize,
        total: data?.meta?.total || 0,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} phiếu`,
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
