/**
 * Standard Form Page Component
 * Component chuẩn cho tất cả các trang form trong hệ thống
 * Đảm bảo UI đồng nhất giữa các modules
 */

import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Space, Flex } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import { getCardSize, getButtonSize } from '@/utils/responsive';

export interface StandardFormPageProps {
  // Header
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backPath?: string;

  // Actions
  onSave?: () => void;
  onCancel?: () => void;
  saveButtonText?: string;
  cancelButtonText?: string;
  saveButtonLoading?: boolean;
  saveButtonDisabled?: boolean;
  extraActions?: ReactNode;

  // Content
  children: ReactNode;

  // Card props
  bordered?: boolean;
}

export default function StandardFormPage({
  title,
  subtitle,
  onBack,
  backPath,
  onSave,
  onCancel,
  saveButtonText,
  cancelButtonText,
  saveButtonLoading = false,
  saveButtonDisabled = false,
  extraActions,
  children,
  bordered = true,
}: StandardFormPageProps) {
  const { t } = useTranslation('commonUi');
  const navigate = useNavigate();
  const responsive = useResponsive();
  const { isMobile } = responsive;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      handleBack();
    }
  };

  return (
    <div style={{ padding: isMobile ? 8 : 0 }}>
      {/* Header with Back Button and Actions */}
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: isMobile ? 8 : 16 }}
        wrap={isMobile ? 'wrap' : 'nowrap'}
        gap={isMobile ? 8 : 0}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          size={getButtonSize(responsive)}
        >
          {isMobile ? '' : t('actions.back')}
        </Button>

        <Space size={isMobile ? 'small' : 'middle'}>
          {extraActions}
          {onCancel !== undefined && (
            <Button onClick={handleCancel} size={getButtonSize(responsive)}>
              {cancelButtonText || t('actions.cancel')}
            </Button>
          )}
          {onSave && (
            <Button
              type="primary"
              icon={isMobile ? <SaveOutlined /> : <SaveOutlined />}
              onClick={onSave}
              loading={saveButtonLoading}
              disabled={saveButtonDisabled}
              size={getButtonSize(responsive)}
            >
              {isMobile ? '' : (saveButtonText || t('actions.save'))}
            </Button>
          )}
        </Space>
      </Flex>

      <Card
        title={isMobile ? <div style={{ fontSize: 16 }}>{title}</div> : title}
        bordered={bordered}
        size={getCardSize(responsive)}
        styles={{
          body: { padding: isMobile ? 12 : 24 },
          header: { paddingLeft: isMobile ? 12 : 24, paddingRight: isMobile ? 12 : 24 },
        }}
      >
        {subtitle && (
          <div
            style={{
              marginBottom: isMobile ? 12 : 16,
              color: '#666',
              fontSize: isMobile ? 13 : 14,
            }}
          >
            {subtitle}
          </div>
        )}
        {children}
      </Card>
    </div>
  );
}
