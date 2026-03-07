import { ReactNode } from 'react';
import { Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subTitle?: string;
  extra?: ReactNode;
  children?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}

/**
 * PageHeader Component
 *
 * Standardized page header component following Ant Design guidelines
 * Provides consistent header layout across all pages
 *
 * Features:
 * - Title and subtitle
 * - Back button (optional)
 * - Extra actions (buttons, etc.)
 * - Content area for additional information
 *
 * @example
 * <PageHeader
 *   title="Sản Phẩm"
 *   subTitle="Quản lý danh mục sản phẩm"
 *   extra={<Button type="primary">Tạo Mới</Button>}
 *   showBack
 * />
 */
export default function PageHeader({
  title,
  subTitle,
  extra,
  children,
  onBack,
  showBack = false,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      style={{
        background: '#fff',
        padding: '16px 24px',
        marginBottom: 24,
        borderRadius: 8,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space size={16}>
            {showBack && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ padding: '4px 8px' }}
              />
            )}
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  margin: 0,
                  lineHeight: 1.33,
                  color: 'rgba(0, 0, 0, 0.88)',
                }}
              >
                {title}
              </h1>
              {subTitle && (
                <div
                  style={{
                    fontSize: 14,
                    color: 'rgba(0, 0, 0, 0.45)',
                    marginTop: 4,
                  }}
                >
                  {subTitle}
                </div>
              )}
            </div>
          </Space>
          {extra && <Space>{extra}</Space>}
        </div>
        {children && <div>{children}</div>}
      </Space>
    </div>
  );
}
