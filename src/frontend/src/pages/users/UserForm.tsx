import React, { useEffect } from 'react';
import { Form, Input, Button, Card, message, Select, Switch, Space, Typography } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authService from '../../services/auth/authService';

const { Title } = Typography;
const { Option } = Select;

const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      // Mock data - implement when backend ready
      return null;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
    }
  }, [user, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (isEdit) {
        // Mock update - implement when backend ready
        throw new Error('Not implemented');
      } else {
        // Use register endpoint for creating new user
        return authService.register({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          tenantId: 1, // Default tenant
        });
      }
    },
    onSuccess: () => {
      message.success(isEdit ? 'Cập nhật người dùng thành công' : 'Tạo người dùng thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/dashboard/users');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  const handleSubmit = (values: any) => {
    saveMutation.mutate(values);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <UserOutlined /> {isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
            </Title>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/users')}>
              Quay lại
            </Button>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              role: 'USER',
              isActive: true,
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
              <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saveMutation.isPending}
                >
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
