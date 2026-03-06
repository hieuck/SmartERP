import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, Button, List, Typography, Space, Empty, Spin } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import notificationService, { Notification } from '../../services/notificationService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({
        page: 1,
        limit: 10,
      });
      setNotifications(result.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      loadUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id, {} as React.MouseEvent);
    }

    // Navigate based on notification type
    if (notification.data?.link) {
      navigate(notification.data.link);
      setVisible(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    // Return appropriate icon based on notification type
    return '📢';
  };

  const dropdownContent = (
    <div style={{ width: 400, maxHeight: 500, overflow: 'auto', backgroundColor: 'white' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text strong>Notifications</Text>
        <Space>
          {unreadCount > 0 && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={handleMarkAllAsRead}>
              Mark all read
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => {
              navigate('/settings/notifications');
              setVisible(false);
            }}
          >
            Settings
          </Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
        </div>
      ) : notifications.length > 0 ? (
        <List
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item
              key={notification.id}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: notification.isRead ? 'white' : '#f0f7ff',
              }}
              onClick={() => handleNotificationClick(notification)}
              actions={[
                !notification.isRead && (
                  <Button
                    type="link"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                  />
                ),
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => handleDelete(notification.id, e)}
                />,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <span style={{ fontSize: 24 }}>{getNotificationIcon(notification.type)}</span>
                }
                title={
                  <Space>
                    <Text strong={!notification.isRead}>{notification.title}</Text>
                    {!notification.isRead && <Badge status="processing" />}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{notification.message}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(notification.createdAt).fromNow()}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="No notifications" style={{ padding: '40px' }} />
      )}

      {notifications.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
          }}
        >
          <Button
            type="link"
            onClick={() => {
              navigate('/notifications');
              setVisible(false);
            }}
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={['click']}
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 20 }} />}
          style={{ border: 'none' }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
