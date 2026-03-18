import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Select, Space, message } from 'antd';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId?: string;
  isGroup: boolean;
  description?: string;
}

interface AccountFormValues {
  code: string;
  name: string;
  type: string;
  parentId?: string;
  isGroup: boolean;
  description?: string;
}

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];

export default function AccountForm() {
  const { t } = useTranslation('accounting');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<AccountFormValues>();
  const isEdit = Boolean(id);

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await axios.get('/api/accounting/accounts');
      return res.data?.data ?? [];
    },
  });

  useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const res = await axios.get(`/api/accounting/accounts/${id}`);
      form.setFieldsValue(res.data);
      return res.data;
    },
    enabled: isEdit,
  });

  const mutation = useMutation({
    mutationFn: (values: AccountFormValues) =>
      isEdit
        ? axios.put(`/api/accounting/accounts/${id}`, values)
        : axios.post('/api/accounting/accounts', values),
    onSuccess: () => {
      message.success(
        t(isEdit ? 'accounts.messages.updateSuccess' : 'accounts.messages.createSuccess'),
      );
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      navigate('/dashboard/accounting/accounts');
    },
    onError: () =>
      message.error(
        t(isEdit ? 'accounts.messages.updateSuccess' : 'accounts.messages.createError'),
      ),
  });

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2>{t(isEdit ? 'accounts.form.title_edit' : 'accounts.form.title_create')}</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => mutation.mutate(v)}
        initialValues={{ isGroup: false }}
      >
        <Form.Item name="code" label={t('accounts.form.code')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="name" label={t('accounts.form.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label={t('accounts.form.type')} rules={[{ required: true }]}>
          <Select>
            {ACCOUNT_TYPES.map((type) => (
              <Select.Option key={type} value={type}>
                {t(`accounts.types.${type}`)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="parentId" label={t('accounts.form.parentId')}>
          <Select allowClear>
            {accounts.map((acc) => (
              <Select.Option key={acc.id} value={acc.id}>
                {acc.code} - {acc.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="isGroup" valuePropName="checked">
          <Checkbox>{t('accounts.form.isGroup')}</Checkbox>
        </Form.Item>
        <Form.Item name="description" label={t('accounts.form.description')}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              {isEdit ? t('accounts.form.title_edit') : t('accounts.createButton')}
            </Button>
            <Button onClick={() => navigate('/dashboard/accounting/accounts')}>
              {t('accounts.actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
