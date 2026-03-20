import { logger } from '@/lib/logger/logger.service';
import notificationService from '@/services/notification/notificationService';
import { BellOutlined, MailOutlined, SaveOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Divider, Form, Space, Spin, Switch, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;

const NotificationPreferencesPage: React.FC = () => {
  const { t } = useTranslation('notifications');
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);
  const [, setTestingEmail] = useState(false);

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
      message.error(t('messages.preferencesLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    setTestingEmail(true);
    try {
      const result = await notificationService.testEmail();
      setEmailConnected(result.connected);
    } catch {
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
      message.success(t('messages.preferencesSaveSuccess'));
    } catch (error) {
      logger.error('NotificationPreferencesPage', 'Failed to save preferences', error as Error);
      message.error(t('messages.preferencesSaveError'));
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
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3}>
              <BellOutlined /> {t('preferences.title')}
            </Title>
            <Paragraph type="secondary">{t('preferences.description')}</Paragraph>
          </div>

          {!emailConnected && (
            <Alert
              title={t('preferences.emailServiceNotConfigured')}
              description={t('preferences.emailServiceNotConfiguredDescription')}
              type="warning"
              showIcon
              icon={<MailOutlined />}
            />
          )}

          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Divider>{t('preferences.channels')}</Divider>

            <Form.Item
              name="inAppEnabled"
              label={t('preferences.inApp')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="emailEnabled"
              label={t('preferences.email')}
              valuePropName="checked"
              extra={
                emailConnected
                  ? t('preferences.emailDescription')
                  : t('preferences.emailNotConfigured')
              }
            >
              <Switch disabled={!emailConnected} />
            </Form.Item>

            <Divider>{t('preferences.types')}</Divider>

            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {t('preferences.typesDescription')}
            </Text>

            <Form.Item
              name={['types', 'lowStock']}
              label={t('preferences.lowStock')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              {t('preferences.lowStockDescription')}
            </Paragraph>

            <Form.Item
              name={['types', 'newOrder']}
              label={t('preferences.newOrder')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              {t('preferences.newOrderDescription')}
            </Paragraph>

            <Form.Item
              name={['types', 'orderStatusChange']}
              label={t('preferences.orderStatusChange')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              {t('preferences.orderStatusChangeDescription')}
            </Paragraph>

            <Form.Item
              name={['types', 'overdueDebt']}
              label={t('preferences.overdueDebt')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              {t('preferences.overdueDebtDescription')}
            </Paragraph>

            <Form.Item
              name={['types', 'deliveryDate']}
              label={t('preferences.deliveryDate')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
              {t('preferences.deliveryDateDescription')}
            </Paragraph>

            <Divider />

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                  {t('preferences.savePreferences')}
                </Button>
                <Button onClick={() => form.resetFields()}>
                  {t('preferences.reset')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default NotificationPreferencesPage;
