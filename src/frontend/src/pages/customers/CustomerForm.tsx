import { logger } from '@/lib/logger/logger.service';
import { syncManager } from '@/lib/offline/sync-manager';
import { offlineServices } from '@/services/offline-services';
import { ArrowLeftOutlined, SaveOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Space,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const { Title } = Typography;
const { TextArea } = Input;

export default function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, i18n } = useTranslation(['customers', 'commonUi']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const isEdit = !!id;

  // Monitor network status
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

  // Load customer data for edit
  const loadCustomer = async () => {
    if (!isEdit || !id) return;

    try {
      const customer = await offlineServices.customers.getById(id);
      if (customer) {
        form.setFieldsValue({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          creditLimit: customer.creditLimit,
        });
        logger.info('CustomerForm', 'Loaded customer from IndexedDB', { id });
      }
    } catch (error) {
      logger.error('CustomerForm', 'Failed to load customer', error as Error);
      message.error(t('customers:form.messages.loadError'));
    }
  };

  // Load queue size
  const loadQueueSize = async () => {
    const size = await syncManager.getQueueSize();
    setQueueSize(size);
  };

  // Initial load
  useEffect(() => {
    loadCustomer();
    loadQueueSize();
  }, [id]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline) {
      handleSync();
    }
  }, [isOnline]);

  // Manual sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setSyncing(true);
      const result = await syncManager.sync(token);

      if (result.success) {
        await loadQueueSize();
        if (isEdit) await loadCustomer();
      }
    } catch (error) {
      logger.error('CustomerForm', 'Sync failed', error as Error);
    } finally {
      setSyncing(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      if (isEdit && id) {
        await offlineServices.customers.update(id, values);
        message.success(t('customers:form.messages.updateSuccess'));
        logger.info('CustomerForm', 'Customer updated', { id });
      } else {
        await offlineServices.customers.create(values);
        message.success(t('customers:form.messages.createSuccess'));
        logger.info('CustomerForm', 'Customer created');
      }

      await loadQueueSize();
      navigate('/dashboard/customers');
    } catch (error) {
      logger.error('CustomerForm', 'Failed to save customer', error as Error);
      message.error(t('customers:form.messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/customers')}>
            {t('customers:form.buttons.back')}
          </Button>
          <Space>
            <Badge count={queueSize} offset={[-5, 5]}>
              <Button
                icon={<SyncOutlined spin={syncing} />}
                onClick={handleSync}
                loading={syncing}
                disabled={!isOnline}
              >
                {syncing ? t('customers:sync.syncing') : t('customers:sync.syncNow')}
              </Button>
            </Badge>
            <Badge
              status={isOnline ? 'success' : 'error'}
              text={isOnline ? t('customers:sync.online') : t('customers:sync.offline')}
            />
          </Space>
        </Space>

        <Title level={3}>
          <UserOutlined />{' '}
          {isEdit ? t('customers:form.title.edit') : t('customers:form.title.create')}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            creditLimit: 0,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label={t('customers:form.fields.name')}
                rules={[{ required: true, message: t('customers:form.validation.nameRequired') }]}
              >
                <Input placeholder={t('customers:form.placeholders.name')} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label={t('customers:form.fields.email')}
                rules={[
                  { required: true, message: t('customers:form.validation.emailRequired') },
                  { type: 'email', message: t('customers:form.validation.emailInvalid') },
                ]}
              >
                <Input placeholder={t('customers:form.placeholders.email')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label={t('customers:form.fields.phone')}
                rules={[
                  { required: true, message: t('customers:form.validation.phoneRequired') },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: t('customers:form.validation.phoneInvalid'),
                  },
                ]}
              >
                <Input placeholder={t('customers:form.placeholders.phone')} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="creditLimit"
                label={t('customers:form.fields.creditLimit')}
                rules={[
                  { required: true, message: t('customers:form.validation.creditLimitRequired') },
                ]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as unknown as 0}
                  addonAfter={i18n.language === 'vi' ? '₫' : '$'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label={t('customers:form.fields.address')}
            rules={[{ required: true, message: t('customers:form.validation.addressRequired') }]}
          >
            <TextArea rows={3} placeholder={t('customers:form.placeholders.address')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                {isEdit ? t('customers:form.buttons.update') : t('customers:form.buttons.create')}
              </Button>
              <Button onClick={() => navigate('/dashboard/customers')}>
                {t('customers:form.buttons.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
