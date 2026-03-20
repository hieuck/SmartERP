import { ArrowLeftOutlined, FileProtectOutlined, SafetyOutlined } from '@ant-design/icons';
import { Button, Card, Col, Layout, Row, Space, Tag, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import ThemeToggle from '@/components/common/ThemeToggle';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

type PolicyType = 'terms' | 'privacy';

interface PolicySection {
  title: string;
  paragraphs: string[];
}

interface PolicyCopy {
  badge: string;
  title: string;
  subtitle: string;
  updatedLabel: string;
  sections: PolicySection[];
  secondaryCta: string;
  secondaryHref: string;
  secondaryLabel: string;
  primaryCta: string;
  backHome: string;
}

const legalCopy: Record<'en' | 'vi', Record<PolicyType, PolicyCopy>> = {
  en: {
    terms: {
      badge: 'SmartERP legal',
      title: 'Terms of Service',
      subtitle:
        'These terms describe how your team may access, evaluate, and use SmartERP during trials and active subscriptions.',
      updatedLabel: 'Last updated: March 20, 2026',
      sections: [
        {
          title: 'Workspace access and fair use',
          paragraphs: [
            'Each workspace is provisioned for the company that created it. Administrators are responsible for keeping account access accurate and removing users who no longer need access.',
            'You agree not to abuse trial environments, attempt to bypass security controls, or use SmartERP to process unlawful activity.',
          ],
        },
        {
          title: 'Data responsibility',
          paragraphs: [
            'Your team retains ownership of the business data entered into SmartERP. You are responsible for the accuracy of imported records, financial entries, and operational workflows configured in your workspace.',
            'SmartERP may suspend access to protect the platform or other tenants if a workspace threatens service reliability or security.',
          ],
        },
        {
          title: 'Billing and support',
          paragraphs: [
            'Free trials convert only when you explicitly agree to a paid plan. Subscription changes, renewals, and cancellations are handled according to the commercial terms shared during onboarding.',
            'Support response times depend on your plan. Production incidents and security concerns are prioritized over advisory requests.',
          ],
        },
      ],
      secondaryCta: 'Privacy Policy',
      secondaryHref: '/privacy',
      secondaryLabel: 'Review how we handle personal and operational data.',
      primaryCta: 'Start free trial',
      backHome: 'Back to homepage',
    },
    privacy: {
      badge: 'SmartERP legal',
      title: 'Privacy Policy',
      subtitle:
        'This policy explains how SmartERP processes account information, workspace metadata, and operational records needed to deliver the service.',
      updatedLabel: 'Last updated: March 20, 2026',
      sections: [
        {
          title: 'What we collect',
          paragraphs: [
            'We collect the account details needed to provision and secure your workspace, such as name, email address, role, company information, and authentication events.',
            'Operational data like orders, inventory movements, audit logs, and configuration settings are stored so your team can run the platform and keep a reliable history of activity.',
          ],
        },
        {
          title: 'How we use data',
          paragraphs: [
            'We use data to authenticate users, support business workflows, troubleshoot incidents, and improve platform reliability. Access is limited to authorized personnel with a legitimate operational need.',
            'We do not sell customer workspace data. Analytics and diagnostics are configured to support product quality and service operations.',
          ],
        },
        {
          title: 'Retention and control',
          paragraphs: [
            'Workspace data is retained according to your subscription and operational requirements. Export and deletion requests are handled through support and administrative workflows.',
            'If you need to update account details or discuss retention, contact the SmartERP team through the channels shared during onboarding.',
          ],
        },
      ],
      secondaryCta: 'Terms of Service',
      secondaryHref: '/terms',
      secondaryLabel: 'Review the service terms that govern workspace usage.',
      primaryCta: 'Create workspace',
      backHome: 'Back to homepage',
    },
  },
  vi: {
    terms: {
      badge: 'Pháp lý SmartERP',
      title: 'Điều khoản dịch vụ',
      subtitle:
        'Các điều khoản này mô tả cách doanh nghiệp của bạn được truy cập, dùng thử và sử dụng SmartERP trong giai đoạn trial và khi có gói dịch vụ chính thức.',
      updatedLabel: 'Cập nhật lần cuối: 20/03/2026',
      sections: [
        {
          title: 'Quyền truy cập workspace và sử dụng hợp lệ',
          paragraphs: [
            'Mỗi workspace được cấp cho doanh nghiệp đã tạo workspace đó. Quản trị viên chịu trách nhiệm cập nhật đúng người dùng được phép truy cập và thu hồi quyền khi không còn cần thiết.',
            'Bạn không được lạm dụng môi trường dùng thử, cố vượt qua các cơ chế bảo mật, hoặc sử dụng SmartERP cho hoạt động trái pháp luật.',
          ],
        },
        {
          title: 'Trách nhiệm với dữ liệu',
          paragraphs: [
            'Doanh nghiệp của bạn vẫn sở hữu dữ liệu nghiệp vụ được nhập vào SmartERP. Bạn chịu trách nhiệm về độ chính xác của dữ liệu import, bút toán kế toán và các quy trình vận hành đã cấu hình.',
            'SmartERP có thể tạm ngưng quyền truy cập để bảo vệ nền tảng hoặc các tenant khác nếu một workspace gây rủi ro đến độ ổn định hoặc an toàn của dịch vụ.',
          ],
        },
        {
          title: 'Thanh toán và hỗ trợ',
          paragraphs: [
            'Gói dùng thử chỉ chuyển sang gói trả phí khi doanh nghiệp của bạn xác nhận rõ ràng. Nâng cấp, gia hạn và hủy dịch vụ được thực hiện theo thỏa thuận thương mại trong quá trình onboarding.',
            'Thời gian phản hồi hỗ trợ phụ thuộc vào gói dịch vụ. Sự cố production và vấn đề bảo mật luôn được ưu tiên hơn các yêu cầu tư vấn.',
          ],
        },
      ],
      secondaryCta: 'Chính sách bảo mật',
      secondaryHref: '/privacy',
      secondaryLabel: 'Xem cách SmartERP xử lý dữ liệu cá nhân và dữ liệu vận hành.',
      primaryCta: 'Dùng thử miễn phí',
      backHome: 'Quay về trang chủ',
    },
    privacy: {
      badge: 'Pháp lý SmartERP',
      title: 'Chính sách bảo mật',
      subtitle:
        'Chính sách này giải thích cách SmartERP xử lý thông tin tài khoản, dữ liệu tenant và dữ liệu vận hành cần thiết để cung cấp dịch vụ.',
      updatedLabel: 'Cập nhật lần cuối: 20/03/2026',
      sections: [
        {
          title: 'Thông tin chúng tôi thu thập',
          paragraphs: [
            'Chúng tôi thu thập những dữ liệu cần thiết để tạo và bảo vệ workspace, như họ tên, email, vai trò, thông tin công ty và các sự kiện xác thực.',
            'Dữ liệu vận hành như đơn hàng, biến động kho, nhật ký kiểm toán và cấu hình hệ thống được lưu để hỗ trợ hoạt động nghiệp vụ và lịch sử truy vết.',
          ],
        },
        {
          title: 'Cách chúng tôi sử dụng dữ liệu',
          paragraphs: [
            'Dữ liệu được dùng để xác thực người dùng, hỗ trợ quy trình nghiệp vụ, xử lý sự cố và nâng cao độ ổn định của sản phẩm. Quyền truy cập nội bộ chỉ dành cho người có nhu cầu vận hành hợp lệ.',
            'SmartERP không bán dữ liệu workspace của khách hàng. Telemetry và chẩn đoán hệ thống chỉ phục vụ mục đích chất lượng sản phẩm và vận hành dịch vụ.',
          ],
        },
        {
          title: 'Lưu trữ và quyền kiểm soát',
          paragraphs: [
            'Dữ liệu workspace được lưu giữ theo gói dịch vụ và nhu cầu vận hành. Yêu cầu export hoặc xóa dữ liệu được xử lý qua quy trình hỗ trợ và quản trị.',
            'Nếu bạn cần cập nhật thông tin tài khoản hoặc trao đổi về thời gian lưu trữ dữ liệu, hãy liên hệ đội ngũ SmartERP qua các kênh onboarding.',
          ],
        },
      ],
      secondaryCta: 'Điều khoản dịch vụ',
      secondaryHref: '/terms',
      secondaryLabel: 'Xem các điều khoản chi phối việc sử dụng workspace SmartERP.',
      primaryCta: 'Tạo workspace',
      backHome: 'Quay về trang chủ',
    },
  },
};

function getPolicyCopy(policy: PolicyType, language?: string): PolicyCopy {
  const locale = language?.startsWith('vi') ? 'vi' : 'en';
  return legalCopy[locale][policy];
}

export default function PublicLegalPage({ policy }: { policy: PolicyType }) {
  const { i18n } = useTranslation();
  const { token } = useToken();
  const navigate = useNavigate();
  const copy = getPolicyCopy(policy, i18n.resolvedLanguage ?? i18n.language);
  const icon = policy === 'terms' ? <FileProtectOutlined /> : <SafetyOutlined />;

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${token.colorPrimaryBg} 0%, ${token.colorBgLayout} 38%)`,
      }}
    >
      <Header
        style={{
          background: 'transparent',
          padding: '24px 32px 0',
          height: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: token.marginMD,
          }}
        >
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: token.marginSM, color: token.colorText }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: token.colorPrimary,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Text strong style={{ color: token.colorWhite, fontSize: 20 }}>
                P
              </Text>
            </div>
            <Text strong style={{ fontSize: 20, color: token.colorText }}>
              SmartERP
            </Text>
          </Link>
          <Space size="middle">
            <LanguageSwitcher />
            <ThemeToggle />
          </Space>
        </div>
      </Header>

      <Content style={{ padding: '24px 24px 64px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Card
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
            }}
          >
            <div
              style={{
                padding: '32px 32px 24px',
                background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
                color: token.colorWhite,
              }}
            >
              <Tag
                variant="filled"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: token.colorWhite,
                  paddingInline: 12,
                  lineHeight: '28px',
                  borderRadius: 999,
                  marginBottom: token.marginMD,
                }}
              >
                {copy.badge}
              </Tag>
              <Space orientation="vertical" size="small" style={{ width: '100%', alignItems: 'flex-start' }}>
                <Space size="small" align="center">
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  <Title level={1} style={{ margin: 0, color: token.colorWhite }}>
                    {copy.title}
                  </Title>
                </Space>
                <Paragraph style={{ margin: 0, fontSize: 17, color: 'rgba(255,255,255,0.88)' }}>
                  {copy.subtitle}
                </Paragraph>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{copy.updatedLabel}</Text>
              </Space>
            </div>

            <div style={{ padding: 32 }}>
              <Row gutter={[24, 24]}>
                {copy.sections.map((section) => (
                  <Col span={24} key={section.title}>
                    <Card
                      variant="outlined"
                      style={{
                        borderRadius: 20,
                        background: token.colorBgContainer,
                      }}
                    >
                      <Title level={3} style={{ marginTop: 0 }}>
                        {section.title}
                      </Title>
                      <Space orientation="vertical" size="middle">
                        {section.paragraphs.map((paragraph) => (
                          <Paragraph key={paragraph} style={{ margin: 0, fontSize: 16 }}>
                            {paragraph}
                          </Paragraph>
                        ))}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
                <Col xs={24} md={14}>
                  <Card
                    style={{
                      borderRadius: 20,
                      background: token.colorBgElevated,
                    }}
                  >
                    <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                      {copy.secondaryCta}
                    </Text>
                    <Paragraph style={{ marginBottom: token.marginLG }}>{copy.secondaryLabel}</Paragraph>
                    <Button type="default" onClick={() => navigate(copy.secondaryHref)}>
                      {copy.secondaryCta}
                    </Button>
                  </Card>
                </Col>
                <Col xs={24} md={10}>
                  <Card
                    style={{
                      borderRadius: 20,
                      background: token.colorPrimaryBg,
                    }}
                  >
                    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                      <Button type="primary" size="large" block onClick={() => navigate('/register')}>
                        {copy.primaryCta}
                      </Button>
                      <Button type="text" block icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
                        {copy.backHome}
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
