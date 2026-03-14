import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Switch, message, Tabs, Space, Upload, Divider } from 'antd';
import { SaveOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { loadPrintConfig, clearConfigCache, PrintConfig } from '@/utils/printConfig';

const { TabPane } = Tabs;

export default function PrintSettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<PrintConfig | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await loadPrintConfig();
      setConfig(cfg);
      form.setFieldsValue(cfg);
    } catch (error) {
      message.error('Không thể tải cấu hình in');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // Save to localStorage (simple approach)
      localStorage.setItem('printConfig', JSON.stringify(values));
      clearConfigCache();
      message.success('Đã lưu cấu hình in!');

      // Reload config
      await loadConfig();
    } catch (error) {
      message.error('Không thể lưu cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('printConfig');
    clearConfigCache();
    loadConfig();
    message.success('Đã khôi phục cấu hình mặc định');
  };

  const handleLogoUpload = (info: any) => {
    if (info.file.status === 'done') {
      const reader = new FileReader();
      reader.onload = (e) => {
        form.setFieldValue(['company', 'logo'], e.target?.result);
        message.success('Đã tải logo lên');
      };
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  return (
    <div>
      <Card
        title="Cài Đặt Mẫu In"
        bordered={false}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Khôi phục mặc định
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={loading}
            >
              Lưu cấu hình
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
          <Tabs defaultActiveKey="company">
            <TabPane tab="Thông Tin Công Ty" key="company">
              <Form.Item
                name={['company', 'name']}
                label="Tên Công Ty"
                rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
              >
                <Input placeholder="VD: CÔNG TY TNHH ABC" />
              </Form.Item>

              <Form.Item
                name={['company', 'address']}
                label="Địa Chỉ"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
              >
                <Input placeholder="VD: 123 Đường ABC, Quận XYZ, TP.HCM" />
              </Form.Item>

              <Form.Item
                name={['company', 'phone']}
                label="Số Điện Thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="VD: (028) 1234 5678" />
              </Form.Item>

              <Form.Item
                name={['company', 'taxCode']}
                label="Mã Số Thuế"
                rules={[{ required: true, message: 'Vui lòng nhập mã số thuế' }]}
              >
                <Input placeholder="VD: 0123456789" />
              </Form.Item>

              <Form.Item
                name={['company', 'logo']}
                label="Logo Công Ty"
                extra="Tải lên file ảnh logo (PNG, JPG). Logo sẽ hiển thị ở đầu phiếu in."
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Base64 hoặc URL của logo"
                  style={{ fontFamily: 'monospace', fontSize: '11px' }}
                />
              </Form.Item>

              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={({ file, onSuccess }: any) => {
                  setTimeout(() => onSuccess('ok'), 0);
                }}
                onChange={handleLogoUpload}
              >
                <Button icon={<UploadOutlined />}>Tải Logo Lên</Button>
              </Upload>
            </TabPane>

            <TabPane tab="Phiếu Nhập Kho" key="stockReceipt">
              <Form.Item name={['templates', 'stockReceipt', 'title']} label="Tiêu Đề Phiếu">
                <Input placeholder="VD: PHIẾU NHẬP KHO" />
              </Form.Item>

              <Form.Item
                name={['templates', 'stockReceipt', 'showLogo']}
                label="Hiển thị Logo"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name={['templates', 'stockReceipt', 'showCompanyInfo']}
                label="Hiển thị Thông Tin Công Ty"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name={['templates', 'stockReceipt', 'showNotes']}
                label="Hiển thị Ghi Chú"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name={['templates', 'stockReceipt', 'showSignatures']}
                label="Hiển thị Chữ Ký"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Divider>Chữ Ký</Divider>

              <Form.Item name={['templates', 'stockReceipt', 'signatures', 0]} label="Chữ Ký 1">
                <Input placeholder="VD: Người lập phiếu" />
              </Form.Item>

              <Form.Item name={['templates', 'stockReceipt', 'signatures', 1]} label="Chữ Ký 2">
                <Input placeholder="VD: Thủ kho" />
              </Form.Item>

              <Form.Item name={['templates', 'stockReceipt', 'signatures', 2]} label="Chữ Ký 3">
                <Input placeholder="VD: Giám đốc" />
              </Form.Item>
            </TabPane>

            <TabPane tab="Phiếu Xuất Kho" key="stockIssue">
              <Form.Item name={['templates', 'stockIssue', 'title']} label="Tiêu Đề Phiếu">
                <Input placeholder="VD: PHIẾU XUẤT KHO" />
              </Form.Item>

              <Form.Item
                name={['templates', 'stockIssue', 'showLogo']}
                label="Hiển thị Logo"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name={['templates', 'stockIssue', 'showCompanyInfo']}
                label="Hiển thị Thông Tin Công Ty"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name={['templates', 'stockIssue', 'showNotes']}
                label="Hiển thị Ghi Chú"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name={['templates', 'stockIssue', 'showSignatures']}
                label="Hiển thị Chữ Ký"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Divider>Chữ Ký</Divider>

              <Form.Item name={['templates', 'stockIssue', 'signatures', 0]} label="Chữ Ký 1">
                <Input placeholder="VD: Người lập phiếu" />
              </Form.Item>

              <Form.Item name={['templates', 'stockIssue', 'signatures', 1]} label="Chữ Ký 2">
                <Input placeholder="VD: Thủ kho" />
              </Form.Item>

              <Form.Item name={['templates', 'stockIssue', 'signatures', 2]} label="Chữ Ký 3">
                <Input placeholder="VD: Giám đốc" />
              </Form.Item>
            </TabPane>

            <TabPane tab="Đơn Hàng & Hóa Đơn" key="orders">
              <h3>Đơn Hàng Bán</h3>
              <Form.Item name={['templates', 'salesOrder', 'title']} label="Tiêu Đề">
                <Input placeholder="VD: ĐƠN HÀNG BÁN" />
              </Form.Item>

              <Form.Item
                name={['templates', 'salesOrder', 'showCustomerInfo']}
                label="Hiển thị Thông Tin Khách Hàng"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Divider />

              <h3>Hóa Đơn</h3>
              <Form.Item name={['templates', 'invoice', 'title']} label="Tiêu Đề">
                <Input placeholder="VD: HÓA ĐƠN BÁN HÀNG" />
              </Form.Item>

              <Form.Item
                name={['templates', 'invoice', 'showTax']}
                label="Hiển thị Thuế"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item name={['templates', 'invoice', 'taxRate']} label="Thuế Suất (%)">
                <Input type="number" placeholder="VD: 10" />
              </Form.Item>

              <Form.Item
                name={['templates', 'invoice', 'showAmountInWords']}
                label="Hiển thị Số Tiền Bằng Chữ"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </TabPane>

            <TabPane tab="Kiểu Chữ & Màu Sắc" key="styles">
              <Form.Item name={['styles', 'fontFamily']} label="Font Chữ">
                <Input placeholder="VD: Arial, sans-serif" />
              </Form.Item>

              <Form.Item name={['styles', 'fontSize']} label="Cỡ Chữ Nội Dung">
                <Input placeholder="VD: 12pt" />
              </Form.Item>

              <Form.Item name={['styles', 'headerFontSize']} label="Cỡ Chữ Tiêu Đề">
                <Input placeholder="VD: 18pt" />
              </Form.Item>

              <Form.Item name={['styles', 'companyFontSize']} label="Cỡ Chữ Tên Công Ty">
                <Input placeholder="VD: 16pt" />
              </Form.Item>

              <Form.Item name={['styles', 'lineHeight']} label="Khoảng Cách Dòng">
                <Input placeholder="VD: 1.6" />
              </Form.Item>

              <Form.Item name={['styles', 'padding']} label="Lề Trang">
                <Input placeholder="VD: 20mm" />
              </Form.Item>
            </TabPane>
          </Tabs>
        </Form>
      </Card>
    </div>
  );
}
