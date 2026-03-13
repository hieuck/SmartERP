import { useState, useEffect } from 'react';
import { Card, List, Badge, Tag, Button, Space, Empty, Spin, Dropdown, Menu, message } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import notificationService, {
  NotificationType,
  NotificationPriority,
} from '../../services/notification/notificationService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const typeIcons: Record<NotificationType, any> = {
  [NotificationType.INFO]: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
  [NotificationType.SUCCESS]: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  [NotificationType.WARNING]: <WarningOutlined style={{ color: '#faad14' }} />,
  [NotificationType.ERROR]: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
};

const typeColors: Record<NotificationType, string> = {
  [NotificationType.INFO]: 'blue',
  [NotificationType.SUCCESS]: 'green',
  [NotificationType.WARNING]: 'orange',
  [NotificationType.ERROR]: 'red',
};

const priorityColors: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: 'default',
  [NotificationPriority.MEDIUM]: 'processing',
  [NotificationPriority.HIGH]: 'warning',
  [NotificationPriority.URGENT]: 'error',
};

const priorityLabels: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: 'Thấp',
  [NotificationPriority.MEDIUM]: 'Trung bình',
  [NotificationPriority.HIGH]: 'Cao',
  [NotificationPriority.URGENT]: 'Khẩn cấp',
};

export default function NotificationCenter() {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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
    } catch (error: any) {
      message.error('Không thể tải thông báo: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      message.success('Đã đánh dấu đã đọc');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error: any) {
      message.error('Không thể đánh dấu đã đọc: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      message.success('Đã đánh dấu tất cả đã đọc');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error: any) {
      message.error('Không thể đánh dấu tất cả đã đọc: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.delete(id);
      message.success('Đã xóa thông báo');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error: any) {
      message.error('Không thể xóa thông báo: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const getMenu = (item: any) => (
    <Menu>
      {!item.isRead && (
        <Menu.Item key="read" icon={<CheckOutlined />} onClick={() => handleMarkAsRead(item.id)}>
          Đánh dấu đã đọc
        </Menu.Item>
      )}
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDelete(item.id)}
      >
        Xóa
      </Menu.Item>
    </Menu>
  );

  return (
    <div>
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>Trung tâm thông báo</span>
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
                Tất cả
              </Button>
              <Button
                type={filter === 'unread' ? 'primary' : 'default'}
                onClick={() => setFilter('unread')}
              >
                Chưa đọc ({unreadCount})
              </Button>
            </Button.Group>
            {unreadCount > 0 && (
              <Button icon={<CheckOutlined />} onClick={handleMarkAllAsRead}>
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </Space>
        }
      >
        <Spin spinning={loading}>
          {notifications.length === 0 ? (
            <Empty description="Không có thông báo" />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={(item: any) => (
                <List.Item
                  style={{
                    backgroundColor: item.isRead ? 'transparent' : '#f0f5ff',
                    padding: '12px 16px',
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                  actions={[
                    <Dropdown overlay={getMenu(item)} trigger={['click']}>
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
                          {priorityLabels[item.priority as NotificationPriority]}
                        </Tag>
                        {!item.isRead && <Badge status="processing" text="Mới" />}
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
                              Xem chi tiết →
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
