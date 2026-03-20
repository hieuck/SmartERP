import { useState, useEffect } from 'react';
import { App, Card, Form, Input, Button, Switch, Tabs, Space, Upload, Divider } from 'antd';
import { SaveOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload';
import { useTranslation } from 'react-i18next';
import { loadPrintConfig, clearConfigCache, PrintConfig } from '@/utils/printConfig';

export default function PrintSettings() {
  const { message } = App.useApp();
  const { t } = useTranslation(['settings', 'common']);
  const [form] = Form.useForm<PrintConfig>();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<PrintConfig | null>(null);

  useEffect(() => {
    loadConfigData();
  }, []);

  const loadConfigData = async () => {
    setLoading(true);
    try {
      const cfg = await loadPrintConfig();
      setConfig(cfg);
      form.setFieldsValue(cfg);
    } catch {
      message.error(t('print.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: PrintConfig) => {
    setLoading(true);
    try {
      localStorage.setItem('printConfig', JSON.stringify(values));
      clearConfigCache();
      message.success(t('print.messages.saveSuccess'));
      await loadConfigData();
    } catch {
      message.error(t('print.messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('printConfig');
    clearConfigCache();
    loadConfigData();
    message.success(t('print.messages.resetSuccess'));
  };

  const handleLogoUpload = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'done') {
      const uploadedFile = info.file.originFileObj;
      if (!uploadedFile) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const currentValues = form.getFieldsValue();
        form.setFieldsValue({
          ...currentValues,
          company: {
            ...currentValues.company,
            logo: e.target?.result as string,
          },
        });
        message.success(t('print.messages.logoUploadSuccess'));
      };
      reader.readAsDataURL(uploadedFile);
    }
  };

  const handleCustomUpload: UploadProps['customRequest'] = ({ onSuccess }) => {
    setTimeout(() => onSuccess?.('ok'), 0);
  };

  const tabItems = [
    {
      key: 'company',
      label: t('print.tabs.companyInfo'),
      children: (
        <>
          <Form.Item
            name={['company', 'name']}
            label={t('print.company.name')}
            rules={[{ required: true, message: t('print.company.nameRequired') }]}
          >
            <Input placeholder={t('print.company.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            name={['company', 'address']}
            label={t('print.company.address')}
            rules={[{ required: true, message: t('print.company.addressRequired') }]}
          >
            <Input placeholder={t('print.company.addressPlaceholder')} />
          </Form.Item>

          <Form.Item
            name={['company', 'phone']}
            label={t('print.company.phone')}
            rules={[{ required: true, message: t('print.company.phoneRequired') }]}
          >
            <Input placeholder={t('print.company.phonePlaceholder')} />
          </Form.Item>

          <Form.Item
            name={['company', 'taxCode']}
            label={t('print.company.taxCode')}
            rules={[{ required: true, message: t('print.company.taxCodeRequired') }]}
          >
            <Input placeholder={t('print.company.taxCodePlaceholder')} />
          </Form.Item>

          <Form.Item
            name={['company', 'logo']}
            label={t('print.company.logo')}
            extra={t('print.company.logoExtra')}
          >
            <Input.TextArea
              rows={3}
              placeholder={t('print.company.logoPlaceholder')}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </Form.Item>

          <Upload
            accept="image/*"
            showUploadList={false}
            customRequest={handleCustomUpload}
            onChange={handleLogoUpload}
          >
            <Button icon={<UploadOutlined />}>{t('print.company.uploadLogo')}</Button>
          </Upload>
        </>
      ),
    },
    {
      key: 'stockReceipt',
      label: t('print.tabs.stockReceipt'),
      children: (
        <>
          <Form.Item name={['templates', 'stockReceipt', 'title']} label={t('print.stockReceipt.title')}>
            <Input placeholder={t('print.stockReceipt.titlePlaceholder')} />
          </Form.Item>

          <Form.Item
            name={['templates', 'stockReceipt', 'showLogo']}
            label={t('print.stockReceipt.showLogo')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['templates', 'stockReceipt', 'showCompanyInfo']}
            label={t('print.stockReceipt.showCompanyInfo')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['templates', 'stockReceipt', 'showNotes']}
            label={t('print.stockReceipt.showNotes')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['templates', 'stockReceipt', 'showSignatures']}
            label={t('print.stockReceipt.showSignatures')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider>{t('print.stockReceipt.signatures')}</Divider>

          <Form.Item name={['templates', 'stockReceipt', 'signatures', 0]} label={t('print.stockReceipt.signature1')}>
            <Input placeholder={t('print.stockReceipt.signature1Placeholder')} />
          </Form.Item>

          <Form.Item name={['templates', 'stockReceipt', 'signatures', 1]} label={t('print.stockReceipt.signature2')}>
            <Input placeholder={t('print.stockReceipt.signature2Placeholder')} />
          </Form.Item>

          <Form.Item name={['templates', 'stockReceipt', 'signatures', 2]} label={t('print.stockReceipt.signature3')}>
            <Input placeholder={t('print.stockReceipt.signature3Placeholder')} />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'stockIssue',
      label: t('print.tabs.stockIssue'),
      children: (
        <>
          <Form.Item name={['templates', 'stockIssue', 'title']} label={t('print.stockIssue.title')}>
            <Input placeholder={t('print.stockIssue.titlePlaceholder')} />
          </Form.Item>

          <Form.Item
            name={['templates', 'stockIssue', 'showLogo']}
            label={t('print.stockIssue.showLogo')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['templates', 'stockIssue', 'showCompanyInfo']}
            label={t('print.stockIssue.showCompanyInfo')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['templates', 'stockIssue', 'showNotes']}
            label={t('print.stockIssue.showNotes')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['templates', 'stockIssue', 'showSignatures']}
            label={t('print.stockIssue.showSignatures')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider>{t('print.stockIssue.signatures')}</Divider>

          <Form.Item name={['templates', 'stockIssue', 'signatures', 0]} label={t('print.stockIssue.signature1')}>
            <Input placeholder={t('print.stockIssue.signature1Placeholder')} />
          </Form.Item>

          <Form.Item name={['templates', 'stockIssue', 'signatures', 1]} label={t('print.stockIssue.signature2')}>
            <Input placeholder={t('print.stockIssue.signature2Placeholder')} />
          </Form.Item>

          <Form.Item name={['templates', 'stockIssue', 'signatures', 2]} label={t('print.stockIssue.signature3')}>
            <Input placeholder={t('print.stockIssue.signature3Placeholder')} />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'orders',
      label: t('print.tabs.ordersInvoices'),
      children: (
        <>
          <h3>{t('print.orders.salesOrderTitle')}</h3>
          <Form.Item name={['templates', 'salesOrder', 'title']} label={t('print.orders.title')}>
            <Input placeholder={t('print.orders.salesOrderPlaceholder')} />
          </Form.Item>

          <Form.Item
            name={['templates', 'salesOrder', 'showCustomerInfo']}
            label={t('print.orders.showCustomerInfo')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />

          <h3>{t('print.orders.invoiceTitle')}</h3>
          <Form.Item name={['templates', 'invoice', 'title']} label={t('print.orders.title')}>
            <Input placeholder={t('print.orders.invoicePlaceholder')} />
          </Form.Item>

          <Form.Item
            name={['templates', 'invoice', 'showTax']}
            label={t('print.orders.showTax')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item name={['templates', 'invoice', 'taxRate']} label={t('print.orders.taxRate')}>
            <Input type="number" placeholder={t('print.orders.taxRatePlaceholder')} />
          </Form.Item>

          <Form.Item
            name={['templates', 'invoice', 'showAmountInWords']}
            label={t('print.orders.showAmountInWords')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'styles',
      label: t('print.tabs.styles'),
      children: (
        <>
          <Form.Item name={['styles', 'fontFamily']} label={t('print.styles.fontFamily')}>
            <Input placeholder={t('print.styles.fontFamilyPlaceholder')} />
          </Form.Item>

          <Form.Item name={['styles', 'fontSize']} label={t('print.styles.fontSize')}>
            <Input placeholder={t('print.styles.fontSizePlaceholder')} />
          </Form.Item>

          <Form.Item name={['styles', 'headerFontSize']} label={t('print.styles.headerFontSize')}>
            <Input placeholder={t('print.styles.headerFontSizePlaceholder')} />
          </Form.Item>

          <Form.Item name={['styles', 'companyFontSize']} label={t('print.styles.companyFontSize')}>
            <Input placeholder={t('print.styles.companyFontSizePlaceholder')} />
          </Form.Item>

          <Form.Item name={['styles', 'lineHeight']} label={t('print.styles.lineHeight')}>
            <Input placeholder={t('print.styles.lineHeightPlaceholder')} />
          </Form.Item>

          <Form.Item name={['styles', 'padding']} label={t('print.styles.padding')}>
            <Input placeholder={t('print.styles.paddingPlaceholder')} />
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={t('print.title')}
        variant="borderless"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              {t('print.actions.resetDefault')}
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={loading}
            >
              {t('print.actions.saveConfig')}
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={config || undefined}
        >
          <Tabs defaultActiveKey="company" items={tabItems} />
        </Form>
      </Card>
    </div>
  );
}
