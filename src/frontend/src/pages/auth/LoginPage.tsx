import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Checkbox,
  Space,
  message,
  Alert,
  Progress,
} from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { authService, LoginRequest } from '../../services/auth/authService';
import { setCredentials } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import {
  sanitizeEmail,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from '../../utils/sanitize';
import { useRateLimit } from '../../hooks/useRateLimit';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

/**
 * LoginPage Component
 * Handles user authentication with email and password
 * Features:
 * - Form validation (email format, required fields, password length)
 * - Loading states with spinner
 * - Error message display with Alert component
 * - Redirect to dashboard on success
 * - Accessibility support (ARIA labels)
 * - Disabled inputs during loading
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [form] = Form.useForm<LoginRequest>();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Rate limiting: 5 attempts per 60 seconds
  const { isLimited, remainingTime, recordAttempt } = useRateLimit({
    maxAttempts: 5,
    windowMs: 60 * 1000,
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to intended destination or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      form.setFieldValue('email', rememberedEmail);
      setRememberMe(true);
    }
  }, [form]);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      // Validate response data
      if (!data?.user?.id || !data?.token) {
        message.error('Invalid response from server');
        return;
      }

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.user.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Update Redux state with user credentials
      dispatch(
        setCredentials({
          user: {
            id: data.user.id,
            username: data.user.email,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            roles: [data.user.role],
          },
          accessToken: data.token,
          refreshToken: data.refreshToken || data.token,
        }),
      );

      // Clear any previous errors
      setErrorMessage(null);
      message.success('Đăng nhập thành công!');

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      recordAttempt();

      // Extract error message from various sources
      let errorMsg = 'Đăng nhập thất bại!';

      if (error?.response?.status === 423) {
        errorMsg = 'Tài khoản bị khóa. Vui lòng thử lại sau.';
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.response?.status === 401) {
        errorMsg = 'Email hoặc mật khẩu không chính xác';
      } else if (error?.response?.status === 404) {
        errorMsg = 'Tài khoản không tồn tại';
      } else if (error?.response?.status === 429) {
        errorMsg = 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.';
      } else if (error?.message === 'Network Error') {
        errorMsg = 'Lỗi kết nối. Vui lòng kiểm tra internet.';
      }

      setErrorMessage(errorMsg);
      message.error(errorMsg);
    },
  });

  const onFinish = (values: LoginRequest) => {
    // Check rate limit
    if (isLimited) {
      message.error(`Quá nhiều lần thử. Vui lòng thử lại sau ${remainingTime}s`);
      return;
    }

    // Sanitize email input
    const sanitizedEmail = sanitizeEmail(values.email);

    // Clear previous errors
    setErrorMessage(null);

    // Trigger login mutation with sanitized credentials
    loginMutation.mutate({
      email: sanitizedEmail,
      password: values.password,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const strength = getPasswordStrength(e.target.value);
    setPasswordStrength(strength);
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

      <Content
        style={{
          padding: '48px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Row justify="center" style={{ width: '100%' }}>
          <Col xs={24} sm={20} md={12} lg={8} xl={6}>
            <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Title level={2} style={{ marginBottom: 8 }}>
                  Đăng nhập
                </Title>
                <Paragraph style={{ color: '#595959', fontSize: 16 }}>
                  Chào mừng trở lại với SmartERP
                </Paragraph>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <Alert
                  message="Lỗi đăng nhập"
                  description={errorMessage}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setErrorMessage(null)}
                  style={{ marginBottom: 16 }}
                  role="alert"
                />
              )}

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
                    { type: 'email', message: 'Email không hợp lệ!' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="admin@test.com"
                    size="large"
                    disabled={loginMutation.isPending}
                    aria-label="Email address"
                    type="email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                    size="large"
                    disabled={loginMutation.isPending || isLimited}
                    aria-label="Password"
                    onChange={handlePasswordChange}
                  />
                </Form.Item>

                {/* Password Strength Indicator */}
                {passwordStrength > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Progress
                      percent={(passwordStrength / 5) * 100}
                      strokeColor={getPasswordStrengthColor(passwordStrength)}
                      showInfo={false}
                      size="small"
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Độ mạnh: {getPasswordStrengthLabel(passwordStrength)}
                    </Typography.Text>
                  </div>
                )}

                <Form.Item>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Checkbox
                        disabled={loginMutation.isPending || isLimited}
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      >
                        Ghi nhớ đăng nhập
                      </Checkbox>
                    </Col>
                    <Col>
                      <Link to="/forgot-password" style={{ color: '#1890ff' }}>
                        Quên mật khẩu?
                      </Link>
                    </Col>
                  </Row>
                </Form.Item>

                {/* Rate Limit Warning */}
                {isLimited && (
                  <Alert
                    message="Quá nhiều lần thử"
                    description={`Vui lòng thử lại sau ${remainingTime} giây`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loginMutation.isPending}
                    disabled={loginMutation.isPending || isLimited}
                    block
                    style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                    aria-label="Login button"
                  >
                    {loginMutation.isPending ? 'Đang xử lý...' : 'Đăng nhập'}
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

            <Card style={{ marginTop: 24, borderRadius: 16, background: '#f6f8fa' }}>
              <Title level={5} style={{ marginBottom: 16 }}>
                Tài khoản demo:
              </Title>
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
