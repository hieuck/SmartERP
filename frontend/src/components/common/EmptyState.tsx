import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';

interface EmptyStateProps {
  description?: string;
  image?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  showAction?: boolean;
}

/**
 * EmptyState Component
 *
 * Standardized empty state component following Ant Design guidelines
 * Used when lists or tables have no data
 *
 * @example
 * <EmptyState
 *   description="Chưa có sản phẩm nào"
 *   actionText="Tạo Sản Phẩm Mới"
 *   onAction={() => navigate('/products/new')}
 *   showAction
 * />
 */
export default function EmptyState({
  description = 'Không có dữ liệu',
  image,
  actionText = 'Tạo Mới',
  onAction,
  showAction = false,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 0',
        background: '#fff',
        borderRadius: 8,
      }}
    >
      <Empty
        image={image || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14 }}>{description}</span>
        }
      >
        {showAction && onAction && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAction}
            style={{ marginTop: 16 }}
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
}
