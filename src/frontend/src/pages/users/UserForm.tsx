import { logger } from '@/lib/logger/logger.service';
import type { User } from '@/lib/offline/db';
import { syncManager } from '@/lib/offline/sync-manager';
import authService from '@/services/auth/authService';
import { offlineServices } from '@/services/offline-services';
import { ArrowLeftOutlined, SaveOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Form, Input, message, Select, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

type UserFormValues = {
  email: string;
  password?: string;
  confirmPassword?: string;
  firstName?: User['firstName'];
  lastName?: User['lastName'];
  role: User['role'];
  status: User['status'];
};

const UserForm: React.FC = () => {
  const { t } = useTranslation('users');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm<UserFormValues>();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadUser = async () => {
    if (!isEdit || !id) return;
    try {
      const user = await offlineServices.users.getById(id);
      if (user) {
        form.setFieldsValue({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
        });
        logger.info('UserForm', 'Loaded user from IndexedDB', { id });
      }
    } catch (error) {
      logger.error('UserForm', 'Failed to load user', error as Error);
      message.error(t('messages.loadError'));
    }
  };

  const loadQueueSize = async () => {
    const size = await syncManager.getQueueSize();
    setQueueSize(size);
  };

  useEffect(() => {
    loadUser();
    loadQueueSize();
  }, [id]);

  useEffect(() => {
    if (isOnline) handleSync();
  }, [isOnline]);

  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setSyncing(true);
      const result = await syncManager.sync(token);
      if (result.success) {
        await loadQueueSize();
        if (isEdit) await loadUser();
      }
    } catch (error) {
      logger.error('UserForm', 'Sync failed', error as Error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (values: UserFormValues) => {
    try {
      setLoading(true);
      if (isEdit && id) {
        await offlineServices.users.update(id, values);
        message.success(t('form.messages.updateSuccess'));
        logger.info('UserForm', 'User updated', { id });
      } else {
        if (!values.password) throw new Error('Password is required');
        await authService.register({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          tenantId: 1,
        });
        message.success(t('form.messages.createSuccess'));
        logger.info('UserForm', 'User created via register');
      }
      await loadQueueSize();
      navigate('/dashboard/users');
    } catch (error) {
      logger.error('UserForm', 'Failed to save user', error as Error);
      message.error(t('form.messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space orientation="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <UserOutlined /> {isEdit ? t('form.titleEdit') : t('form.titleCreate')}
            </Title>
            <Space>
              <Badge count={queueSize} offset={[-5, 5]}>
                <Button
                  icon={<SyncOutlined spin={syncing} />}
                  onClick={handleSync}
                  loading={syncing}
                  disabled={!isOnline}
                >
                  {t('sync.syncNow')}
                </Button>
              </Badge>
              <Badge
                status={isOnline ? 'success' : 'error'}
                text={isOnline ? t('sync.online') : t('sync.offline')}
              />
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/users')}>
                {t('form.back')}
              </Button>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ role: 'USER', status: 'active' }}
          >
            <Form.Item
              label={t('columns.email')}
              name="email"
              rules={[
                { required: true, message: t('form.validation.emailRequired') },
                { type: 'email', message: t('form.validation.emailInvalid') },
              ]}
            >
              <Input placeholder="user@example.com" disabled={isEdit} />
            </Form.Item>

            {!isEdit && (
              <Form.Item
                label={t('form.fields.password')}
                name="password"
                rules={[
                  { required: true, message: t('form.validation.passwordRequired') },
                  { min: 6, message: t('form.validation.passwordMin') },
                ]}
              >
                <Input.Password placeholder={t('form.placeholders.password')} />
              </Form.Item>
            )}

            {!isEdit && (
              <Form.Item
                label={t('form.fields.confirmPassword')}
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: t('form.validation.confirmPasswordRequired') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('form.validation.passwordMismatch')));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder={t('form.placeholders.confirmPassword')} />
              </Form.Item>
            )}

            <Form.Item
              label={t('form.fields.firstName')}
              name="firstName"
              rules={[{ required: true, message: t('form.validation.firstNameRequired') }]}
            >
              <Input placeholder={t('form.placeholders.firstName')} />
            </Form.Item>

            <Form.Item
              label={t('form.fields.lastName')}
              name="lastName"
              rules={[{ required: true, message: t('form.validation.lastNameRequired') }]}
            >
              <Input placeholder={t('form.placeholders.lastName')} />
            </Form.Item>

            <Form.Item
              label={t('columns.role')}
              name="role"
              rules={[{ required: true, message: t('form.validation.roleRequired') }]}
            >
              <Select placeholder={t('form.placeholders.role')}>
                <Option value="ADMIN">{t('roles.admin')}</Option>
                <Option value="MANAGER">{t('roles.manager')}</Option>
                <Option value="USER">{t('roles.user')}</Option>
                <Option value="VIEWER">{t('roles.viewer')}</Option>
              </Select>
            </Form.Item>

            {isEdit && (
              <Form.Item label={t('columns.status')} name="status">
                <Select placeholder={t('form.placeholders.status')}>
                  <Option value="active">{t('status.active')}</Option>
                  <Option value="inactive">{t('status.inactive')}</Option>
                </Select>
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {isEdit ? t('form.buttons.update') : t('form.buttons.create')}
                </Button>
                <Button onClick={() => navigate('/dashboard/users')}>
                  {t('form.buttons.cancel')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default UserForm;
