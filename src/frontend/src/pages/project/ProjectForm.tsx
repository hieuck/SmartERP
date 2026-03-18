import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, message } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const { Option } = Select;

export default function ProjectForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('projects');
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await axios.get(`/api/projects/${id}`);
      return res.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (project) {
      form.setFieldsValue({
        ...project,
        startDate: project.startDate ? dayjs(project.startDate) : null,
        endDate: project.endDate ? dayjs(project.endDate) : null,
      });
    }
  }, [project, form]);

  const mutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const payload = {
        ...values,
        startDate: values.startDate ? (values.startDate as dayjs.Dayjs).toISOString() : undefined,
        endDate: values.endDate ? (values.endDate as dayjs.Dayjs).toISOString() : undefined,
      };
      if (isEdit) return axios.put(`/api/projects/${id}`, payload);
      return axios.post('/api/projects', payload);
    },
    onSuccess: () => {
      message.success(isEdit ? t('messages.updateSuccess') : t('messages.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/dashboard/projects');
    },
    onError: () => {
      message.error(isEdit ? t('messages.updateError') : t('messages.createError'));
    },
  });

  const generateCode = (name: string) =>
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 30);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit) form.setFieldValue('code', generateCode(e.target.value));
  };

  return (
    <Card title={isEdit ? t('form.title_edit') : t('form.title_create')}>
      <Form form={form} layout="vertical" onFinish={mutation.mutate} style={{ maxWidth: 600 }}>
        <Form.Item
          name="code"
          label={t('form.code')}
          extra={!isEdit ? 'Tự động tạo từ tên' : undefined}
        >
          <Input />
        </Form.Item>
        <Form.Item name="name" label={t('form.name')} rules={[{ required: true }]}>
          <Input onChange={handleNameChange} />
        </Form.Item>
        <Form.Item name="description" label={t('form.description')}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="startDate" label={t('form.startDate')} rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="endDate" label={t('form.endDate')}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="budget" label={t('form.budget')}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="status" label={t('form.status')} rules={[{ required: true }]}>
          <Select>
            {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map((s) => (
              <Option key={s} value={s}>
                {t(`status.${s}`)}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              {isEdit ? t('form.title_edit') : t('form.title_create')}
            </Button>
            <Button onClick={() => navigate('/dashboard/projects')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
