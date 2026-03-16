/**
 * Mobile List View Component
 * List view for mobile screens with card-based layout
 */

import { memo } from 'react';
import { List, Empty, Card, Dropdown, Button, Collapse } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ListItemActions from './ListItemActions';
import type { ColumnsType, ColumnType, TableProps } from 'antd/es/table';
import type { MenuProps } from 'antd';

export interface MobileListViewProps<T> {
  columns: ColumnsType<T>;
  dataSource?: T[];
  loading?: boolean;
  expandable?: TableProps<T>['expandable'];
  pagination?:
    | {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number, pageSize: number) => void;
      }
    | false;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  deleteConfirmTitle?: string;
  mobileRenderItem?: (record: T) => React.ReactNode;
  onMobileItemClick?: (record: T) => void;
}

function MobileListViewComponent<T extends Record<string, unknown>>({
  columns,
  dataSource = [],
  loading = false,
  expandable,
  pagination,
  onEdit,
  onDelete,
  deleteConfirmTitle,
  mobileRenderItem,
  onMobileItemClick,
}: MobileListViewProps<T>) {
  const { t } = useTranslation('commonUi');

  // If custom render provided, use it
  if (mobileRenderItem) {
    return (
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
        locale={{ emptyText: <Empty description={t('messages.noData')} /> }}
      />
    );
  }

  // Default card-based rendering
  return (
    <List
      dataSource={dataSource}
      loading={loading}
      renderItem={(item) => {
        // Get menu items for actions - cast to MenuProps['items']
        const menuItems = ListItemActions({
          record: item,
          onEdit,
          onDelete,
          deleteConfirmTitle,
          isMobile: true,
        }) as MenuProps['items'];

        return (
          <Card
            size="small"
            style={{ marginBottom: 8, position: 'relative' }}
            styles={{ body: { paddingRight: menuItems && menuItems.length > 0 ? 40 : 12, paddingBottom: 8 } }}
          >
            {/* Actions dropdown in top-right corner */}
            {(onEdit || onDelete) && menuItems && menuItems.length > 0 && (
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

            {/* Display first 4 columns - clickable for detail view */}
            <div
              onClick={() => onMobileItemClick?.(item)}
              style={{ cursor: onMobileItemClick ? 'pointer' : 'default' }}
            >
              {columns.slice(0, 4).map((col, idx) => {
                // Type guard to check if column is ColumnType (not ColumnGroupType)
                if (!('dataIndex' in col)) return null;
                
                const column = col as ColumnType<T>;
                const value = column.dataIndex ? item[column.dataIndex as string] : null;
                const rendered = column.render ? column.render(value, item, idx) : value;
                
                // Handle column.title which can be string, ReactNode, or function
                const title = typeof column.title === 'function' 
                  ? column.title({ sortColumns: undefined }) 
                  : column.title;

                return (
                  <div key={idx} style={{ marginBottom: idx < 3 ? 8 : 0 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                      {title ? <>{title}</> : ''}
                    </div>
                    <div style={{ fontSize: 14 }}>{rendered ? <>{rendered}</> : '-'}</div>
                  </div>
                );
              })}
            </div>

            {/* Expandable content if provided */}
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
                        {t('messages.viewMore')}
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
      locale={{ emptyText: <Empty description={t('messages.noData')} /> }}
    />
  );
}

// Memoize with generic type
const MobileListView = memo(MobileListViewComponent) as typeof MobileListViewComponent;

export default MobileListView;
