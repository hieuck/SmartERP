import { ArrowLeftOutlined, CheckCircleFilled, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Form, Input, Layout, Result, Row, Typography, theme } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { authService } from '@/services/auth/authService';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function ResetPasswordPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { token } = useToken();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resetToken = params.get('token') ?? '';

  const mutation = useMutation({
    mutationFn: ({ password }: ResetPasswordFormValues) =>
      authService.resetPassword({ token: resetToken, newPassword: password }),
    onSuccess: () => {
      setErrorMessage(null);
      setCompleted(true);
    },
    onError: (error: unknown) => {
      setErrorMessage(getErrorMessage(error, t('auth:resetPassword.error')));
    },
  });

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Header
        style={{
          background: token.colorBgContainer,
          boxShadow: token.boxShadowTertiary,
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
              {!resetToken ? (
                <Result
                  status="warning"
                  title={t('auth:resetPassword.invalidTokenTitle')}
                  subTitle={t('auth:resetPassword.invalidTokenDescription')}
                  extra={[
                    <Button key="forgot" type="primary" onClick={() => navigate('/forgot-password')}>
                      {t('auth:resetPassword.requestNewLink')}
                    </Button>,
                  ]}
                />
              ) : completed ? (
                <Result
                  status="success"
                  icon={<CheckCircleFilled style={{ color: token.colorSuccess }} />}
                  title={t('auth:resetPassword.successTitle')}
                  subTitle={t('auth:resetPassword.successDescription')}
                  extra={[
                    <Button key="login" type="primary" onClick={() => navigate('/login')}>
                      {t('auth:resetPassword.backToLogin')}
                    </Button>,
                  ]}
                />
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Title level={2} style={{ marginBottom: 8 }}>
                      {t('auth:resetPassword.title')}
                    </Title>
                    <Paragraph style={{ color: '#595959', fontSize: 16 }}>
                      {t('auth:resetPassword.subtitle')}
                    </Paragraph>
                  </div>

                  {errorMessage && (
                    <Alert
                      type="error"
                      showIcon
                      message={t('auth:resetPassword.errorTitle')}
                      description={errorMessage}
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <Form
                    layout="vertical"
                    requiredMark={false}
                    onFinish={(values) => mutation.mutate(values)}
                  >
                    <Form.Item
                      name="password"
                      label={t('auth:register.password')}
                      rules={[
                        { required: true, message: t('auth:validation.passwordRequired') },
                        { min: 8, message: t('auth:validation.passwordMinLength') },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="********"
                        size="large"
                        autoComplete="new-password"
                        disabled={mutation.isPending}
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
                        disabled={mutation.isPending}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        loading={mutation.isPending}
                        disabled={mutation.isPending}
                        style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                      >
                        {mutation.isPending
                          ? t('common:messages.loading')
                          : t('auth:resetPassword.submitButton')}
                      </Button>
                    </Form.Item>
                  </Form>
                </>
              )}
            </Card>

            <Card style={{ marginTop: 24, borderRadius: 16, background: token.colorBgElevated }}>
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')}>
                {t('auth:resetPassword.backToLogin')}
              </Button>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
