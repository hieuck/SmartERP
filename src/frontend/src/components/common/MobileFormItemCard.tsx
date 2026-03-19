/**
 * Mobile Form Item Card Component
 * Component hiển thị form items dạng card trên mobile
 * Thay thế Table trong các form để dễ nhập liệu hơn
 */

import { Card, Button, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';

interface MobileFormItemCardProps {
  children: ReactNode;
  onRemove?: () => void;
  index: number;
}

export default function MobileFormItemCard({ children, onRemove, index }: MobileFormItemCardProps) {
  return (
    <Card
      size="small"
      style={{
        marginBottom: 12,
        borderRadius: 8,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}
      title={<span style={{ fontSize: 14, fontWeight: 500 }}>Sản phẩm #{index + 1}</span>}
      extra={
        onRemove && (
          <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} size="small" />
        )
      }
    >
      <Space orientation="vertical" style={{ width: '100%' }} size="middle">
        {children}
      </Space>
    </Card>
  );
}
