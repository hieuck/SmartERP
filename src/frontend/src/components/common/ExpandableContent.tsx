/**
 * Expandable Content Component
 * Component hiển thị thông tin chi tiết trong expandable row
 * Sử dụng Ant Design Descriptions
 */

import { Descriptions } from 'antd';
import type { DescriptionsProps } from 'antd';
import { useResponsive } from '@/hooks/useResponsive';

interface ExpandableField {
  label: string;
  value: React.ReactNode;
  span?: number;
}

interface ExpandableContentProps {
  fields: ExpandableField[];
  column?: number;
  size?: 'small' | 'middle' | 'default';
  bordered?: boolean;
}

export default function ExpandableContent({
  fields,
  column = 3,
  size = 'small',
  bordered = false,
}: ExpandableContentProps) {
  const { isMobile } = useResponsive();

  const items: DescriptionsProps['items'] = fields.map((field, index) => ({
    key: index,
    label: field.label,
    children: field.value || '-',
    span: field.span,
  }));

  return (
    <Descriptions
      items={items}
      column={isMobile ? 1 : column}
      size={size}
      bordered={false}
      layout={isMobile ? 'vertical' : 'horizontal'}
      style={{ padding: '8px 0' }}
      labelStyle={isMobile ? { fontSize: 12, color: '#666', paddingBottom: 4 } : undefined}
      contentStyle={isMobile ? { fontSize: 14, paddingBottom: 12 } : undefined}
    />
  );
}

/**
 * Helper function để tạo expandable render
 */
export function createExpandableRender<T>(
  getFields: (record: T) => ExpandableField[],
  options?: {
    column?: number;
    size?: 'small' | 'middle' | 'default';
    bordered?: boolean;
  },
) {
  return (record: T) => (
    <ExpandableContent
      fields={getFields(record)}
      column={options?.column}
      size={options?.size}
      bordered={options?.bordered}
    />
  );
}
