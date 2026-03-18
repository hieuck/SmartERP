import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, message } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const { Option } = Select;

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('employees');
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: employee } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await axios.get(`/api/employees/${id}`);
      return res.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (employee) {
      form.setFieldsValue({
        ...employee,
        hireDate: employee.hireDate ? dayjs(employee.hireDate) : null,
        dateOfBirth: employee.dateOfBirth ? dayjs(employee.dateOfBirth) : null,
      });
    }
  }, [employee, form]);

  const mutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const payload = {
        ...values,
        hireDate: values.hireDate ? (values.hireDate as dayjs.Dayjs).toISOString() : undefined,
        dateOfBirth: values.dateOfBirth
          ? (values.dateOfBirth as dayjs.Dayjs).toISOString()
          : undefined,
      };
      if (isEdit) return axios.patch(`/api/employees/${id}`, payload);
      return axios.post('/api/employees', payload);
    },
    onSuccess: () => {
      message.success(isEdit ? t('messages.updateSuccess') : t('messages.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      navigate('/dashboard/hr/employees');
    },
    onError: () => {
      message.error(isEdit ? t('messages.updateError') : t('messages.createError'));
    },
  });

  return (
    <Card title={isEdit ? t('form.title_edit') : t('form.title_create')}>
      <Form form={form} layout="vertical" onFinish={mutation.mutate} style={{ maxWidth: 600 }}>
        <Form.Item name="firstName" label={t('form.firstName')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="lastName" label={t('form.lastName')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label={t('form.email')} rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="phone" label={t('form.phone')}>
          <Input />
        </Form.Item>
        <Form.Item name="department" label={t('form.department')}>
          <Input />
        </Form.Item>
        <Form.Item name="position" label={t('form.position')}>
          <Input />
        </Form.Item>
        <Form.Item name="hireDate" label={t('form.hireDate')} rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="dateOfBirth" label={t('form.dateOfBirth')}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="gender" label={t('form.gender')}>
          <Select allowClear>
            <Option value="male">{t('form.gender_male')}</Option>
            <Option value="female">{t('form.gender_female')}</Option>
            <Option value="other">{t('form.gender_other')}</Option>
          </Select>
        </Form.Item>
        <Form.Item name="salary" label={t('form.salary')}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="status" label={t('form.status')} rules={[{ required: true }]}>
          <Select>
            <Option value="active">{t('status.active')}</Option>
            <Option value="inactive">{t('status.inactive')}</Option>
            <Option value="on_leave">{t('status.on_leave')}</Option>
            <Option value="terminated">{t('status.terminated')}</Option>
          </Select>
        </Form.Item>
        <Form.Item name="address" label={t('form.address')}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              {isEdit ? t('form.title_edit') : t('form.title_create')}
            </Button>
            <Button onClick={() => navigate('/dashboard/hr/employees')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
