import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Form, Input, Button, Card, Typography, Row, Col, Checkbox, Space, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { authService, LoginRequest } from '../../services/auth/authService';
import { setCredentials } from '../../store/slices/authSlice';
import { RootState } from '../../store';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [form] = Form.useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      // Map backend response to frontend format
      dispatch(setCredentials({
        user: {
          ...data.user,
          username: data.user.email, // Use email as username
          roles: [data.user.role], // Convert role string to array
        },
        accessToken: data.token, // Map token to accessToken
        refreshToken: data.token, // Use same token for refresh (stateless JWT)
      }));
      message.success('Đăng nhập thành công!');
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Đăng nhập thất bại!');
    },
  });

  const onFinish = (values: LoginRequest) => {
    loginMutation.mutate(values);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <Header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '0 24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%' }}>
          <div style={{ width: 32, height: 32, background: '#1890ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text strong style={{ color: '#fff', fontSize: 20 }}>P</Text>
          </div>
          <Text strong style={{ fontSize: 20, color: '#000' }}>SmartERP</Text>
        </Link>
      </Header>

      {/* Main Content */}
      <Content style={{ padding: '48px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Row justify="center" style={{ width: '100%' }}>
          <Col xs={24} sm={20} md={12} lg={8} xl={6}>
            <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Title level={2} style={{ marginBottom: 8 }}>Đăng nhập</Title>
                <Paragraph style={{ color: '#595959', fontSize: 16 }}>
                  Chào mừng trở lại với SmartERP
                </Paragraph>
              </div>

              <Form
                form={form}
                name="login"
                onFinish={onFinish}
                autoComplete="off"
                layout="vertical"
                requiredMark={false}
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Email không hợp lệ!' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="admin@test.com"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                    </Col>
                    <Col>
                      <a href="#" style={{ color: '#1890ff' }}>Quên mật khẩu?</a>
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loginMutation.isPending}
                    block
                    style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                  >
                    Đăng nhập
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <Text style={{ color: '#595959' }}>
                    Chưa có tài khoản?{' '}
                    <Link to="/register" style={{ color: '#1890ff', fontWeight: 600 }}>
                      Đăng ký ngay
                    </Link>
                  </Text>
                </div>
              </Form>
            </Card>

            {/* Quick Login Info */}
            <Card style={{ marginTop: 24, borderRadius: 16, background: '#f6f8fa' }}>
              <Title level={5} style={{ marginBottom: 16 }}>Tài khoản demo:</Title>
              <Space direction="vertical" size="small">
                <Text>📧 Email: admin@test.com</Text>
                <Text>🔑 Password: admin123</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
