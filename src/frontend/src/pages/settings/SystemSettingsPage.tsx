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
  Upload,
  Switch,
  TimePicker,
  Divider,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  SettingOutlined,
  MailOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import configService, {
  CompanyInfo,
  CodeFormats,
  GeneralConfig,
  EmailConfig,
  BackupConfig,
} from '../../services/utils/configService';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const SystemSettingsPage: React.FC = () => {
  const [companyForm] = Form.useForm();
  const [codeForm] = Form.useForm();
  const [generalForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [backupForm] = Form.useForm();

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

      companyForm.setFieldsValue(company);
      codeForm.setFieldsValue(codes);
      generalForm.setFieldsValue(general);
      emailForm.setFieldsValue(email);
      backupForm.setFieldsValue({
        ...backup,
        time: backup.time ? dayjs(backup.time, 'HH:mm') : null,
      });
    } catch (error) {
      console.error('Failed to load configurations:', error);
      message.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompanyInfo = async () => {
    setSaving(true);
    try {
      const values = await companyForm.validateFields();
      await configService.updateCompanyInfo(values);
      message.success('Company information saved successfully');
    } catch (error) {
      message.error('Failed to save company information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCodeFormats = async () => {
    setSaving(true);
    try {
      const values = await codeForm.validateFields();
      await configService.updateCodeFormats(values);
      message.success('Code formats saved successfully');
    } catch (error) {
      message.error('Failed to save code formats');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneralConfig = async () => {
    setSaving(true);
    try {
      const values = await generalForm.validateFields();
      await configService.updateGeneralConfig(values);
      message.success('General configuration saved successfully');
    } catch (error) {
      message.error('Failed to save general configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailConfig = async () => {
    setSaving(true);
    try {
      const values = await emailForm.validateFields();
      await configService.updateEmailConfig(values);
      message.success('Email configuration saved successfully');
    } catch (error) {
      message.error('Failed to save email configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmailConnection = async () => {
    setTestingEmail(true);
    try {
      const values = await emailForm.validateFields();
      const result = await configService.testEmailConnection(values);
      if (result.success) {
        message.success('Email connection successful!');
      } else {
        message.error(`Email connection failed: ${result.message}`);
      }
    } catch (error) {
      message.error('Failed to test email connection');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSaveBackupConfig = async () => {
    setSaving(true);
    try {
      const values = await backupForm.validateFields();
      const backupData = {
        ...values,
        time: values.time ? values.time.format('HH:mm') : '00:00',
      };
      await configService.updateBackupConfig(backupData);
      message.success('Backup configuration saved successfully');
    } catch (error) {
      message.error('Failed to save backup configuration');
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
          <SettingOutlined /> System Settings
        </Title>
        <Paragraph type="secondary">Configure system-wide settings and preferences</Paragraph>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Company Information Tab */}
          <TabPane tab="Company Info" key="company">
            <Form form={companyForm} layout="vertical">
              <Form.Item
                name="name"
                label="Company Name"
                rules={[{ required: true, message: 'Please enter company name' }]}
              >
                <Input placeholder="Enter company name" />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true, message: 'Please enter address' }]}
              >
                <TextArea rows={3} placeholder="Enter company address" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>

              <Form.Item name="taxCode" label="Tax Code">
                <Input placeholder="Enter tax code" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveCompanyInfo}
                  loading={saving}
                >
                  Save Company Info
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Code Formats Tab */}
          <TabPane tab="Code Formats" key="codes">
            <Alert
              message="Auto-generated Code Prefixes"
              description="Configure prefixes for automatically generated codes"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form form={codeForm} layout="vertical">
              <Form.Item name="productPrefix" label="Product Code Prefix">
                <Input placeholder="e.g., PRD" />
              </Form.Item>

              <Form.Item name="customerPrefix" label="Customer Code Prefix">
                <Input placeholder="e.g., CUS" />
              </Form.Item>

              <Form.Item name="supplierPrefix" label="Supplier Code Prefix">
                <Input placeholder="e.g., SUP" />
              </Form.Item>

              <Form.Item name="salesOrderPrefix" label="Sales Order Prefix">
                <Input placeholder="e.g., SO" />
              </Form.Item>

              <Form.Item name="purchaseOrderPrefix" label="Purchase Order Prefix">
                <Input placeholder="e.g., PO" />
              </Form.Item>

              <Form.Item name="receiptPrefix" label="Receipt Prefix">
                <Input placeholder="e.g., RCP" />
              </Form.Item>

              <Form.Item name="issuePrefix" label="Issue Prefix">
                <Input placeholder="e.g., ISS" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveCodeFormats}
                  loading={saving}
                >
                  Save Code Formats
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* General Configuration Tab */}
          <TabPane tab="General" key="general">
            <Form form={generalForm} layout="vertical">
              <Form.Item
                name="defaultTaxRate"
                label="Default Tax Rate (%)"
                rules={[{ required: true, message: 'Please enter tax rate' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: 'Please select currency' }]}
              >
                <Select>
                  <Option value="VND">Vietnamese Dong (VND)</Option>
                  <Option value="USD">US Dollar (USD)</Option>
                  <Option value="EUR">Euro (EUR)</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="timezone"
                label="Timezone"
                rules={[{ required: true, message: 'Please select timezone' }]}
              >
                <Select>
                  <Option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</Option>
                  <Option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</Option>
                  <Option value="Asia/Singapore">Asia/Singapore (GMT+8)</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="language"
                label="Language"
                rules={[{ required: true, message: 'Please select language' }]}
              >
                <Select>
                  <Option value="vi">Tiếng Việt</Option>
                  <Option value="en">English</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="dateFormat"
                label="Date Format"
                rules={[{ required: true, message: 'Please select date format' }]}
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
                  Save General Config
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Email Configuration Tab */}
          <TabPane
            tab={
              <span>
                <MailOutlined /> Email
              </span>
            }
            key="email"
          >
            <Alert
              message="Email Server Configuration"
              description="Configure SMTP settings for sending email notifications"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form form={emailForm} layout="vertical">
              <Form.Item
                name="host"
                label="SMTP Host"
                rules={[{ required: true, message: 'Please enter SMTP host' }]}
              >
                <Input placeholder="e.g., smtp.gmail.com" />
              </Form.Item>

              <Form.Item
                name="port"
                label="SMTP Port"
                rules={[{ required: true, message: 'Please enter SMTP port' }]}
              >
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="secure" label="Use SSL/TLS" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item
                name="user"
                label="Username"
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input placeholder="Enter SMTP username" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter password' }]}
              >
                <Input.Password placeholder="Enter SMTP password" />
              </Form.Item>

              <Form.Item
                name="from"
                label="From Email"
                rules={[
                  { required: true, message: 'Please enter from email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input placeholder="e.g., noreply@company.com" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveEmailConfig}
                    loading={saving}
                  >
                    Save Email Config
                  </Button>
                  <Button
                    icon={<CheckCircleOutlined />}
                    onClick={handleTestEmailConnection}
                    loading={testingEmail}
                  >
                    Test Connection
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Backup Configuration Tab */}
          <TabPane
            tab={
              <span>
                <DatabaseOutlined /> Backup
              </span>
            }
            key="backup"
          >
            <Alert
              message="Automatic Backup Configuration"
              description="Configure automatic database backup schedule"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form form={backupForm} layout="vertical">
              <Form.Item name="enabled" label="Enable Automatic Backup" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item
                name="frequency"
                label="Backup Frequency"
                rules={[{ required: true, message: 'Please select frequency' }]}
              >
                <Select>
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="time"
                label="Backup Time"
                rules={[{ required: true, message: 'Please select time' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="retention"
                label="Retention Period (days)"
                rules={[{ required: true, message: 'Please enter retention period' }]}
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
                  Save Backup Config
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
