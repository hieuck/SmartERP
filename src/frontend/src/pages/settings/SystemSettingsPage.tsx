import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Switch,
  TimePicker,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  SettingOutlined,
  MailOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '@/services/utils/configService';
import dayjs from 'dayjs';
import { logger } from '@/lib/logger/logger.service';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface CompanyFormValues {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxCode?: string;
}

interface CodeFormValues {
  productPrefix?: string;
  customerPrefix?: string;
  supplierPrefix?: string;
  salesOrderPrefix?: string;
  purchaseOrderPrefix?: string;
  receiptPrefix?: string;
  issuePrefix?: string;
}

interface GeneralFormValues {
  defaultTaxRate: number;
  currency: string;
  timezone: string;
  language: string;
  dateFormat: string;
}

interface EmailFormValues {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  password: string;
  from: string;
}

interface BackupFormValues {
  enabled?: boolean;
  frequency: string;
  time: any;
  retention: number;
}

const SystemSettingsPage: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [companyForm] = Form.useForm<CompanyFormValues>();
  const [codeForm] = Form.useForm<CodeFormValues>();
  const [generalForm] = Form.useForm<GeneralFormValues>();
  const [emailForm] = Form.useForm<EmailFormValues>();
  const [backupForm] = Form.useForm<BackupFormValues>();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    loadAllConfigs();
  }, []);

  const loadAllConfigs = async () => {
    setLoading(true);
    try {
      const [company, codes, general, email, backup] = await Promise.all([
        configService.getCompanyInfo(),
        configService.getCodeFormats(),
        configService.getGeneralConfig(),
        configService.getEmailConfig(),
        configService.getBackupConfig(),
      ]);

      if (company) (companyForm as any).setFieldsValue(company);
      if (codes) (codeForm as any).setFieldsValue(codes);
      if (general) (generalForm as any).setFieldsValue(general);
      if (email) (emailForm as any).setFieldsValue(email);
      if (backup) {
        (backupForm as any).setFieldsValue({
          ...backup,
          time: backup.time ? dayjs(backup.time, 'HH:mm') : null,
        });
      }
    } catch (error) {
      logger.error('SystemSettingsPage', 'Failed to load configurations', error as Error);
      message.error(t('company.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompanyInfo = async () => {
    setSaving(true);
    try {
      const values = await (companyForm as any).validateFields();
      await configService.updateCompanyInfo(values);
      message.success(t('company.messages.saveSuccess'));
    } catch (error) {
      message.error(t('company.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCodeFormats = async () => {
    setSaving(true);
    try {
      const values = await (codeForm as any).validateFields();
      await configService.updateCodeFormats(values);
      message.success(t('codes.messages.saveSuccess'));
    } catch (error) {
      message.error(t('codes.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneralConfig = async () => {
    setSaving(true);
    try {
      const values = await (generalForm as any).validateFields();
      await configService.updateGeneralConfig(values);
      message.success(t('general.messages.saveSuccess'));
    } catch (error) {
      message.error(t('general.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailConfig = async () => {
    setSaving(true);
    try {
      const values = await (emailForm as any).validateFields();
      await configService.updateEmailConfig(values);
      message.success(t('email.messages.saveSuccess'));
    } catch (error) {
      message.error(t('email.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmailConnection = async () => {
    setTestingEmail(true);
    try {
      const values = await (emailForm as any).validateFields();
      const result = await configService.testEmailConnection(values);
      if (result.success) {
        message.success(t('email.messages.testSuccess'));
      } else {
        message.error(t('email.messages.testError', { message: result.message }));
      }
    } catch (error) {
      message.error(t('email.messages.testError', { message: 'Unknown error' }));
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSaveBackupConfig = async () => {
    setSaving(true);
    try {
      const values = await (backupForm as any).validateFields();
      const backupData = {
        ...values,
        time: values.time ? values.time.format('HH:mm') : '00:00',
      };
      await configService.updateBackupConfig(backupData);
      message.success(t('backup.messages.saveSuccess'));
    } catch (error) {
      message.error(t('backup.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <SettingOutlined /> {t('systemSettings.title')}
        </Title>
        <Paragraph type="secondary">{t('systemSettings.description')}</Paragraph>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Company Information Tab */}
          <TabPane tab={t('company.tab')} key="company">
            <Form form={companyForm} layout="vertical">
              <Form.Item
                name="name"
                label={t('company.name')}
                rules={[{ required: true, message: t('company.nameRequired') }]}
              >
                <Input placeholder={t('company.namePlaceholder')} />
              </Form.Item>

              <Form.Item
                name="address"
                label={t('company.address')}
                rules={[{ required: true, message: t('company.addressRequired') }]}
              >
                <TextArea rows={3} placeholder={t('company.addressPlaceholder')} />
              </Form.Item>

              <Form.Item
                name="phone"
                label={t('company.phone')}
                rules={[{ required: true, message: t('company.phoneRequired') }]}
              >
                <Input placeholder={t('company.phonePlaceholder')} />
              </Form.Item>

              <Form.Item
                name="email"
                label={t('company.email')}
                rules={[
                  { required: true, message: t('company.emailRequired') },
                  { type: 'email', message: t('company.emailInvalid') },
                ]}
              >
                <Input placeholder={t('company.emailPlaceholder')} />
              </Form.Item>

              <Form.Item name="taxCode" label={t('company.taxCode')}>
                <Input placeholder={t('company.taxCodePlaceholder')} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveCompanyInfo}
                  loading={saving}
                >
                  {t('company.saveButton')}
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Code Formats Tab */}
          <TabPane tab={t('codes.tab')} key="codes">
            <Alert
              message={t('codes.alertTitle')}
              description={t('codes.alertDescription')}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form form={codeForm} layout="vertical">
              <Form.Item name="productPrefix" label={t('codes.productPrefix')}>
                <Input placeholder={t('codes.productPrefixPlaceholder')} />
              </Form.Item>

              <Form.Item name="customerPrefix" label={t('codes.customerPrefix')}>
                <Input placeholder={t('codes.customerPrefixPlaceholder')} />
              </Form.Item>

              <Form.Item name="supplierPrefix" label={t('codes.supplierPrefix')}>
                <Input placeholder={t('codes.supplierPrefixPlaceholder')} />
              </Form.Item>

              <Form.Item name="salesOrderPrefix" label={t('codes.salesOrderPrefix')}>
                <Input placeholder={t('codes.salesOrderPrefixPlaceholder')} />
              </Form.Item>

              <Form.Item name="purchaseOrderPrefix" label={t('codes.purchaseOrderPrefix')}>
                <Input placeholder={t('codes.purchaseOrderPrefixPlaceholder')} />
              </Form.Item>

              <Form.Item name="receiptPrefix" label={t('codes.receiptPrefix')}>
                <Input placeholder={t('codes.receiptPrefixPlaceholder')} />
              </Form.Item>

              <Form.Item name="issuePrefix" label={t('codes.issuePrefix')}>
                <Input placeholder={t('codes.issuePrefixPlaceholder')} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveCodeFormats}
                  loading={saving}
                >
                  {t('codes.saveButton')}
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* General Configuration Tab */}
          <TabPane tab={t('general.tab')} key="general">
            <Form form={generalForm} layout="vertical">
              <Form.Item
                name="defaultTaxRate"
                label={t('general.defaultTaxRate')}
                rules={[{ required: true, message: t('general.defaultTaxRateRequired') }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="currency"
                label={t('general.currency')}
                rules={[{ required: true, message: t('general.currencyRequired') }]}
              >
                <Select>
                  <Option value="VND">{t('general.currencyVND')}</Option>
                  <Option value="USD">{t('general.currencyUSD')}</Option>
                  <Option value="EUR">{t('general.currencyEUR')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="timezone"
                label={t('general.timezone')}
                rules={[{ required: true, message: t('general.timezoneRequired') }]}
              >
                <Select>
                  <Option value="Asia/Ho_Chi_Minh">{t('general.timezoneHCM')}</Option>
                  <Option value="Asia/Bangkok">{t('general.timezoneBangkok')}</Option>
                  <Option value="Asia/Singapore">{t('general.timezoneSingapore')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="language"
                label={t('general.language')}
                rules={[{ required: true, message: t('general.languageRequired') }]}
              >
                <Select>
                  <Option value="vi">{t('general.languageVi')}</Option>
                  <Option value="en">{t('general.languageEn')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="dateFormat"
                label={t('general.dateFormat')}
                rules={[{ required: true, message: t('general.dateFormatRequired') }]}
              >
                <Select>
                  <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                  <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                  <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveGeneralConfig}
                  loading={saving}
                >
                  {t('general.saveButton')}
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Email Configuration Tab */}
          <TabPane
            tab={
              <span>
                <MailOutlined /> {t('email.tab')}
              </span>
            }
            key="email"
          >
            <Alert
              message={t('email.alertTitle')}
              description={t('email.alertDescription')}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form form={emailForm} layout="vertical">
              <Form.Item
                name="host"
                label={t('email.host')}
                rules={[{ required: true, message: t('email.hostRequired') }]}
              >
                <Input placeholder={t('email.hostPlaceholder')} />
              </Form.Item>

              <Form.Item
                name="port"
                label={t('email.port')}
                rules={[{ required: true, message: t('email.portRequired') }]}
              >
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="secure" label={t('email.secure')} valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item
                name="user"
                label={t('email.user')}
                rules={[{ required: true, message: t('email.userRequired') }]}
              >
                <Input placeholder={t('email.userPlaceholder')} />
              </Form.Item>

              <Form.Item
                name="password"
                label={t('email.password')}
                rules={[{ required: true, message: t('email.passwordRequired') }]}
              >
                <Input.Password placeholder={t('email.passwordPlaceholder')} />
              </Form.Item>

              <Form.Item
                name="from"
                label={t('email.from')}
                rules={[
                  { required: true, message: t('email.fromRequired') },
                  { type: 'email', message: t('email.fromInvalid') },
                ]}
              >
                <Input placeholder={t('email.fromPlaceholder')} />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveEmailConfig}
                    loading={saving}
                  >
                    {t('email.saveButton')}
                  </Button>
                  <Button
                    icon={<CheckCircleOutlined />}
                    onClick={handleTestEmailConnection}
                    loading={testingEmail}
                  >
                    {t('email.testButton')}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Backup Configuration Tab */}
          <TabPane
            tab={
              <span>
                <DatabaseOutlined /> {t('backup.tab')}
              </span>
            }
            key="backup"
          >
            <Alert
              message={t('backup.alertTitle')}
              description={t('backup.alertDescription')}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form form={backupForm} layout="vertical">
              <Form.Item name="enabled" label={t('backup.enabled')} valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item
                name="frequency"
                label={t('backup.frequency')}
                rules={[{ required: true, message: t('backup.frequencyRequired') }]}
              >
                <Select>
                  <Option value="daily">{t('backup.frequencyDaily')}</Option>
                  <Option value="weekly">{t('backup.frequencyWeekly')}</Option>
                  <Option value="monthly">{t('backup.frequencyMonthly')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="time"
                label={t('backup.time')}
                rules={[{ required: true, message: t('backup.timeRequired') }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="retention"
                label={t('backup.retention')}
                rules={[{ required: true, message: t('backup.retentionRequired') }]}
              >
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveBackupConfig}
                  loading={saving}
                >
                  {t('backup.saveButton')}
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SystemSettingsPage;
