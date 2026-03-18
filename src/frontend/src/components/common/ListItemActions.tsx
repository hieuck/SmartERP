/**
 * List Item Actions Component
 * Actions column for desktop table and dropdown menu for mobile
 */

import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Popconfirm, Space } from 'antd';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

export interface ListItemActionsProps<T> {
  record: T;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  deleteConfirmTitle?: string;
  isMobile?: boolean;
}

function ListItemActionsComponent<T>({
  record,
  onEdit,
  onDelete,
  deleteConfirmTitle,
  isMobile = false,
}: ListItemActionsProps<T>) {
  const { t } = useTranslation('commonUi');

  // For mobile, render a dropdown menu
  if (isMobile) {
    const menuItems: MenuProps['items'] = [];

    if (onEdit) {
      menuItems.push({
        key: 'edit',
        label: t('actions.edit'),
        icon: <EditOutlined />,
        onClick: () => onEdit(record),
      });
    }

    if (onDelete) {
      menuItems.push({
        key: 'delete',
        label: t('actions.delete'),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          const confirmed = window.confirm(deleteConfirmTitle || t('messages.deleteConfirm'));
          if (confirmed) onDelete(record);
        },
      });
    }

    return (
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    );
  }

  // For desktop, return action buttons
  return (
    <Space>
      {onEdit && (
        <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
          {t('actions.edit')}
        </Button>
      )}
      {onDelete && (
        <Popconfirm
          title={deleteConfirmTitle || t('messages.deleteConfirm')}
          description={t('messages.deleteDescription')}
          onConfirm={() => onDelete(record)}
          okText={t('actions.delete')}
          cancelText={t('actions.cancel')}
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            {t('actions.delete')}
          </Button>
        </Popconfirm>
      )}
    </Space>
  );
}

// Memoize with generic type
const ListItemActions = memo(ListItemActionsComponent) as typeof ListItemActionsComponent;

export default ListItemActions;
