import { logger } from '@/lib/logger/logger.service';
import { syncManager } from '@/lib/offline/sync-manager';
import authService from '@/services/auth/authService';
import { offlineServices } from '@/services/offline-services';
import { ArrowLeftOutlined, SaveOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Form, Input, message, Select, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

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

  // Load user data for edit
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
      message.error('Không thể tải người dùng');
    }
  };

  // Load queue size
  const loadQueueSize = async () => {
    const size = await syncManager.getQueueSize();
    setQueueSize(size);
  };

  // Initial load
  useEffect(() => {
    loadUser();
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
        if (isEdit) await loadUser();
      }
    } catch (error) {
      logger.error('UserForm', 'Sync failed', error as Error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      if (isEdit && id) {
        // Update existing user
        await offlineServices.users.update(id, values);
        message.success('Cập nhật người dùng thành công');
        logger.info('UserForm', 'User updated', { id });
      } else {
        // Create new user via register endpoint (requires password)
        // Note: This uses authService.register which creates user + auth
        await authService.register({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          tenantId: 1, // Default tenant
        });
        message.success('Tạo người dùng thành công');
        logger.info('UserForm', 'User created via register');
      }

      await loadQueueSize();
      navigate('/dashboard/users');
    } catch (error) {
      logger.error('UserForm', 'Failed to save user', error as Error);
      message.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <UserOutlined /> {isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
            </Title>
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
              <Badge
                status={isOnline ? 'success' : 'error'}
                text={isOnline ? 'Online' : 'Offline'}
              />
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/users')}>
                Quay lại
              </Button>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              role: 'USER',
              status: 'active',
            }}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input placeholder="user@example.com" disabled={isEdit} />
            </Form.Item>

            {!isEdit && (
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>
            )}

            {!isEdit && (
              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu không khớp'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Nhập lại mật khẩu" />
              </Form.Item>
            )}

            <Form.Item
              label="Họ"
              name="firstName"
              rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
            >
              <Input placeholder="Nguyễn" />
            </Form.Item>

            <Form.Item
              label="Tên"
              name="lastName"
              rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            >
              <Input placeholder="Văn A" />
            </Form.Item>

            <Form.Item
              label="Vai trò"
              name="role"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
            >
              <Select placeholder="Chọn vai trò">
                <Option value="ADMIN">Quản trị viên</Option>
                <Option value="MANAGER">Quản lý</Option>
                <Option value="USER">Người dùng</Option>
                <Option value="VIEWER">Xem</Option>
              </Select>
            </Form.Item>

            {isEdit && (
              <Form.Item label="Trạng thái" name="status">
                <Select placeholder="Chọn trạng thái">
                  <Option value="active">Hoạt động</Option>
                  <Option value="inactive">Vô hiệu</Option>
                </Select>
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {isEdit ? 'Cập nhật' : 'Tạo mới'}
                </Button>
                <Button onClick={() => navigate('/dashboard/users')}>Hủy</Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default UserForm;
