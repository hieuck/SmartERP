import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Select, Space } from 'antd';
import React, { useState } from 'react';
import styles from './WorkflowBuilder.module.css';

const { Option } = Select;

interface WorkflowStep {
  id: string;
  type: 'approval' | 'notification' | 'condition' | 'automation';
  name: string;
  config: Record<string, unknown>;
}

interface WorkflowBuilderProps {
  onSave?: (steps: WorkflowStep[]) => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onSave }) => {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const { message } = App.useApp();

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      type: 'approval',
      name: 'Bước mới',
      config: {},
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  };

  const updateStep = <K extends keyof WorkflowStep>(id: string, field: K, value: WorkflowStep[K]) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(steps);
    }
    message.success('Đã lưu quy trình');
  };

  return (
    <div className={styles.container}>
      <Space orientation="vertical" className={styles.stepsContainer} size="large">
        <div className={styles.actionBar}>
          <Button type="primary" icon={<PlusOutlined />} onClick={addStep}>
            Thêm bước
          </Button>
          <Button className={styles.saveButton} onClick={handleSave}>
            Lưu quy trình
          </Button>
        </div>

        {steps.map((step, index) => (
          <Card
            key={step.id}
            title={`Bước ${index + 1}`}
            extra={
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeStep(step.id)}
              />
            }
          >
            <Form layout="vertical">
              <Form.Item label="Loại bước">
                <Select value={step.type} onChange={(value) => updateStep(step.id, 'type', value)}>
                  <Option value="approval">Phê duyệt</Option>
                  <Option value="notification">Thông báo</Option>
                  <Option value="condition">Điều kiện</Option>
                  <Option value="automation">Tự động hóa</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Tên bước">
                <Input
                  value={step.name}
                  onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                />
              </Form.Item>
              {step.type === 'approval' && (
                <Form.Item label="Người phê duyệt">
                  <Select placeholder="Chọn người phê duyệt">
                    <Option value="manager">Quản lý</Option>
                    <Option value="director">Giám đốc</Option>
                  </Select>
                </Form.Item>
              )}
            </Form>
          </Card>
        ))}
      </Space>
    </div>
  );
};
