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
  Rate,
  Badge,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, ShopOutlined, SyncOutlined } from '@ant-design/icons';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';

const { Title } = Typography;
const { TextArea } = Input;

export default function SupplierForm() {
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
      message.error('Không thể tải nhà cung cấp');
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

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      if (isEdit && id) {
        await offlineServices.suppliers.update(id, values);
        message.success('Cập nhật nhà cung cấp thành công');
        logger.info('SupplierForm', 'Supplier updated', { id });
      } else {
        await offlineServices.suppliers.create(values);
        message.success('Tạo nhà cung cấp thành công');
        logger.info('SupplierForm', 'Supplier created');
      }

      await loadQueueSize();
      navigate('/dashboard/suppliers');
    } catch (error) {
      logger.error('SupplierForm', 'Failed to save supplier', error as Error);
      message.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/suppliers')}>
            Quay lại
          </Button>
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
          </Space>
        </Space>

        <Title level={3}>
          <ShopOutlined /> {isEdit ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
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
                label="Tên nhà cung cấp"
                rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}
              >
                <Input placeholder="Nhập tên nhà cung cấp" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="paymentTerms"
                label="Điều khoản thanh toán"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Số ngày thanh toán" addonAfter="ngày" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <TextArea rows={3} placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                {isEdit ? 'Cập nhật' : 'Tạo mới'}
              </Button>
              <Button onClick={() => navigate('/dashboard/suppliers')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
