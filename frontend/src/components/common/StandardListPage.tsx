/**
 * Standard List Page Component
 * Component chuẩn cho tất cả các trang danh sách trong hệ thống
 * Đảm bảo UI đồng nhất giữa các modules
 */

import { ReactNode, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Popconfirm,
  List,
  Empty,
  Dropdown,
  Collapse,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { useResponsive } from '../../hooks/useResponsive';
import type { MenuProps } from 'antd';

export interface StandardListPageProps<T> {
  // Header
  title: string | ReactNode;
  createButtonText?: string;
  onCreateClick?: () => void;
  extraActions?: ReactNode;

  // Search & Filters
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;

  // Table
  columns: ColumnsType<T>;
  dataSource?: T[];
  loading?: boolean;
  rowKey?: string | ((record: T) => string);
  scroll?: { x?: string | number | true; y?: string | number };

  // Selection
  enableSelection?: boolean;
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (keys: React.Key[]) => void;
  bulkActions?: ReactNode;

  // Expandable
  expandable?: TableProps<T>['expandable'];

  // Pagination
  pagination?:
    | {
        current: number;
        pageSize: number;
        total: number;
        showSizeChanger?: boolean;
        showTotal?: (total: number) => string;
        onChange: (page: number, pageSize: number) => void;
      }
    | false;

  // Actions
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  deleteConfirmTitle?: string;

  // Custom
  customContent?: ReactNode;

  // Mobile
  mobileRenderItem?: (record: T) => ReactNode;
  onMobileItemClick?: (record: T) => void;
}

export default function StandardListPage<T extends Record<string, any>>({
  title,
  createButtonText = 'Thêm Mới',
  onCreateClick,
  extraActions,
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  filters,
  columns,
  dataSource = [],
  loading = false,
  rowKey = 'id',
  scroll,
  enableSelection = false,
  selectedRowKeys = [],
  onSelectionChange,
  bulkActions,
  expandable,
  pagination,
  onEdit,
  onDelete,
  deleteConfirmTitle = 'Bạn có chắc muốn xóa?',
  customContent,
  mobileRenderItem,
  onMobileItemClick,
}: StandardListPageProps<T>) {
  const { isMobile } = useResponsive();

  // Thêm cột actions cho desktop table (mobile dùng card không cần)
  const finalColumns: ColumnsType<T> = [...columns];

  if ((onEdit || onDelete) && !isMobile) {
    finalColumns.push({
      title: 'Thao Tác',
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center' as const,
      render: (_, record) => (
        <Space>
          {onEdit && (
            <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
              Sửa
            </Button>
          )}
          {onDelete && (
            <Popconfirm
              title={deleteConfirmTitle}
              onConfirm={() => onDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  return (
    <div>
      <Card
        title={isMobile ? <div style={{ fontSize: 16 }}>{title}</div> : title}
        bordered={true}
        style={{ margin: 0 }}
        styles={{
          body: { padding: isMobile ? 8 : 0 },
          header: { paddingLeft: isMobile ? 12 : 24, paddingRight: isMobile ? 12 : 24 },
        }}
        extra={
          <Space size={isMobile ? 'small' : 'middle'}>
            {extraActions}
            {onCreateClick && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreateClick}
                size={isMobile ? 'middle' : 'middle'}
              >
                {isMobile ? '' : createButtonText}
              </Button>
            )}
          </Space>
        }
      >
        {/* Search & Filters */}
        {(onSearchChange || filters || bulkActions) && (
          <div style={{ padding: isMobile ? '12px 8px' : '16px 24px' }}>
            <Space wrap size={isMobile ? 'small' : 'middle'} style={{ width: '100%' }}>
              {onSearchChange && (
                <Input
                  placeholder={searchPlaceholder}
                  prefix={<SearchOutlined />}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  style={{ width: isMobile ? '100%' : 300 }}
                  size={isMobile ? 'middle' : 'middle'}
                />
              )}
              {filters}
              {bulkActions}
            </Space>
          </div>
        )}

        {/* Custom Content */}
        {customContent}

        {/* Mobile List View */}
        {isMobile && mobileRenderItem ? (
          <List
            dataSource={dataSource}
            loading={loading}
            renderItem={(item) => (
              <div onClick={() => onMobileItemClick?.(item)}>{mobileRenderItem(item)}</div>
            )}
            pagination={
              pagination
                ? {
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: false,
                    simple: true,
                    onChange: pagination.onChange,
                  }
                : false
            }
            locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
          />
        ) : isMobile ? (
          /* Mobile: Auto Card View from columns */
          <List
            dataSource={dataSource}
            loading={loading}
            renderItem={(item) => {
              // Tạo menu items cho dropdown
              const menuItems: MenuProps['items'] = [];
              if (onEdit) {
                menuItems.push({
                  key: 'edit',
                  label: 'Sửa',
                  icon: <EditOutlined />,
                  onClick: () => onEdit(item),
                });
              }
              if (onDelete) {
                menuItems.push({
                  key: 'delete',
                  label: 'Xóa',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => {
                    const confirmed = window.confirm(deleteConfirmTitle);
                    if (confirmed) {
                      onDelete(item);
                    }
                  },
                });
              }

              return (
                <Card
                  size="small"
                  style={{ marginBottom: 8, position: 'relative' }}
                  bodyStyle={{ paddingRight: menuItems.length > 0 ? 40 : 12, paddingBottom: 8 }}
                >
                  {/* Menu 3 chấm ở góc phải */}
                  {(onEdit || onDelete) && menuItems.length > 0 && (
                    <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                      <Dropdown
                        menu={{ items: menuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  )}

                  {/* Hiển thị 4 trường đầu - có thể click để xem chi tiết */}
                  <div
                    onClick={() => onMobileItemClick?.(item)}
                    style={{ cursor: onMobileItemClick ? 'pointer' : 'default' }}
                  >
                    {columns.slice(0, 4).map((col: any, idx) => {
                      const value = col.dataIndex ? item[col.dataIndex] : null;
                      const rendered = col.render ? col.render(value, item, idx) : value;

                      return (
                        <div key={idx} style={{ marginBottom: idx < 3 ? 8 : 0 }}>
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                            {col.title}
                          </div>
                          <div style={{ fontSize: 14 }}>{rendered || '-'}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Nút mở rộng nếu có expandable */}
                  {expandable && expandable.expandedRowRender && (
                    <Collapse
                      ghost
                      size="small"
                      style={{ marginTop: 8 }}
                      items={[
                        {
                          key: '1',
                          label: (
                            <span style={{ fontSize: 13, color: '#1890ff' }}>
                              Xem thêm thông tin
                            </span>
                          ),
                          children: expandable.expandedRowRender(item, 0, 0, false),
                        },
                      ]}
                    />
                  )}
                </Card>
              );
            }}
            pagination={
              pagination
                ? {
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: false,
                    simple: true,
                    onChange: pagination.onChange,
                  }
                : false
            }
            locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
          />
        ) : (
          /* Desktop Table View */
          <Table
            columns={finalColumns}
            dataSource={dataSource}
            rowKey={rowKey}
            loading={loading}
            scroll={isMobile ? { x: 'max-content', y: undefined } : scroll || { x: 'max-content' }}
            size={isMobile ? 'small' : 'middle'}
            rowSelection={
              enableSelection && !isMobile
                ? {
                    selectedRowKeys,
                    onChange: onSelectionChange,
                    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
                  }
                : undefined
            }
            expandable={expandable}
            pagination={
              pagination
                ? {
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: isMobile ? false : (pagination.showSizeChanger ?? true),
                    simple: isMobile,
                    showTotal: isMobile
                      ? undefined
                      : (pagination.showTotal ?? ((total) => `Tổng ${total} bản ghi`)),
                    onChange: pagination.onChange,
                    size: isMobile ? 'small' : 'default',
                  }
                : false
            }
          />
        )}
      </Card>
    </div>
  );
}
