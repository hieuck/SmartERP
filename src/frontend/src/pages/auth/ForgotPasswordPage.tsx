import { ArrowLeftOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Form, Input, Layout, Result, Row, Typography, theme } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { authService } from '@/services/auth/authService';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

interface ForgotPasswordFormValues {
  email: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { token } = useToken();
  const navigate = useNavigate();
  const [requestCompleted, setRequestCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ email }: ForgotPasswordFormValues) => authService.forgotPassword(email),
    onSuccess: () => {
      setErrorMessage(null);
      setRequestCompleted(true);
    },
    onError: (error: unknown) => {
      setErrorMessage(getErrorMessage(error, t('auth:forgotPassword.error')));
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
              {requestCompleted ? (
                <Result
                  status="success"
                  icon={<LockOutlined style={{ color: token.colorSuccess }} />}
                  title={t('auth:forgotPassword.successTitle')}
                  subTitle={t('auth:forgotPassword.successDescription')}
                  extra={[
                    <Button key="login" type="primary" onClick={() => navigate('/login')}>
                      {t('auth:forgotPassword.backToLogin')}
                    </Button>,
                  ]}
                />
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Title level={2} style={{ marginBottom: 8 }}>
                      {t('auth:forgotPassword.title')}
                    </Title>
                    <Paragraph style={{ color: '#595959', fontSize: 16 }}>
                      {t('auth:forgotPassword.subtitle')}
                    </Paragraph>
                  </div>

                  {errorMessage && (
                    <Alert
                      type="error"
                      showIcon
                      message={t('auth:forgotPassword.errorTitle')}
                      description={errorMessage}
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <Form layout="vertical" requiredMark={false} onFinish={(values) => mutation.mutate(values)}>
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
                        placeholder="email@example.com"
                        size="large"
                        autoComplete="email"
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
                          : t('auth:forgotPassword.submitButton')}
                      </Button>
                    </Form.Item>
                  </Form>
                </>
              )}
            </Card>

            <Card style={{ marginTop: 24, borderRadius: 16, background: token.colorBgElevated }}>
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')}>
                {t('auth:forgotPassword.backToLogin')}
              </Button>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
