/**
 * Mold Form Page
 * Create and edit production molds
 * Requirements: 36.1
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Form, Input, InputNumber, Button, Space, message, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import productionService, { CreateMoldDto } from '@/services/production/productionService';
import { useResponsive } from '@/hooks/useResponsive';
import { getCardSize } from '@/utils/responsive';

export default function MoldForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();
  const responsive = useResponsive();
  const [form] = Form.useForm();
  const isEdit = !!id;

  // Fetch mold data for editing
  const { data: moldData, isLoading } = useQuery({
    queryKey: ['mold', id],
    queryFn: async () => {
      const response = await productionService.mold.getMold(id!);
      return response.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (moldData) {
      form.setFieldsValue(moldData);
    }
  }, [moldData, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateMoldDto) => productionService.mold.createMold(data),
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['molds'] });
      navigate('/production/molds');
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateMoldDto>) =>
      productionService.mold.updateMold(id!, data),
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['molds'] });
      navigate('/production/molds');
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  const onFinish = (values: any) => {
    if (isEdit) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card
      title={isEdit ? t('production:molds.edit') : t('production:molds.create')}
      size={getCardSize(responsive)}
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/production/molds')}
        >
          {t('common:actions.back')}
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('production:molds.code')}
          name="code"
          rules={[{ required: true, message: t('production:validation.required') }]}
        >
          <Input placeholder={t('production:molds.code')} />
        </Form.Item>

        <Form.Item
          label={t('production:molds.name')}
          name="name"
          rules={[{ required: true, message: t('production:validation.required') }]}
        >
          <Input placeholder={t('production:molds.name')} />
        </Form.Item>

        <Form.Item
          label={t('production:molds.size')}
          name="size"
        >
          <Input placeholder={t('production:molds.size')} />
        </Form.Item>

        <Form.Item
          label={t('production:molds.productWeight')}
          name="productWeight"
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            placeholder={t('production:molds.productWeight')}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {t('production:actions.save')}
            </Button>
            <Button onClick={() => navigate('/production/molds')}>
              {t('production:actions.cancel')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
