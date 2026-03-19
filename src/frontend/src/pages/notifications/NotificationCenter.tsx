import { logger } from '@/lib/logger/logger.service';
import notificationService, {
  Notification,
  NotificationPriority,
  NotificationType,
} from '@/services/notification/notificationService';
import {
  BellOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Dropdown, Empty, List, message, Space, Spin, Tag, theme } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { useToken } = theme;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

const typeIcons: Record<NotificationType, ReactNode> = {
  [NotificationType.INFO]: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
  [NotificationType.SUCCESS]: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  [NotificationType.WARNING]: <WarningOutlined style={{ color: '#faad14' }} />,
  [NotificationType.ERROR]: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
};

const priorityColors: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: 'default',
  [NotificationPriority.MEDIUM]: 'processing',
  [NotificationPriority.HIGH]: 'warning',
  [NotificationPriority.URGENT]: 'error',
};

export default function NotificationCenter() {
  const { token } = useToken();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Priority labels using i18n
  const getPriorityLabel = (priority: NotificationPriority): string => {
    const labels: Record<NotificationPriority, string> = {
      [NotificationPriority.LOW]: t('notifications.priority.low'),
      [NotificationPriority.MEDIUM]: t('notifications.priority.medium'),
      [NotificationPriority.HIGH]: t('notifications.priority.high'),
      [NotificationPriority.URGENT]: t('notifications.priority.urgent'),
    };
    return labels[priority];
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getAll({
        page: 1,
        limit: 50,
        isRead: filter === 'unread' ? false : undefined,
      });
      setNotifications(response.data || []);
    } catch (error: unknown) {
      message.error(
        t('notifications.messages.cannotLoad') +
          ': ' +
          getErrorMessage(error, t('notifications.messages.unknownError')),
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error: unknown) {
      logger.error('NotificationCenter', 'Error fetching unread count', error as Error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      message.success(t('notifications.messages.markedAsRead'));
      fetchNotifications();
      fetchUnreadCount();
    } catch (error: unknown) {
      message.error(
        t('notifications.messages.markReadError') +
          ': ' +
          getErrorMessage(error, t('notifications.messages.unknownError')),
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      message.success(t('notifications.messages.allMarkedAsRead'));
      fetchNotifications();
      fetchUnreadCount();
    } catch (error: unknown) {
      message.error(
        t('notifications.messages.markAllReadError') +
          ': ' +
          getErrorMessage(error, t('notifications.messages.unknownError')),
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.delete(id);
      message.success(t('notifications.messages.deleteSuccess'));
      fetchNotifications();
      fetchUnreadCount();
    } catch (error: unknown) {
      message.error(
        t('notifications.messages.deleteError') +
          ': ' +
          getErrorMessage(error, t('notifications.messages.unknownError')),
      );
    }
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>{t('notifications.center.title')}</span>
            {unreadCount > 0 && <Badge count={unreadCount} />}
          </Space>
        }
        extra={
          <Space>
            <Button.Group>
              <Button
                type={filter === 'all' ? 'primary' : 'default'}
                onClick={() => setFilter('all')}
              >
                {t('notifications.center.all')}
              </Button>
              <Button
                type={filter === 'unread' ? 'primary' : 'default'}
                onClick={() => setFilter('unread')}
              >
                {t('notifications.center.unread')} ({unreadCount})
              </Button>
            </Button.Group>
            {unreadCount > 0 && (
              <Button icon={<CheckOutlined />} onClick={handleMarkAllAsRead}>
                {t('notifications.center.markAllRead')}
              </Button>
            )}
          </Space>
        }
      >
        <Spin spinning={loading}>
          {notifications.length === 0 ? (
            <Empty description={t('notifications.center.noNotifications')} />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item
                  style={{
                    backgroundColor: item.isRead ? 'transparent' : token.colorPrimaryBg,
                    padding: '12px 16px',
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                  actions={[
                    <Dropdown
                      menu={{
                        items: [
                          ...(!item.isRead
                            ? [
                                {
                                  key: 'read',
                                  label: t('notifications.center.markAsRead'),
                                  icon: <CheckOutlined />,
                                  onClick: () => handleMarkAsRead(item.id),
                                },
                              ]
                            : []),
                          {
                            key: 'delete',
                            label: t('notifications.center.delete'),
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => handleDelete(item.id),
                          },
                        ],
                      }}
                      trigger={['click']}
                    >
                      <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={typeIcons[item.type as NotificationType]}
                    title={
                      <Space>
                        <span style={{ fontWeight: item.isRead ? 'normal' : 'bold' }}>
                          {item.title}
                        </span>
                        <Tag color={priorityColors[item.priority as NotificationPriority]}>
                          {getPriorityLabel(item.priority as NotificationPriority)}
                        </Tag>
                        {!item.isRead && (
                          <Badge status="processing" text={t('notifications.center.new')} />
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>{item.message}</div>
                        <Space size="small">
                          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                            {dayjs(item.createdAt).fromNow()}
                          </span>
                          {item.link && (
                            <a href={item.link} style={{ fontSize: 12 }}>
                              {t('notifications.center.viewDetail')} →
                            </a>
                          )}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}
