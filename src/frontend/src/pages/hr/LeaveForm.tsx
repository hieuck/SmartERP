import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Form, Input, Select, Space, message } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface LeaveFormValues {
  employeeId: string;
  leaveType: string;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  reason: string;
}

const LEAVE_TYPES = ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other'];

export default function LeaveForm() {
  const { t } = useTranslation('leave');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<LeaveFormValues>();

  const mutation = useMutation({
    mutationFn: (values: LeaveFormValues) =>
      axios.post('/api/leave/request', {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      }),
    onSuccess: () => {
      message.success(t('messages.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      navigate('/dashboard/hr/leave');
    },
    onError: () => message.error(t('messages.createError')),
  });

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2>{t('form.title_create')}</h2>
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
        <Form.Item name="employeeId" label={t('form.employeeId')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="leaveType" label={t('form.leaveType')} rules={[{ required: true }]}>
          <Select>
            {LEAVE_TYPES.map((type) => (
              <Select.Option key={type} value={type}>
                {t(`leaveType.${type}`)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="startDate" label={t('form.startDate')} rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="endDate" label={t('form.endDate')} rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="reason" label={t('form.reason')} rules={[{ required: true }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              {t('createButton')}
            </Button>
            <Button onClick={() => navigate('/dashboard/hr/leave')}>{t('actions.cancel')}</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
