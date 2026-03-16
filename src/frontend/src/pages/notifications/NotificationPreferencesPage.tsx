import React, { useState, useEffect } from 'react';
import { Card, Form, Switch, Button, Space, Typography, Divider, message, Spin, Alert } from 'antd';
import { SaveOutlined, BellOutlined, MailOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18n';
import notificationService, {
  NotificationPreferences,
} from '@/services/notification/notificationService';
import { logger } from '@/lib/logger/logger.service';

const { Title, Text, Paragraph } = Typography;

const NotificationPreferencesPage: React.FC = () => {
  const { t } = useTranslation();
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
      logger.error('NotificationPreferencesPage', 'Failed to load preferences', error as Error);
      message.error(t('notifications.messages.preferencesLoadError'));
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
      message.success(t('notifications.messages.preferencesSaveSuccess'));
    } catch (error) {
      logger.error('NotificationPreferencesPage', 'Failed to save preferences', error as Error);
      message.error(t('notifications.messages.preferencesSaveError'));
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
              <BellOutlined /> {t('notifications.preferences.title')}
            </Title>
            <Paragraph type="secondary">{t('notifications.preferences.description')}</Paragraph>
          </div>

          {!emailConnected && (
            <Alert
              message={t('notifications.preferences.emailServiceNotConfigured')}
              description={t('notifications.preferences.emailServiceNotConfiguredDescription')}
              type="warning"
              showIcon
              icon={<MailOutlined />}
            />
          )}

          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Divider orientation="left">{t('notifications.preferences.channels')}</Divider>

            <Form.Item name="inAppEnabled" label={t('notifications.preferences.inApp')} valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item
              name="emailEnabled"
              label={t('notifications.preferences.email')}
              valuePropName="checked"
              extra={
                emailConnected
                  ? t('notifications.preferences.emailDescription')
                  : t('notifications.preferences.emailNotConfigured')
              }
            >
              <Switch disabled={!emailConnected} />
            </Form.Item>

            <Divider orientation="left">{t('notifications.preferences.types')}</Divider>

            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {t('notifications.preferences.typesDescription')}
            </Text>

            <Form.Item
              name={['types', 'lowStock']}
              label={t('notifications.preferences.lowStock')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              {t('notifications.preferences.lowStockDescription')}
            </Paragraph>

            <Form.Item name={['types', 'newOrder']} label={t('notifications.preferences.newOrder')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              {t('notifications.preferences.newOrderDescription')}
            </Paragraph>

            <Form.Item
              name={['types', 'orderStatusChange']}
              label={t('notifications.preferences.orderStatusChange')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              {t('notifications.preferences.orderStatusChangeDescription')}
            </Paragraph>

            <Form.Item
              name={['types', 'overdueDebt']}
              label={t('notifications.preferences.overdueDebt')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              {t('notifications.preferences.overdueDebtDescription')}
            </Paragraph>

            <Form.Item
              name={['types', 'deliveryDate']}
              label={t('notifications.preferences.deliveryDate')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              {t('notifications.preferences.deliveryDateDescription')}
            </Paragraph>

            <Divider />

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                  {t('notifications.preferences.savePreferences')}
                </Button>
                <Button onClick={() => form.resetFields()}>{t('notifications.preferences.reset')}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default NotificationPreferencesPage;
