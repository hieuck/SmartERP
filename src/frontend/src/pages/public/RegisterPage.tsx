import {
  GlobalOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Layout,
  Row,
  Space,
  Typography,
  message,
} from 'antd';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth/authService';
import { setCredentials } from '../../store/slices/authSlice';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface RegisterFormValues {
  companyName: string;
  slug: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm<RegisterFormValues>();

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const companyName = e.target.value;
    const slug = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    form.setFieldsValue({ slug });
  };

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      return authService.register({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        companyName: values.companyName,
        phone: values.phone,
      });
    },
    onSuccess: (data) => {
      dispatch(
        setCredentials({
          user: {
            ...data.user,
            username: data.user.email,
            roles: [data.user.role],
          },
          accessToken: data.token,
          refreshToken: data.refreshToken || data.token,
        }),
      );
      message.success('Đăng ký thành công! Chào mừng bạn đến với SmartERP.');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    },
    onError: (error: any) => {
      const errorMsg = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      message.error(errorMsg);
    },
  });

  const handleSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '0 24px' }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%' }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: '#1890ff',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text strong style={{ color: '#fff', fontSize: 20 }}>
              P
            </Text>
          </div>
          <Text strong style={{ fontSize: 20, color: '#000' }}>
            SmartERP
          </Text>
        </Link>
      </Header>

      <Content style={{ padding: '48px 24px' }}>
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
            <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Title level={2} style={{ marginBottom: 8 }}>
                  Đăng ký dùng thử miễn phí
                </Title>
                <Paragraph style={{ color: '#595959', fontSize: 16 }}>
                  14 ngày dùng thử, không cần thẻ tín dụng
                </Paragraph>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                requiredMark={false}
              >
                <Title level={4} style={{ marginBottom: 16 }}>
                  Thông tin công ty
                </Title>

                <Form.Item
                  name="companyName"
                  label="Tên công ty"
                  rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                >
                  <Input
                    prefix={<ShopOutlined />}
                    placeholder="Công ty TNHH ABC"
                    size="large"
                    onChange={handleCompanyNameChange}
                  />
                </Form.Item>

                <Form.Item
                  name="slug"
                  label="Tên miền (subdomain)"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên miền' },
                    {
                      pattern: /^[a-z0-9-]+$/,
                      message: 'Tên miền chỉ chứa chữ thường, số và dấu gạch ngang',
                    },
                  ]}
                  extra="Đây sẽ là địa chỉ truy cập hệ thống của bạn"
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      prefix={<GlobalOutlined />}
                      placeholder="cong-ty-abc"
                      size="large"
                      style={{ flex: 1 }}
                      aria-label="Tên miền"
                    />
                    <Input value=".smarterp.vn" disabled size="large" style={{ width: 120 }} />
                  </Space.Compact>
                </Form.Item>

                <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
                  Thông tin cá nhân
                </Title>

                <Form.Item
                  name="fullName"
                  label="Họ và tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" size="large" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="email@example.com" size="large" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' },
                  ]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="0912345678" size="large" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                    {
                      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số',
                    },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
                </Form.Item>

                <Form.Item
                  name="terms"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(new Error('Vui lòng đồng ý với điều khoản')),
                    },
                  ]}
                >
                  <Checkbox>
                    Tôi đồng ý với{' '}
                    <a href="#" style={{ color: '#1890ff' }}>
                      Điều khoản dịch vụ
                    </a>{' '}
                    và{' '}
                    <a href="#" style={{ color: '#1890ff' }}>
                      Chính sách bảo mật
                    </a>
                  </Checkbox>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={registerMutation.isPending}
                    disabled={registerMutation.isPending}
                    block
                    style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                  >
                    {registerMutation.isPending ? 'Đang xử lý...' : 'Đăng ký miễn phí'}
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <Text style={{ color: '#595959' }}>
                    Đã có tài khoản?{' '}
                    <Link to="/login" style={{ color: '#1890ff', fontWeight: 600 }}>
                      Đăng nhập
                    </Link>
                  </Text>
                </div>
              </Form>
            </Card>

            <Card style={{ marginTop: 24, borderRadius: 16, background: '#f6f8fa' }}>
              <Title level={5} style={{ marginBottom: 16 }}>
                Bạn sẽ nhận được:
              </Title>
              <Space direction="vertical" size="small">
                <Text>✓ 14 ngày dùng thử miễn phí</Text>
                <Text>✓ Không cần thẻ tín dụng</Text>
                <Text>✓ Hỗ trợ 24/7</Text>
                <Text>✓ Đào tạo miễn phí</Text>
                <Text>✓ Hủy bất cứ lúc nào</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
