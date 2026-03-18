/**
 * Warehouse Form Page
 * Create and edit warehouses
 * Requirements: 27.1
 */

import { logger } from '@/lib/logger/logger.service';
import { syncManager } from '@/lib/offline/sync-manager';
import { offlineServices } from '@/services/offline-services';
import { ArrowLeftOutlined, SaveOutlined, SyncOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Form, Input, Space, Switch, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const WarehouseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation(['warehouses', 'commonUi']);
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

  // Load warehouse data for edit
  const loadWarehouse = async () => {
    if (!isEdit || !id) return;

    try {
      const warehouse = await offlineServices.warehouses.getById(id);
      if (warehouse) {
        form.setFieldsValue({
          code: warehouse.code,
          name: warehouse.name,
          address: warehouse.address,
          ward: warehouse.ward,
          district: warehouse.district,
          city: warehouse.city,
          phone: warehouse.phone,
          status: warehouse.status,
          isDefault: warehouse.isDefault,
        });
        logger.info('WarehouseForm', 'Loaded warehouse from IndexedDB', { id });
      }
    } catch (error) {
      logger.error('WarehouseForm', 'Failed to load warehouse', error as Error);
      message.error(t('warehouses:messages.loadError'));
    }
  };

  // Load queue size
  const loadQueueSize = async () => {
    const size = await syncManager.getQueueSize();
    setQueueSize(size);
  };

  // Initial load
  useEffect(() => {
    loadWarehouse();
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
        if (isEdit) await loadWarehouse();
      }
    } catch (error) {
      logger.error('WarehouseForm', 'Sync failed', error as Error);
    } finally {
      setSyncing(false);
    }
  };

  const generateCode = (name: string) =>
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 30);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit) form.setFieldValue('code', generateCode(e.target.value));
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      if (isEdit && id) {
        await offlineServices.warehouses.update(id, values);
        message.success(t('warehouses:messages.updateSuccess'));
        logger.info('WarehouseForm', 'Warehouse updated', { id });
      } else {
        await offlineServices.warehouses.create(values);
        message.success(t('warehouses:messages.createSuccess'));
        logger.info('WarehouseForm', 'Warehouse created');
      }

      await loadQueueSize();
      navigate('/warehouses');
    } catch (error) {
      logger.error('WarehouseForm', 'Failed to save warehouse', error as Error);
      message.error(t('warehouses:messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={isEdit ? t('warehouses:form.editTitle') : t('warehouses:form.createTitle')}
      extra={
        <Space>
          <Badge count={queueSize} offset={[-5, 5]}>
            <Button
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
              disabled={!isOnline}
            >
              {syncing ? t('warehouses:sync.syncing') : t('warehouses:buttons.sync')}
            </Button>
          </Badge>
          <Badge
            status={isOnline ? 'success' : 'error'}
            text={isOnline ? t('warehouses:sync.online') : t('warehouses:sync.offline')}
          />
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/warehouses')}>
            {t('warehouses:buttons.back')}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          status: 'active',
          isDefault: false,
        }}
      >
        <Form.Item
          label={t('warehouses:form.code')}
          name="code"
          extra={!isEdit ? t('warehouses:form.codeAutoGenerated', 'Tự động tạo từ tên') : undefined}
        >
          <Input placeholder={t('warehouses:validation.codePlaceholder')} />
        </Form.Item>

        <Form.Item
          label={t('warehouses:form.name')}
          name="name"
          rules={[{ required: true, message: t('warehouses:validation.nameRequired') }]}
        >
          <Input
            placeholder={t('warehouses:validation.namePlaceholder')}
            onChange={handleNameChange}
          />
        </Form.Item>

        <Form.Item
          label={t('warehouses:form.address')}
          name="address"
          rules={[{ required: true, message: t('warehouses:validation.addressRequired') }]}
        >
          <Input placeholder={t('warehouses:validation.addressPlaceholder')} />
        </Form.Item>

        <Form.Item label={t('warehouses:form.ward')} name="ward">
          <Input placeholder={t('warehouses:validation.wardPlaceholder')} />
        </Form.Item>

        <Form.Item label={t('warehouses:form.district')} name="district">
          <Input placeholder={t('warehouses:validation.districtPlaceholder')} />
        </Form.Item>

        <Form.Item
          label={t('warehouses:form.city')}
          name="city"
          rules={[{ required: true, message: t('warehouses:validation.cityRequired') }]}
        >
          <Input placeholder={t('warehouses:validation.cityPlaceholder')} />
        </Form.Item>

        <Form.Item label={t('warehouses:form.phone')} name="phone">
          <Input placeholder={t('warehouses:validation.phonePlaceholder')} />
        </Form.Item>

        <Form.Item label={t('warehouses:form.status')} name="status" valuePropName="checked">
          <Switch
            checkedChildren={t('warehouses:form.statusActive')}
            unCheckedChildren={t('warehouses:form.statusInactive')}
            onChange={(checked) => form.setFieldValue('status', checked ? 'active' : 'inactive')}
          />
        </Form.Item>

        <Form.Item label={t('warehouses:form.isDefault')} name="isDefault" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              {t('warehouses:buttons.save')}
            </Button>
            <Button onClick={() => navigate('/warehouses')}>
              {t('warehouses:buttons.cancel')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default WarehouseForm;
