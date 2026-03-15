import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Space,
  message,
  Typography,
  Row,
  Col,
  Badge,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, ShopOutlined, SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';

const { Title } = Typography;
const { TextArea } = Input;

export default function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation(['suppliers', 'common']);
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

  // Load supplier data for edit
  const loadSupplier = async () => {
    if (!isEdit || !id) return;

    try {
      const supplier = await offlineServices.suppliers.getById(id);
      if (supplier) {
        form.setFieldsValue({
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          paymentTerms: supplier.paymentTerms,
        });
        logger.info('SupplierForm', 'Loaded supplier from IndexedDB', { id });
      }
    } catch (error) {
      logger.error('SupplierForm', 'Failed to load supplier', error as Error);
      message.error(t('suppliers:messages.loadError'));
    }
  };

  // Load queue size
  const loadQueueSize = async () => {
    const size = await syncManager.getQueueSize();
    setQueueSize(size);
  };

  // Initial load
  useEffect(() => {
    loadSupplier();
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
        if (isEdit) await loadSupplier();
      }
    } catch (error) {
      logger.error('SupplierForm', 'Sync failed', error as Error);
    } finally {
      setSyncing(false);
    }
  };

  const onFinish = async (values: {
    name: string;
    email: string;
    phone: string;
    address: string;
    paymentTerms?: number;
  }) => {
    try {
      setLoading(true);

      if (isEdit && id) {
        await offlineServices.suppliers.update(id, {
          ...values,
          status: 'active',
        });
        message.success(t('suppliers:messages.updateSuccess'));
        logger.info('SupplierForm', 'Supplier updated', { id });
      } else {
        await offlineServices.suppliers.create({
          ...values,
          status: 'active',
        });
        message.success(t('suppliers:messages.createSuccess'));
        logger.info('SupplierForm', 'Supplier created');
      }

      await loadQueueSize();
      navigate('/dashboard/suppliers');
    } catch (error) {
      logger.error('SupplierForm', 'Failed to save supplier', error as Error);
      message.error(t('suppliers:messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/suppliers')}>
            {t('suppliers:buttons.back')}
          </Button>
          <Space>
            <Badge count={queueSize} offset={[-5, 5]}>
              <Button
                icon={<SyncOutlined spin={syncing} />}
                onClick={handleSync}
                loading={syncing}
                disabled={!isOnline}
              >
                {syncing ? t('suppliers:buttons.syncing') : t('suppliers:buttons.sync')}
              </Button>
            </Badge>
            <Badge 
              status={isOnline ? 'success' : 'error'} 
              text={isOnline ? t('suppliers:labels.online') : t('suppliers:labels.offline')} 
            />
          </Space>
        </Space>

        <Title level={3}>
          <ShopOutlined /> {isEdit ? t('suppliers:form.edit') : t('suppliers:form.create')}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label={t('suppliers:form.name')}
                rules={[{ required: true, message: t('suppliers:validation.nameRequired') }]}
              >
                <Input placeholder={t('suppliers:validation.namePlaceholder')} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label={t('suppliers:form.email')}
                rules={[
                  { required: true, message: t('suppliers:validation.emailRequired') },
                  { type: 'email', message: t('suppliers:validation.emailInvalid') },
                ]}
              >
                <Input placeholder={t('suppliers:validation.emailPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label={t('suppliers:form.phone')}
                rules={[
                  { required: true, message: t('suppliers:validation.phoneRequired') },
                  { pattern: /^[0-9]{10,11}$/, message: t('suppliers:validation.phoneInvalid') },
                ]}
              >
                <Input placeholder={t('suppliers:validation.phonePlaceholder')} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="paymentTerms"
                label={t('suppliers:form.paymentTerms')}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  placeholder={t('suppliers:form.paymentTermsPlaceholder')}
                  suffix={t('suppliers:form.paymentTermsDays')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label={t('suppliers:form.address')}
            rules={[{ required: true, message: t('suppliers:validation.addressRequired') }]}
          >
            <TextArea rows={3} placeholder={t('suppliers:validation.addressPlaceholder')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                {isEdit ? t('suppliers:buttons.update') : t('suppliers:buttons.create')}
              </Button>
              <Button onClick={() => navigate('/dashboard/suppliers')}>
                {t('suppliers:buttons.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
