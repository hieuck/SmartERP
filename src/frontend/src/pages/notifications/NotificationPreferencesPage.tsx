import React, { useState, useEffect } from 'react';
import { Card, Form, Switch, Button, Space, Typography, Divider, message, Spin, Alert } from 'antd';
import { SaveOutlined, BellOutlined, MailOutlined } from '@ant-design/icons';
import notificationService, {
  NotificationPreferences,
} from '../../services/notification/notificationService';

const { Title, Text, Paragraph } = Typography;

const NotificationPreferencesPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    loadPreferences();
    testEmailConnection();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const preferences = await notificationService.getPreferences();
      form.setFieldsValue(preferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      message.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    setTestingEmail(true);
    try {
      const result = await notificationService.testEmail();
      setEmailConnected(result.connected);
    } catch (error) {
      setEmailConnected(false);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      await notificationService.updatePreferences(values);
      message.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      message.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3}>
              <BellOutlined /> Notification Preferences
            </Title>
            <Paragraph type="secondary">Configure how you want to receive notifications</Paragraph>
          </div>

          {!emailConnected && (
            <Alert
              message="Email Service Not Configured"
              description="Email notifications are currently unavailable. Please contact your administrator to configure the email service."
              type="warning"
              showIcon
              icon={<MailOutlined />}
            />
          )}

          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Divider orientation="left">Notification Channels</Divider>

            <Form.Item name="inAppEnabled" label="In-App Notifications" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item
              name="emailEnabled"
              label="Email Notifications"
              valuePropName="checked"
              extra={
                emailConnected
                  ? 'Receive notifications via email'
                  : 'Email service is not configured'
              }
            >
              <Switch disabled={!emailConnected} />
            </Form.Item>

            <Divider orientation="left">Notification Types</Divider>

            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Choose which types of notifications you want to receive
            </Text>

            <Form.Item
              name={['types', 'lowStock']}
              label="Low Stock Alerts"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              Get notified when product stock falls below minimum level
            </Paragraph>

            <Form.Item name={['types', 'newOrder']} label="New Orders" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              Get notified when a new order is created
            </Paragraph>

            <Form.Item
              name={['types', 'orderStatusChange']}
              label="Order Status Changes"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              Get notified when order status is updated
            </Paragraph>

            <Form.Item
              name={['types', 'overdueDebt']}
              label="Overdue Debt Alerts"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              Get notified about overdue payments
            </Paragraph>

            <Form.Item
              name={['types', 'deliveryDate']}
              label="Delivery Date Reminders"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              Get notified when purchase orders reach expected delivery date
            </Paragraph>

            <Divider />

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                  Save Preferences
                </Button>
                <Button onClick={() => form.resetFields()}>Reset</Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default NotificationPreferencesPage;
