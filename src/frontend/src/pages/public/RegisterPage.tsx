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
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth/authService';
import { setCredentials } from '@/store/slices/authSlice';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

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
  const { t } = useTranslation(['auth', 'common']);
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
      message.success(t('auth:register.success'));
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    },
    onError: (error: any) => {
      const errorMsg = error.message || t('auth:register.error');
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
                    onChange={handleCompanyNameChange}
                  />
                </Form.Item>

                <Form.Item
                  name="slug"
                  label={t('auth:register.companySlug')}
                  rules={[
                    { required: true, message: t('auth:validation.companySlugRequired') },
                    {
                      pattern: /^[a-z0-9-]+$/,
                      message: t('auth:validation.companySlugRequired'),
                    },
                  ]}
                  extra={t('auth:register.companySlug')}
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      prefix={<GlobalOutlined />}
                      placeholder="company-name"
                      size="large"
                      style={{ flex: 1 }}
                      aria-label={t('auth:register.companySlug')}
                    />
                    <Input value=".smarterp.vn" disabled size="large" style={{ width: 120 }} />
                  </Space.Compact>
                </Form.Item>

                <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
                  {t('auth:register.subtitle')}
                </Title>

                <Form.Item
                  name="fullName"
                  label={t('auth:register.firstName')}
                  rules={[{ required: true, message: t('auth:validation.firstNameRequired') }]}
                >
                  <Input prefix={<UserOutlined />} placeholder={t('auth:register.firstName')} size="large" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={t('auth:register.email')}
                  rules={[
                    { required: true, message: t('auth:validation.emailRequired') },
                    { type: 'email', message: t('auth:validation.emailInvalid') },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="email@example.com" size="large" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label={t('auth:register.phone')}
                  rules={[
                    { required: true, message: t('common:validation.required') },
                    { pattern: /^[0-9]{10,11}$/, message: t('common:validation.phone') },
                  ]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="0912345678" size="large" />
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
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label={t('auth:register.confirmPassword')}
                  dependencies={['password']}
                  rules={[
                    { required: true, message: t('auth:validation.passwordRequired') },
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
                          : Promise.reject(new Error(t('auth:validation.agreeTermsRequired'))),
                    },
                  ]}
                >
                  <Checkbox>
                    {t('auth:register.agreeTerms')}{' '}
                    <a href="#" style={{ color: '#1890ff' }}>
                      {t('auth:register.termsOfService')}
                    </a>{' '}
                    {t('auth:register.and')}{' '}
                    <a href="#" style={{ color: '#1890ff' }}>
                      {t('auth:register.privacyPolicy')}
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
                    {registerMutation.isPending ? t('common:messages.loading') : t('auth:register.registerButton')}
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

            <Card style={{ marginTop: 24, borderRadius: 16, background: '#f6f8fa' }}>
              <Title level={5} style={{ marginBottom: 16 }}>
                {t('auth:register.benefits.title')}
              </Title>
              <Space direction="vertical" size="small">
                <Text>✓ {t('auth:register.benefits.trial')}</Text>
                <Text>✓ {t('auth:register.benefits.noCard')}</Text>
                <Text>✓ {t('auth:register.benefits.support')}</Text>
                <Text>✓ {t('auth:register.benefits.training')}</Text>
                <Text>✓ {t('auth:register.benefits.cancel')}</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
