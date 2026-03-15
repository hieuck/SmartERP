import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
} from 'antd';
import { useState } from 'react';
import {
  useCreateSetting,
  useDeleteSetting,
  useSettingsByCategory,
  useUpdateSetting,
} from '@/hooks/useSettings';
import { Setting, SettingCategory, SettingDataType } from '@/services/utils/settingsService';

const { TabPane } = Tabs;
const { TextArea } = Input;

const categoryLabels: Record<SettingCategory, string> = {
  [SettingCategory.GENERAL]: 'Chung',
  [SettingCategory.NOTIFICATION]: 'Thông báo',
  [SettingCategory.SECURITY]: 'Bảo mật',
  [SettingCategory.PAYMENT]: 'Thanh toán',
  [SettingCategory.SHIPPING]: 'Vận chuyển',
  [SettingCategory.TAX]: 'Thuế',
  [SettingCategory.EMAIL]: 'Email',
  [SettingCategory.INTEGRATION]: 'Tích hợp',
};

const typeLabels: Record<SettingDataType, string> = {
  [SettingDataType.STRING]: 'Chuỗi',
  [SettingDataType.NUMBER]: 'Số',
  [SettingDataType.BOOLEAN]: 'Đúng/Sai',
  [SettingDataType.JSON]: 'JSON',
};

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<SettingCategory>(SettingCategory.GENERAL);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [form] = Form.useForm();

  // Hooks for settings operations
  const { data: settings = [], isLoading } = useSettingsByCategory(activeCategory);
  const createMutation = useCreateSetting();
  const updateMutation = useUpdateSetting();
  const deleteMutation = useDeleteSetting();

  const handleSave = async (values: any) => {
    try {
      if (editingSetting) {
        await updateMutation.mutateAsync({
          key: editingSetting.key,
          data: {
            value: values.value,
            description: values.description,
            isPublic: values.isPublic,
          },
        });
        message.success('Cập nhật cài đặt thành công');
      } else {
        await createMutation.mutateAsync({
          key: values.key,
          value: values.value,
          type: values.type,
          category: activeCategory,
          description: values.description,
          isPublic: values.isPublic,
        });
        message.success('Tạo cài đặt thành công');
      }
      setModalVisible(false);
      setEditingSetting(null);
      form.resetFields();
    } catch (error: any) {
      message.error('Không thể lưu cài đặt: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteMutation.mutateAsync({
        key,
        category: activeCategory,
      });
      message.success('Xóa cài đặt thành công');
    } catch (error: any) {
      message.error('Không thể xóa cài đặt: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleEdit = (setting: Setting) => {
    setEditingSetting(setting);
    form.setFieldsValue({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      description: setting.description,
      isPublic: setting.isPublic,
    });
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingSetting(null);
    form.resetFields();
    form.setFieldsValue({
      dataType: SettingDataType.STRING,
      isPublic: false,
    });
    setModalVisible(true);
  };

  const renderValue = (value: string, type: SettingDataType) => {
    if (type === SettingDataType.BOOLEAN) {
      return value === 'true' ? 'Có' : 'Không';
    }
    if (type === SettingDataType.JSON) {
      try {
        return <pre style={{ margin: 0 }}>{JSON.stringify(JSON.parse(value), null, 2)}</pre>;
      } catch {
        return value;
      }
    }
    return value;
  };

  const columns = [
    {
      title: 'Khóa',
      dataIndex: 'key',
      key: 'key',
      width: 200,
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
      render: (value: string, record: Setting) => renderValue(value, record.type),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'dataType',
      width: 100,
      render: (type: SettingDataType) => typeLabels[type],
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Công khai',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 100,
      render: (isPublic: boolean) => (isPublic ? 'Có' : 'Không'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Setting) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa cài đặt này?"
            onConfirm={() => handleDelete(record.key)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Cài đặt hệ thống"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm cài đặt
          </Button>
        }
      >
        <Tabs
          activeKey={activeCategory}
          onChange={(key) => setActiveCategory(key as SettingCategory)}
        >
          {Object.entries(categoryLabels).map(([key, label]) => (
            <TabPane tab={label} key={key}>
              <Table
                loading={
                  isLoading ||
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  deleteMutation.isPending
                }
                dataSource={settings}
                columns={columns}
                rowKey="key"
                scroll={{ x: 'max-content' }}
                pagination={false}
              />
            </TabPane>
          ))}
        </Tabs>
      </Card>

      <Modal
        title={editingSetting ? 'Sửa cài đặt' : 'Thêm cài đặt'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingSetting(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="Khóa"
            name="key"
            rules={[{ required: true, message: 'Vui lòng nhập khóa' }]}
          >
            <Input placeholder="VD: company_name" disabled={!!editingSetting} />
          </Form.Item>

          <Form.Item
            label="Loại"
            name="type"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
          >
            <Select disabled={!!editingSetting}>
              {Object.entries(typeLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (type === SettingType.BOOLEAN) {
                return (
                  <Form.Item
                    label="Giá trị"
                    name="value"
                    valuePropName="checked"
                    rules={[{ required: true }]}
                  >
                    <Switch checkedChildren="Có" unCheckedChildren="Không" />
                  </Form.Item>
                );
              }
              if (type === SettingType.JSON) {
                return (
                  <Form.Item
                    label="Giá trị (JSON)"
                    name="value"
                    rules={[
                      { required: true, message: 'Vui lòng nhập giá trị' },
                      {
                        validator: (_, value) => {
                          try {
                            JSON.parse(value);
                            return Promise.resolve();
                          } catch {
                            return Promise.reject('JSON không hợp lệ');
                          }
                        },
                      },
                    ]}
                  >
                    <TextArea rows={6} placeholder='{"key": "value"}' />
                  </Form.Item>
                );
              }
              return (
                <Form.Item
                  label="Giá trị"
                  name="value"
                  rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
                >
                  <Input placeholder="Nhập giá trị" />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} placeholder="Mô tả cài đặt" />
          </Form.Item>

          <Form.Item label="Công khai" name="isPublic" valuePropName="checked">
            <Switch checkedChildren="Có" unCheckedChildren="Không" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                Lưu
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingSetting(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
