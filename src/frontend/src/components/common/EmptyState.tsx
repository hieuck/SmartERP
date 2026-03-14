/**
 * EmptyState Component
 *
 * Standardized empty state component following Ant Design guidelines
 * Used when lists or tables have no data
 * Supports i18n and responsive design
 *
 * @example
 * <EmptyState
 *   description={t('products:messages.noProducts')}
 *   actionText={t('products:actions.createProduct')}
 *   onAction={() => navigate('/products/new')}
 *   showAction
 * />
 */

import { ReactNode } from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { getSpacing, getButtonSize } from '@/utils/responsive';

interface EmptyStateProps {
  description?: string;
  image?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  showAction?: boolean;
}

export default function EmptyState({
  description,
  image,
  actionText,
  onAction,
  showAction = false,
}: EmptyStateProps) {
  const { t } = useTranslation('commonUi');
  const responsive = useResponsive();
  const { isMobile } = responsive;

  const padding = getSpacing(responsive, 'sectionSpacing');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${padding * 2}px 0`,
        background: '#fff',
        borderRadius: BORDER_RADIUS.lg,
      }}
    >
      <Empty
        image={image || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span
            style={{
              color: 'rgba(0, 0, 0, 0.45)',
              fontSize: isMobile ? 13 : 14,
            }}
          >
            {description || t('emptyState.noData')}
          </span>
        }
      >
        {showAction && onAction && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAction}
            size={getButtonSize(responsive)}
            style={{ marginTop: SPACING.base }}
          >
            {actionText || t('emptyState.createNew')}
          </Button>
        )}
      </Empty>
    </div>
  );
}
