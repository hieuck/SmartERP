/**
 * Worker Form Page
 * Create and edit production workers
 * Requirements: 31.1
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Form, Input, Select, DatePicker, Button, Space, message, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import productionService, { CreateWorkerDto } from '../../services/production/productionService';
import { useResponsive } from '../../hooks/useResponsive';
import { getCardSize } from '../../utils/responsive';
import dayjs from 'dayjs';

const { Option } = Select;

export default function WorkerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();
  const responsive = useResponsive();
  const [form] = Form.useForm();
  const isEdit = !!id;

  // Fetch worker data for editing
  const { data: workerData, isLoading } = useQuery({
    queryKey: ['worker', id],
    queryFn: async () => {
      const response = await productionService.worker.getWorker(id!);
      return response.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (workerData) {
      form.setFieldsValue({
        ...workerData,
        hireDate: workerData.hireDate ? dayjs(workerData.hireDate) : undefined,
      });
    }
  }, [workerData, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateWorkerDto) => productionService.worker.createWorker(data),
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      navigate('/dashboard/production/workers');
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateWorkerDto>) =>
      productionService.worker.updateWorker(id!, data),
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      navigate('/dashboard/production/workers');
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  const onFinish = (values: any) => {
    const data = {
      ...values,
      hireDate: values.hireDate?.toDate(),
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
      title={isEdit ? t('production:workers.edit') : t('production:workers.create')}
      size={getCardSize(responsive)}
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard/production/workers')}
        >
          {t('common:actions.back')}
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('production:workers.fullName')}
          name="fullName"
          rules={[{ required: true, message: t('production:validation.required') }]}
        >
          <Input placeholder={t('production:workers.fullName')} />
        </Form.Item>

        <Form.Item label={t('production:workers.phone')} name="phone">
          <Input placeholder={t('production:workers.phone')} />
        </Form.Item>

        <Form.Item label={t('production:workers.address')} name="address">
          <Input.TextArea placeholder={t('production:workers.address')} rows={2} />
        </Form.Item>

        <Form.Item
          label={t('production:workers.hireDate')}
          name="hireDate"
          rules={[{ required: true, message: t('production:validation.required') }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          label={t('production:workers.specialty')}
          name="specialty"
          rules={[{ required: true, message: t('production:validation.required') }]}
        >
          <Select placeholder={t('production:workers.specialty')}>
            <Option value="molding">{t('production:workers.specialties.molding')}</Option>
            <Option value="painting">{t('production:workers.specialties.painting')}</Option>
            <Option value="finishing">{t('production:workers.specialties.finishing')}</Option>
            <Option value="packaging">{t('production:workers.specialties.packaging')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('production:workers.skillLevel')}
          name="skillLevel"
          rules={[{ required: true, message: t('production:validation.required') }]}
        >
          <Select placeholder={t('production:workers.skillLevel')}>
            <Option value="apprentice">{t('production:workers.skillLevels.apprentice')}</Option>
            <Option value="skilled">{t('production:workers.skillLevels.skilled')}</Option>
            <Option value="master">{t('production:workers.skillLevels.master')}</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEdit ? t('production:actions.save') : t('production:actions.save')}
            </Button>
            <Button onClick={() => navigate('/dashboard/production/workers')}>
              {t('production:actions.cancel')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
