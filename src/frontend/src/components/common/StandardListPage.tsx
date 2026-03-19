/**
 * Standard List Page Component (Refactored)
 * Component chuẩn cho tất cả các trang danh sách trong hệ thống
 * Đảm bảo UI đồng nhất giữa các modules
 * 
 * Refactored to use composition pattern with sub-components:
 * - ListPageHeader: Header with title and actions
 * - ListPageFilters: Search and filters
 * - DesktopTableView: Desktop table
 * - MobileListView: Mobile list
 */

import { ReactNode, memo } from 'react';
import { Card } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { useResponsive } from '@/hooks/useResponsive';
import { getCardSize } from '@/utils/responsive';
import ListPageHeader from './ListPageHeader';
import ListPageFilters from './ListPageFilters';
import DesktopTableView from './DesktopTableView';
import MobileListView from './MobileListView';

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

function StandardListPageComponent<T extends object>({
  title,
  createButtonText,
  onCreateClick,
  extraActions,
  searchPlaceholder,
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
  deleteConfirmTitle,
  customContent,
  mobileRenderItem,
  onMobileItemClick,
}: StandardListPageProps<T>) {
  const responsive = useResponsive();
  const { isMobile } = responsive;

  return (
    <div>
      <Card
        title={
          <ListPageHeader
            title={title}
            createButtonText={createButtonText}
            onCreateClick={onCreateClick}
            extraActions={extraActions}
          />
        }
        bordered={true}
        style={{ margin: 0 }}
        size={getCardSize(responsive)}
        styles={{
          body: { padding: isMobile ? 8 : 0 },
          header: { paddingLeft: isMobile ? 12 : 24, paddingRight: isMobile ? 12 : 24 },
        }}
      >
        {/* Search & Filters */}
        <ListPageFilters
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          filters={filters}
          bulkActions={bulkActions}
        />

        {/* Custom Content */}
        {customContent}

        {/* Mobile or Desktop View */}
        {isMobile ? (
          <MobileListView
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            expandable={expandable}
            pagination={pagination}
            onEdit={onEdit}
            onDelete={onDelete}
            deleteConfirmTitle={deleteConfirmTitle}
            mobileRenderItem={mobileRenderItem}
            onMobileItemClick={onMobileItemClick}
          />
        ) : (
          <DesktopTableView
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            rowKey={rowKey}
            scroll={scroll}
            enableSelection={enableSelection}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={onSelectionChange}
            expandable={expandable}
            pagination={pagination}
            onEdit={onEdit}
            onDelete={onDelete}
            deleteConfirmTitle={deleteConfirmTitle}
          />
        )}
      </Card>
    </div>
  );
}

// Memoize with generic type
const StandardListPage = memo(StandardListPageComponent) as typeof StandardListPageComponent;

export default StandardListPage;
