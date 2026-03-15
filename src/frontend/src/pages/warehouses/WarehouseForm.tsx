/**
 * Warehouse Form Page
 * Create and edit warehouses
 * Requirements: 27.1
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Card, Space, Switch, message, Badge } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, SyncOutlined } from '@ant-design/icons';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';

const WarehouseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
      message.error('Không thể tải kho');
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

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      if (isEdit && id) {
        await offlineServices.warehouses.update(id, values);
        message.success('Cập nhật kho thành công');
        logger.info('WarehouseForm', 'Warehouse updated', { id });
      } else {
        await offlineServices.warehouses.create(values);
        message.success('Tạo kho thành công');
        logger.info('WarehouseForm', 'Warehouse created');
      }

      await loadQueueSize();
      navigate('/warehouses');
    } catch (error) {
      logger.error('WarehouseForm', 'Failed to save warehouse', error as Error);
      message.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={isEdit ? 'Chỉnh sửa kho' : 'Thêm kho mới'}
      extra={
        <Space>
          <Badge count={queueSize} offset={[-5, 5]}>
            <Button
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
              disabled={!isOnline}
            >
              Đồng bộ
            </Button>
          </Badge>
          <Badge status={isOnline ? 'success' : 'error'} text={isOnline ? 'Online' : 'Offline'} />
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/warehouses')}>
            Quay lại
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
          label="Mã kho"
          name="code"
          rules={[{ required: true, message: 'Vui lòng nhập mã kho' }]}
        >
          <Input placeholder="Nhập mã kho" />
        </Form.Item>

        <Form.Item
          label="Tên kho"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên kho' }]}
        >
          <Input placeholder="Nhập tên kho" />
        </Form.Item>

        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
        >
          <Input placeholder="Nhập địa chỉ" />
        </Form.Item>

        <Form.Item label="Phường/Xã" name="ward">
          <Input placeholder="Nhập phường/xã" />
        </Form.Item>

        <Form.Item label="Quận/Huyện" name="district">
          <Input placeholder="Nhập quận/huyện" />
        </Form.Item>

        <Form.Item
          label="Tỉnh/Thành phố"
          name="city"
          rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
        >
          <Input placeholder="Nhập tỉnh/thành phố" />
        </Form.Item>

        <Form.Item label="Điện thoại" name="phone">
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item label="Trạng thái" name="status" valuePropName="checked">
          <Switch
            checkedChildren="Hoạt động"
            unCheckedChildren="Ngừng"
            onChange={(checked) => form.setFieldValue('status', checked ? 'active' : 'inactive')}
          />
        </Form.Item>

        <Form.Item label="Đặt làm kho mặc định" name="isDefault" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Lưu
            </Button>
            <Button onClick={() => navigate('/warehouses')}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default WarehouseForm;
