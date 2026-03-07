/**
 * Mobile List Card Component
 * Component hiển thị dạng card cho mobile thay vì table
 */

import { ReactNode } from 'react';
import { Card, Space, Tag, Button, Dropdown } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

export interface MobileListCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  tags?: Array<{ label: string; color?: string }>;
  fields?: Array<{ label: string; value: ReactNode }>;
  actions?: MenuProps['items'];
  onClick?: () => void;
}

export default function MobileListCard({
  title,
  subtitle,
  tags,
  fields,
  actions,
  onClick,
}: MobileListCardProps) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 8 }}
      onClick={onClick}
      styles={{ body: { padding: 12 } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{subtitle}</div>
          )}
          {tags && tags.length > 0 && (
            <Space size={4} wrap style={{ marginBottom: 8 }}>
              {tags.map((tag, idx) => (
                <Tag key={idx} color={tag.color} style={{ margin: 0 }}>
                  {tag.label}
                </Tag>
              ))}
            </Space>
          )}
          {fields && fields.length > 0 && (
            <div style={{ fontSize: 12 }}>
              {fields.map((field, idx) => (
                <div key={idx} style={{ marginBottom: 4, display: 'flex' }}>
                  <span style={{ color: '#666', minWidth: 80 }}>{field.label}:</span>
                  <span style={{ marginLeft: 8, flex: 1 }}>{field.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {actions && actions.length > 0 && (
          <Dropdown menu={{ items: actions }} trigger={['click']}>
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        )}
      </div>
    </Card>
  );
}
