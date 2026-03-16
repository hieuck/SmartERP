/**
 * List Page Filters Component
 * Search bar and filters for list pages
 */

import { ReactNode, memo } from 'react';
import { Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';

export interface ListPageFiltersProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  bulkActions?: ReactNode;
}

const ListPageFilters = memo<ListPageFiltersProps>(({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  bulkActions,
}) => {
  const { t } = useTranslation('commonUi');
  const { isMobile } = useResponsive();

  if (!onSearchChange && !filters && !bulkActions) {
    return null;
  }

  return (
    <div style={{ padding: isMobile ? '12px 8px' : '16px 24px' }}>
      <Space wrap size={isMobile ? 'small' : 'middle'} style={{ width: '100%' }}>
        {onSearchChange && (
          <Input
            placeholder={searchPlaceholder || t('actions.search')}
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: isMobile ? '100%' : 300 }}
            size={isMobile ? 'middle' : 'middle'}
            allowClear
          />
        )}
        {filters}
        {bulkActions}
      </Space>
    </div>
  );
});

ListPageFilters.displayName = 'ListPageFilters';

export default ListPageFilters;
