import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Typography,
  Tag,
  Empty,
  Spin,
  Tabs,
  Popconfirm,
  message,
} from 'antd';
import { CheckOutlined, DeleteOutlined, SettingOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import notificationService, { Notification } from '@/services/notification/notificationService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { logger } from '@/lib/logger/logger.service';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const NotificationListPage: React.FC = () => {
  const { t } = useTranslation(['notifications', 'common']);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, [activeTab, page]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({
        page,
        limit: 20,
        isRead: activeTab === 'unread' ? false : undefined,
      });
      setNotifications(result.data);
      setTotal(result.total);
    } catch (error) {
      logger.error('NotificationListPage', 'Failed to load notifications', error as Error);
      message.error(t('notifications:messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      message.success(t('notifications:messages.markedAsRead'));
    } catch (error) {
      message.error(t('notifications:messages.markReadError'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      message.success(t('notifications:messages.allMarkedAsRead'));
    } catch (error) {
      message.error(t('notifications:messages.markAllReadError'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => prev - 1);
      message.success(t('notifications:messages.deleteSuccess'));
    } catch (error) {
      message.error(t('notifications:messages.deleteError'));
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    if (notification.data?.link) {
      navigate(notification.data.link);
    }
  };

  const getNotificationTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      lowStock: 'orange',
      newOrder: 'blue',
      orderStatusChange: 'green',
      overdueDebt: 'red',
      deliveryDate: 'purple',
    };
    return colorMap[type] || 'default';
  };

  const getNotificationTypeLabel = (type: string): string => {
    const labelMap: Record<string, string> = {
      lowStock: t('notifications:types.lowStock'),
      newOrder: t('notifications:types.newOrder'),
      orderStatusChange: t('notifications:types.orderUpdate'),
      overdueDebt: t('notifications:types.overdueDebt'),
      deliveryDate: t('notifications:types.deliveryDate'),
    };
    return labelMap[type] || type;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <BellOutlined /> {t('notifications:notification.list')}
            </Title>
            <Space>
              <Button
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                disabled={notifications.every((n) => n.isRead)}
              >
                {t('notifications:center.markAllRead')}
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => navigate('/settings/notifications')}
              >
                {t('notifications:center.settings')}
              </Button>
            </Space>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as 'all' | 'unread');
              setPage(1);
            }}
          >
            <TabPane tab={t('notifications:center.all')} key="all" />
            <TabPane tab={t('notifications:center.unread')} key="unread" />
          </Tabs>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : notifications.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              pagination={{
                current: page,
                pageSize: 20,
                total,
                onChange: setPage,
                showSizeChanger: false,
                showTotal: (total) => t('notifications:pagination.total', { total }),
              }}
              renderItem={(notification) => (
                <List.Item
                  key={notification.id}
                  style={{
                    backgroundColor: notification.isRead ? 'white' : '#f0f7ff',
                    padding: '16px',
                    marginBottom: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  actions={[
                    !notification.isRead && (
                      <Button
                        type="link"
                        icon={<CheckOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        {t('notifications:notification.markRead')}
                      </Button>
                    ),
                    <Popconfirm
                      title={t('notifications:messages.deleteConfirmTitle')}
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      okText={t('notifications:messages.yes')}
                      cancelText={t('notifications:messages.no')}
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('notifications:center.delete')}
                      </Button>
                    </Popconfirm>,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong={!notification.isRead}>{notification.title}</Text>
                        <Tag color={getNotificationTypeColor(notification.type)}>
                          {getNotificationTypeLabel(notification.type)}
                        </Tag>
                        {!notification.isRead && <Tag color="blue">{t('notifications:center.new')}</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <Text>{notification.message}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(notification.createdAt).format('YYYY-MM-DD HH:mm')} (
                          {dayjs(notification.createdAt).fromNow()})
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description={t('notifications:center.noNotifications')} />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default NotificationListPage;
