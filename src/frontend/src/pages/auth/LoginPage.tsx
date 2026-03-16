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
} from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authService, LoginRequest } from '@/services/auth/authService';
import { setCredentials } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { sanitizeEmail } from '@/utils/sanitize';
import { useRateLimit } from '@/hooks/useRateLimit';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

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
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [form] = Form.useForm<LoginRequest>();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

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
      message.success(t('auth:login.success'));

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      recordAttempt();

      // Extract error message from various sources
      let errorMsg = t('auth:login.error');

      if (error?.response?.status === 500) {
        // Handle 500 Internal Server Error
        errorMsg = 'Server error occurred. Please try again later.';
        console.error('Login 500 error:', error?.response?.data);
      } else if (error?.response?.status === 423) {
        errorMsg = t('common:messages.unauthorized');
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.response?.status === 401) {
        errorMsg = t('auth:login.error');
      } else if (error?.response?.status === 404) {
        errorMsg = t('auth:login.error');
      } else if (error?.response?.status === 429) {
        errorMsg = t('common:messages.error');
      } else if (error?.message === 'Network Error') {
        errorMsg = t('common:messages.networkError');
      }

      // Only set error message for Alert component (removed duplicate message.error toast)
      setErrorMessage(errorMsg);
    },
  });

  const onFinish = (values: LoginRequest) => {
    // Check rate limit
    if (isLimited) {
      message.error(t('common:messages.error'));
      return;
    }

    // Sanitize email input
    const sanitizedEmail = sanitizeEmail(values.email);

    // Handle remember me - save email immediately when checkbox is checked
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', sanitizedEmail);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    // Clear previous errors
    setErrorMessage(null);

    // Trigger login mutation with sanitized credentials
    loginMutation.mutate({
      email: sanitizedEmail,
      password: values.password,
    });
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '0 24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
          <LanguageSwitcher />
        </div>
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
                  {t('auth:login.title')}
                </Title>
                <Paragraph style={{ color: '#595959', fontSize: 16 }}>
                  {t('auth:login.subtitle')}
                </Paragraph>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <Alert
                  message={t('auth:login.error')}
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
                  label={t('auth:login.email')}
                  rules={[
                    { required: true, message: t('auth:validation.emailRequired') },
                    { type: 'email', message: t('auth:validation.emailInvalid') },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="admin@demo.com"
                    size="large"
                    disabled={loginMutation.isPending}
                    type="email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={t('auth:login.password')}
                  rules={[
                    { required: true, message: t('auth:validation.passwordRequired') },
                    { min: 6, message: t('auth:validation.passwordMinLength') },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                    size="large"
                    disabled={loginMutation.isPending || isLimited}
                  />
                </Form.Item>

                <Form.Item>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Checkbox
                        disabled={loginMutation.isPending || isLimited}
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      >
                        {t('auth:login.rememberMe')}
                      </Checkbox>
                    </Col>
                    <Col>
                      <Link to="/forgot-password" style={{ color: '#1890ff' }}>
                        {t('auth:login.forgotPassword')}
                      </Link>
                    </Col>
                  </Row>
                </Form.Item>

                {/* Rate Limit Warning */}
                {isLimited && (
                  <Alert
                    message={t('common:messages.error')}
                    description={t('common:messages.error')}
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
                  >
                    {loginMutation.isPending ? t('common:messages.loading') : t('auth:login.loginButton')}
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <Text style={{ color: '#595959' }}>
                    {t('auth:login.noAccount')}{' '}
                    <Link to="/register" style={{ color: '#1890ff', fontWeight: 600 }}>
                      {t('auth:login.signUp')}
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
                <Text>📧 Email: admin@demo.com</Text>
                <Text>🔑 Password: admin123</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
