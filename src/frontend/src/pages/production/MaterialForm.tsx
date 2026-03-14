/**
 * Material Form Page
 * Create and edit production materials
 * Requirements: 35.1
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Form, Input, Select, InputNumber, Button, Space, message, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import productionService, { CreateMaterialDto } from '../../services/production/productionService';
import { useResponsive } from '../../hooks/useResponsive';
import { getCardSize } from '../../utils/responsive';

const { Option } = Select;

export default function MaterialForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();
  const responsive = useResponsive();
  const [form] = Form.useForm();
  const isEdit = !!id;

  // Fetch material data for editing
  const { data: materialData, isLoading } = useQuery({
    queryKey: ['material', id],
    queryFn: async () => {
      const response = await productionService.material.getMaterial(id!);
      return response.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (materialData) {
      form.setFieldsValue(materialData);
    }
  }, [materialData, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialDto) => productionService.material.createMaterial(data),
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      navigate('/production/materials');
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateMaterialDto>) =>
      productionService.material.updateMaterial(id!, data),
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      navigate('/production/materials');
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
      title={isEdit ? t('production:materials.edit') : t('production:materials.create')}
      size={getCardSize(responsive)}
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/production/materials')}
        >
          {t('common:actions.back')}
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('production:materials.code')}
          name="code"
          rules={[{ required: true, message: t('production:validation.required') }]}
        >
          <Input placeholder={t('production:materials.code')} />
        </Form.Item>

        <Form.Item
          label={t('production:materials.name')}
          name="name"
          rules={[{ required: true, message: t('production:validation.required') }]}
        >
          <Input placeholder={t('production:materials.name')} />
        </Form.Item>

        <Form.Item
          label={t('production:materials.type')}
          name="type"
          rules={[{ required: true, message: t('production:validation.required') }]}
        >
          <Select placeholder={t('production:materials.type')}>
            <Option value="plaster">{t('production:materials.types.plaster')}</Option>
            <Option value="mold">{t('production:materials.types.mold')}</Option>
            <Option value="paint">{t('production:materials.types.paint')}</Option>
            <Option value="accessory">{t('production:materials.types.accessory')}</Option>
            <Option value="packaging">{t('production:materials.types.packaging')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('production:materials.unit')}
          name="unit"
          rules={[{ required: true, message: t('production:validation.required') }]}
        >
          <Input placeholder={t('production:materials.unit')} />
        </Form.Item>

        <Form.Item
          label={t('production:materials.quantity')}
          name="quantity"
          rules={[
            { required: true, message: t('production:validation.required') },
            { type: 'number', min: 0, message: t('production:validation.invalidQuantity') },
          ]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item
          label={t('production:materials.minQuantity')}
          name="minQuantity"
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item
          label={t('production:materials.purchasePrice')}
          name="purchasePrice"
          rules={[
            { required: true, message: t('production:validation.required') },
            { type: 'number', min: 0, message: t('production:validation.invalidAmount') },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
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
            <Button onClick={() => navigate('/production/materials')}>
              {t('production:actions.cancel')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
