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
import { useTranslation } from 'react-i18next';
import {
  useCreateSetting,
  useDeleteSetting,
  useSettingsByCategory,
  useUpdateSetting,
} from '@/hooks/useSettings';
import { Setting, SettingCategory, SettingDataType } from '@/services/utils/settingsService';

const { TabPane } = Tabs;
const { TextArea } = Input;

export default function SettingsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const [activeCategory, setActiveCategory] = useState<SettingCategory>(SettingCategory.GENERAL);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [form] = Form.useForm();

  // Hooks for settings operations
  const { data: settings = [], isLoading } = useSettingsByCategory(activeCategory);
  const createMutation = useCreateSetting();
  const updateMutation = useUpdateSetting();
  const deleteMutation = useDeleteSetting();

  const categoryLabels: Record<SettingCategory, string> = {
    [SettingCategory.GENERAL]: t('systemSettings.categories.general'),
    [SettingCategory.NOTIFICATION]: t('systemSettings.categories.notification'),
    [SettingCategory.SECURITY]: t('systemSettings.categories.security'),
    [SettingCategory.PAYMENT]: t('systemSettings.categories.payment'),
    [SettingCategory.SHIPPING]: t('systemSettings.categories.shipping'),
    [SettingCategory.TAX]: t('systemSettings.categories.tax'),
    [SettingCategory.EMAIL]: t('systemSettings.categories.email'),
    [SettingCategory.INTEGRATION]: t('systemSettings.categories.integration'),
  };

  const typeLabels: Record<SettingDataType, string> = {
    [SettingDataType.STRING]: t('systemSettings.types.string'),
    [SettingDataType.NUMBER]: t('systemSettings.types.number'),
    [SettingDataType.BOOLEAN]: t('systemSettings.types.boolean'),
    [SettingDataType.JSON]: t('systemSettings.types.json'),
  };

  const handleSave = async (values: {
    key: string;
    value: string;
    type: SettingDataType;
    description?: string;
    isPublic: boolean;
  }) => {
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
        message.success(t('systemSettings.messages.updateSuccess'));
      } else {
        await createMutation.mutateAsync({
          key: values.key,
          value: values.value,
          type: values.type,
          category: activeCategory,
          description: values.description,
          isPublic: values.isPublic,
        });
        message.success(t('systemSettings.messages.createSuccess'));
      }
      setModalVisible(false);
      setEditingSetting(null);
      form.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('systemSettings.messages.unknownError');
      message.error(
        t('systemSettings.messages.saveError', {
          error: errorMessage,
        })
      );
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteMutation.mutateAsync({
        key,
        category: activeCategory,
      });
      message.success(t('systemSettings.messages.deleteSuccess'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('systemSettings.messages.unknownError');
      message.error(
        t('systemSettings.messages.deleteError', {
          error: errorMessage,
        })
      );
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
      type: SettingDataType.STRING,
      isPublic: false,
    });
    setModalVisible(true);
  };

  const renderValue = (value: string, type: SettingDataType) => {
    if (type === SettingDataType.BOOLEAN) {
      return value === 'true' ? t('common.yes') : t('common.no');
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
      title: t('systemSettings.table.key'),
      dataIndex: 'key',
      key: 'key',
      width: 200,
    },
    {
      title: t('systemSettings.table.value'),
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
      render: (value: string, record: Setting) => renderValue(value, record.type),
    },
    {
      title: t('systemSettings.table.type'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: SettingDataType) => typeLabels[type],
    },
    {
      title: t('systemSettings.table.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('systemSettings.table.isPublic'),
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 100,
      render: (isPublic: boolean) => (isPublic ? t('common.yes') : t('common.no')),
    },
    {
      title: t('systemSettings.table.actions'),
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: Setting) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('systemSettings.deleteConfirm')}
            onConfirm={() => handleDelete(record.key)}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={t('systemSettings.title')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {t('systemSettings.addButton')}
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
        title={editingSetting ? t('systemSettings.editTitle') : t('systemSettings.addTitle')}
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
            label={t('systemSettings.form.key')}
            name="key"
            rules={[{ required: true, message: t('systemSettings.form.keyRequired') }]}
          >
            <Input placeholder={t('systemSettings.form.keyPlaceholder')} disabled={!!editingSetting} />
          </Form.Item>

          <Form.Item
            label={t('systemSettings.form.type')}
            name="type"
            rules={[{ required: true, message: t('systemSettings.form.typeRequired') }]}
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
            shouldUpdate={(prevValues: { type?: SettingDataType }, currentValues: { type?: SettingDataType }) => 
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }: { getFieldValue: (name: string) => SettingDataType }) => {
              const type = getFieldValue('type');
              if (type === SettingDataType.BOOLEAN) {
                return (
                  <Form.Item
                    label={t('systemSettings.form.value')}
                    name="value"
                    valuePropName="checked"
                    rules={[{ required: true }]}
                  >
                    <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                  </Form.Item>
                );
              }
              if (type === SettingDataType.JSON) {
                return (
                  <Form.Item
                    label={t('systemSettings.form.valueJson')}
                    name="value"
                    rules={[
                      { required: true, message: t('systemSettings.form.valueRequired') },
                      {
                        validator: (_: unknown, value: string) => {
                          try {
                            JSON.parse(value);
                            return Promise.resolve();
                          } catch {
                            return Promise.reject(new Error(t('systemSettings.form.jsonInvalid')));
                          }
                        },
                      },
                    ]}
                  >
                    <TextArea rows={6} placeholder={t('systemSettings.form.jsonPlaceholder')} />
                  </Form.Item>
                );
              }
              return (
                <Form.Item
                  label={t('systemSettings.form.value')}
                  name="value"
                  rules={[{ required: true, message: t('systemSettings.form.valueRequired') }]}
                >
                  <Input placeholder={t('systemSettings.form.valuePlaceholder')} />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item label={t('systemSettings.form.description')} name="description">
            <TextArea rows={3} placeholder={t('systemSettings.form.descriptionPlaceholder')} />
          </Form.Item>

          <Form.Item label={t('systemSettings.form.isPublic')} name="isPublic" valuePropName="checked">
            <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {t('common.save')}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingSetting(null);
                  form.resetFields();
                }}
              >
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
