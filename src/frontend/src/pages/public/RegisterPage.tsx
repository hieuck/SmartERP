import {
  CheckCircleFilled,
  GlobalOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import {
  App,
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
  theme,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { authService } from '@/services/auth/authService';
import { setCredentials } from '@/store/slices/authSlice';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

interface RegisterFormValues {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function normalizeCompanySlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function RegisterPage() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm<RegisterFormValues>();
  const companyName = Form.useWatch('companyName', form) ?? '';
  const workspaceSlugPreview = normalizeCompanySlug(companyName);
  const { message } = App.useApp();
  const { token } = useToken();
  const benefitItems = [
    t('auth:register.benefits.trial'),
    t('auth:register.benefits.noCard'),
    t('auth:register.benefits.support'),
    t('auth:register.benefits.training'),
    t('auth:register.benefits.cancel'),
  ];

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues) =>
      authService.register({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        companyName: values.companyName,
        phone: values.phone,
      }),
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
      message.success(t('auth:register.success'));
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    },
    onError: (error: unknown) => {
      message.error(getErrorMessage(error, t('auth:register.error')));
    },
  });

  const handleSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Header
        style={{
          background: token.colorBgContainer,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: token.colorPrimary,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text strong style={{ color: token.colorBgContainer, fontSize: 20 }}>
                P
              </Text>
            </div>
            <Text strong style={{ fontSize: 20 }}>
              SmartERP
            </Text>
          </Link>
          <LanguageSwitcher />
        </div>
      </Header>

      <Content style={{ padding: '48px 24px' }}>
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
            <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Title level={2} style={{ marginBottom: 8 }}>
                  {t('auth:register.title')}
                </Title>
                <Paragraph style={{ color: '#595959', fontSize: 16 }}>
                  {t('auth:register.subtitle')}
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
                  {t('auth:register.companyInfo')}
                </Title>

                <Form.Item
                  name="companyName"
                  label={t('auth:register.companyName')}
                  rules={[{ required: true, message: t('auth:validation.companyNameRequired') }]}
                >
                  <Input
                    prefix={<ShopOutlined />}
                    placeholder={t('auth:register.companyName')}
                    size="large"
                    autoComplete="organization"
                  />
                </Form.Item>

                <Form.Item label={t('auth:register.workspaceUrl')} extra={t('auth:register.workspaceUrlHelp')}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      prefix={<GlobalOutlined />}
                      placeholder="your-company"
                      size="large"
                      style={{ flex: 1 }}
                      aria-label={t('auth:register.workspaceUrl')}
                      autoComplete="off"
                      readOnly
                      value={workspaceSlugPreview}
                    />
                    <Input value=".smarterp.vn" disabled size="large" style={{ width: 120 }} />
                  </Space.Compact>
                </Form.Item>

                <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
                  {t('auth:register.accountInfo')}
                </Title>

                <Form.Item
                  name="fullName"
                  label={t('auth:register.fullName')}
                  rules={[{ required: true, message: t('auth:validation.fullNameRequired') }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder={t('auth:register.fullName')}
                    size="large"
                    autoComplete="name"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={t('auth:register.email')}
                  rules={[
                    { required: true, message: t('auth:validation.emailRequired') },
                    { type: 'email', message: t('auth:validation.emailInvalid') },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="email@example.com"
                    size="large"
                    autoComplete="email"
                  />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label={t('auth:register.phone')}
                  rules={[
                    { required: true, message: t('common:validation.required') },
                    { pattern: /^[0-9]{10,11}$/, message: t('common:validation.phone') },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="0912345678"
                    size="large"
                    autoComplete="tel"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={t('auth:register.password')}
                  rules={[
                    { required: true, message: t('auth:validation.passwordRequired') },
                    { min: 8, message: t('auth:validation.passwordMinLength') },
                    {
                      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: t('auth:validation.passwordMinLength'),
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="********"
                    size="large"
                    autoComplete="new-password"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label={t('auth:register.confirmPassword')}
                  dependencies={['password']}
                  rules={[
                    { required: true, message: t('auth:validation.confirmPasswordRequired') },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error(t('auth:register.passwordMismatch')));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="********"
                    size="large"
                    autoComplete="new-password"
                  />
                </Form.Item>

                <Form.Item
                  name="terms"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(new Error(t('auth:validation.agreeTermsRequired'))),
                    },
                  ]}
                >
                  <Checkbox>
                    {t('auth:register.agreeTerms')}{' '}
                    <Text underline>{t('auth:register.termsOfService')}</Text>{' '}
                    {t('auth:register.and')}{' '}
                    <Text underline>{t('auth:register.privacyPolicy')}</Text>
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
                    {registerMutation.isPending
                      ? t('common:messages.loading')
                      : t('auth:register.registerButton')}
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <Text style={{ color: '#595959' }}>
                    {t('auth:register.haveAccount')}{' '}
                    <Link to="/login" style={{ color: '#1890ff', fontWeight: 600 }}>
                      {t('auth:register.signIn')}
                    </Link>
                  </Text>
                </div>
              </Form>
            </Card>

            <Card style={{ marginTop: 24, borderRadius: 16, background: token.colorBgElevated }}>
              <Title level={5} style={{ marginBottom: 16 }}>
                {t('auth:register.benefits.title')}
              </Title>
              <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                {benefitItems.map((benefit) => (
                  <div
                    key={benefit}
                    style={{ display: 'flex', alignItems: 'center', gap: token.marginSM }}
                  >
                    <CheckCircleFilled style={{ color: token.colorSuccess }} />
                    <Text>{benefit}</Text>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
