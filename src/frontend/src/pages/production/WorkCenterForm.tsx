import manufacturingService, {
  CreateWorkCenterDto,
} from '@/services/manufacturing/manufacturing.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Col, Form, Input, InputNumber, Row, Space, Switch } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const { TextArea } = Input;

export default function WorkCenterForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t } = useTranslation('production');
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: workCenter, isLoading: loadingData } = useQuery({
    queryKey: ['work-center', id],
    queryFn: () => manufacturingService.getWorkCenterById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (workCenter) {
      form.setFieldsValue(workCenter);
    }
  }, [form, workCenter]);

  const createMutation = useMutation({
    mutationFn: (dto: CreateWorkCenterDto) => manufacturingService.createWorkCenter(dto),
    onSuccess: () => {
      message.success(t('messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-centers'] });
      navigate('/dashboard/production/work-centers');
    },
    onError: () => message.error(t('messages.saveError')),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: CreateWorkCenterDto) => manufacturingService.updateWorkCenter(id!, dto),
    onSuccess: () => {
      message.success(t('messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-centers'] });
      queryClient.invalidateQueries({ queryKey: ['work-center', id] });
      navigate('/dashboard/production/work-centers');
    },
    onError: () => message.error(t('messages.saveError')),
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

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit) {
      form.setFieldValue('code', generateCode(event.target.value));
    }
  };

  const onFinish = (values: CreateWorkCenterDto) => {
    if (isEdit) {
      updateMutation.mutate(values);
      return;
    }

    createMutation.mutate(values);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Card
      title={isEdit ? t('workCenter.edit') : t('workCenter.create')}
      loading={loadingData}
      extra={
        <Space>
          <Button onClick={() => navigate('/dashboard/production/work-centers')}>
            {t('actions.cancel')}
          </Button>
          <Button type="primary" onClick={() => form.submit()} loading={isSaving}>
            {t('actions.save')}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          isActive: true,
          timeEfficiency: 100,
          capacityPerCycle: 1,
          costPerHour: 0,
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="code"
              label={t('workCenter.code')}
              extra={
                !isEdit
                  ? t('workCenter.autoCodeHint', { defaultValue: 'Tự động tạo từ tên' })
                  : undefined
              }
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label={t('workCenter.name')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <Input onChange={handleNameChange} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="description" label={t('workCenter.description')}>
              <TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="timeEfficiency" label={t('workCenter.timeEfficiency')}>
              <InputNumber<number>
                min={0}
                max={100}
                style={{ width: '100%' }}
                formatter={(value) => (value == null ? '' : `${value}%`)}
                parser={(value) => {
                  const parsed = Number((value ?? '').replace('%', ''));
                  return Number.isNaN(parsed) ? 0 : parsed;
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="capacityPerCycle" label={t('workCenter.capacityPerCycle')}>
              <InputNumber min={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="costPerHour" label={t('workCenter.costPerHour')}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="isActive" label={t('workCenter.isActive')} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
