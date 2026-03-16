/**
 * List Page Header Component
 * Header for list pages with title, create button, and extra actions
 */

import { ReactNode, memo } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';

export interface ListPageHeaderProps {
  title: string | ReactNode;
  createButtonText?: string;
  onCreateClick?: () => void;
  extraActions?: ReactNode;
}

const ListPageHeader = memo<ListPageHeaderProps>(({
  title,
  createButtonText,
  onCreateClick,
  extraActions,
}) => {
  const { t } = useTranslation('commonUi');
  const { isMobile } = useResponsive();

  return (
    <Space size={isMobile ? 'small' : 'middle'} style={{ width: '100%', justifyContent: 'space-between' }}>
      <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 600 }}>
        {title}
      </div>
      <Space size={isMobile ? 'small' : 'middle'}>
        {extraActions}
        {onCreateClick && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateClick}
            size={isMobile ? 'middle' : 'middle'}
          >
            {isMobile ? '' : (createButtonText || t('actions.create'))}
          </Button>
        )}
      </Space>
    </Space>
  );
});

ListPageHeader.displayName = 'ListPageHeader';

export default ListPageHeader;
