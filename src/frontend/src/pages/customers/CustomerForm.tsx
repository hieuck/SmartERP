import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, InputNumber, message, Row, Space, Typography, Badge } from 'antd';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';

const { Title } = Typography;
const { TextArea } = Input;

export default function CustomerForm() {
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
      message.error('Không thể tải khách hàng');
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
        message.success('Cập nhật khách hàng thành công');
        logger.info('CustomerForm', 'Customer updated', { id });
      } else {
        await offlineServices.customers.create(values);
        message.success('Tạo khách hàng thành công');
        logger.info('CustomerForm', 'Customer created');
      }

      await loadQueueSize();
      navigate('/dashboard/customers');
    } catch (error) {
      logger.error('CustomerForm', 'Failed to save customer', error as Error);
      message.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/customers')}>
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
          <UserOutlined /> {isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
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
                label="Tên khách hàng"
                rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
              >
                <Input placeholder="Nhập tên khách hàng" />
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
                name="creditLimit"
                label="Hạn mức tín dụng"
                rules={[{ required: true, message: 'Vui lòng nhập hạn mức' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="₫"
                />
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
              <Button onClick={() => navigate('/dashboard/customers')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
