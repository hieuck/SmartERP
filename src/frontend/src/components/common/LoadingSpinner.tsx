/**
 * LoadingSpinner Component
 *
 * Standardized loading indicator following Ant Design guidelines
 * Can be used inline or as full-screen overlay
 * Supports i18n and responsive design
 *
 * @example
 * // Inline loading
 * <LoadingSpinner tip={t('commonUi:loadingState.loading')} />
 *
 * // Full screen loading
 * <LoadingSpinner fullScreen tip={t('commonUi:loadingState.processing')} />
 */

import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../hooks/useResponsive';
import { Z_INDEX } from '../../constants/design-tokens';
import { getSpacing } from '../../utils/responsive';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'default',
  tip,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { t } = useTranslation('commonUi');
  const responsive = useResponsive();
  const { isMobile } = responsive;

  const padding = getSpacing(responsive, 'sectionSpacing');

  // Responsive icon size
  const getIconSize = () => {
    if (size === 'large') return isMobile ? 40 : 48;
    if (size === 'small') return 16;
    return isMobile ? 20 : 24;
  };

  const antIcon = <LoadingOutlined style={{ fontSize: getIconSize() }} spin />;

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          zIndex: Z_INDEX.modal,
        }}
      >
        <Spin
          indicator={antIcon}
          size={size}
          tip={tip || t('loadingState.loading')}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${padding * 2}px 0`,
      }}
    >
      <Spin
        indicator={antIcon}
        size={size}
        tip={tip || t('loadingState.loading')}
      />
    </div>
  );
}
