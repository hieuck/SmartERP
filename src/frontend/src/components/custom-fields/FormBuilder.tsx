import React, { useState } from 'react';
import { Card, Button, Form, Input, Select, Switch, Space, List } from 'antd';
import { PlusOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';

const { Option } = Select;

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'radio' | 'file';
  required: boolean;
  options?: string[];
}

type CustomFieldFormValues = Omit<CustomField, 'id' | 'options'> & { options?: string };

export const FormBuilder: React.FC = () => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form] = Form.useForm();

  const handleAddField: FormProps<CustomFieldFormValues>['onFinish'] = (values) => {
    const newField: CustomField = {
      id: Date.now().toString(),
      ...values,
      options: values.options ? values.options.split(',').map((o: string) => o.trim()) : [],
    };
    setFields([...fields, newField]);
    setIsAdding(false);
    form.resetFields();
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  return (
    <div>
      <Card title="Trường tùy chỉnh" style={{ marginBottom: 16 }}>
        <List
          dataSource={fields}
          renderItem={(field) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteField(field.id)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={<DragOutlined style={{ cursor: 'move' }} />}
                title={field.label}
                description={`Loại: ${field.type} ${field.required ? '(Bắt buộc)' : ''}`}
              />
            </List.Item>
          )}
        />
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={() => setIsAdding(true)}
          style={{ marginTop: 16 }}
        >
          Thêm trường
        </Button>
      </Card>

      {isAdding && (
        <Card title="Thêm trường mới">
          <Form form={form} layout="vertical" onFinish={handleAddField}>
            <Form.Item name="name" label="Tên trường" rules={[{ required: true }]}>
              <Input placeholder="vd: custom_field_1" />
            </Form.Item>
            <Form.Item name="label" label="Nhãn hiển thị" rules={[{ required: true }]}>
              <Input placeholder="vd: Thông tin bổ sung" />
            </Form.Item>
            <Form.Item name="type" label="Loại trường" rules={[{ required: true }]}>
              <Select>
                <Option value="text">Text</Option>
                <Option value="number">Number</Option>
                <Option value="date">Date</Option>
                <Option value="dropdown">Dropdown</Option>
                <Option value="checkbox">Checkbox</Option>
                <Option value="radio">Radio</Option>
                <Option value="file">File Upload</Option>
              </Select>
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
            >
              {({ getFieldValue }) =>
                ['dropdown', 'radio'].includes(getFieldValue('type')) ? (
                  <Form.Item name="options" label="Tùy chọn (phân cách bằng dấu phẩy)">
                    <Input placeholder="vd: Tùy chọn 1, Tùy chọn 2, Tùy chọn 3" />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
            <Form.Item name="required" label="Bắt buộc" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Thêm
              </Button>
              <Button onClick={() => setIsAdding(false)}>Hủy</Button>
            </Space>
          </Form>
        </Card>
      )}
    </div>
  );
};
