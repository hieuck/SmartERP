/**
 * Desktop Table View Component
 * Table view for desktop screens
 */

import { memo, useMemo } from 'react';
import { Table, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { getTableSize } from '@/utils/responsive';
import { useResponsive } from '@/hooks/useResponsive';
import ListItemActions from './ListItemActions';
import type { ColumnsType, TableProps } from 'antd/es/table';

export interface DesktopTableViewProps<T> {
  columns: ColumnsType<T>;
  dataSource?: T[];
  loading?: boolean;
  rowKey?: string | ((record: T) => string);
  scroll?: { x?: string | number | true; y?: string | number };
  enableSelection?: boolean;
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (keys: React.Key[]) => void;
  expandable?: TableProps<T>['expandable'];
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
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  deleteConfirmTitle?: string;
}

function DesktopTableViewComponent<T extends Record<string, any>>({
  columns,
  dataSource = [],
  loading = false,
  rowKey = 'id',
  scroll,
  enableSelection = false,
  selectedRowKeys = [],
  onSelectionChange,
  expandable,
  pagination,
  onEdit,
  onDelete,
  deleteConfirmTitle,
}: DesktopTableViewProps<T>) {
  const { t } = useTranslation('commonUi');
  const responsive = useResponsive();

  // Add actions column if needed
  const finalColumns: ColumnsType<T> = useMemo(() => {
    const cols = [...columns];

    if (onEdit || onDelete) {
      cols.push({
        title: t('table.actions'),
        key: 'action',
        width: 150,
        fixed: 'right',
        align: 'center',
        render: (_, record) => (
          <ListItemActions
            record={record}
            onEdit={onEdit}
            onDelete={onDelete}
            deleteConfirmTitle={deleteConfirmTitle}
            isMobile={false}
          />
        ),
      });
    }

    return cols;
  }, [columns, onEdit, onDelete, deleteConfirmTitle, t]);

  return (
    <Table
      columns={finalColumns}
      dataSource={dataSource}
      rowKey={rowKey}
      loading={loading}
      scroll={scroll || { x: 'max-content' }}
      size={getTableSize(responsive)}
      rowSelection={
        enableSelection
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
              showSizeChanger: pagination.showSizeChanger ?? true,
              showTotal: pagination.showTotal ?? ((total) => t('messages.total', { total })),
              onChange: pagination.onChange,
            }
          : false
      }
      locale={{ emptyText: <Empty description={t('messages.noData')} /> }}
    />
  );
}

// Memoize with generic type
const DesktopTableView = memo(DesktopTableViewComponent) as typeof DesktopTableViewComponent;

export default DesktopTableView;
