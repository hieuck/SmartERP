import manufacturingService, {
  CreateWorkOrderDto,
  WorkOrder,
} from '@/services/manufacturing/manufacturing.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Space, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const { TextArea } = Input;

export default function WorkOrderForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation('production');
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: workOrder, isLoading: loadingData } = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => manufacturingService.getWorkOrderById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (workOrder) {
      form.setFieldsValue({
        productId: workOrder.productId,
        bomId: workOrder.bomId,
        qtyToProduce: workOrder.qtyToProduce,
        responsibleId: workOrder.responsibleId,
        notes: workOrder.notes,
        datePlannedStart: workOrder.datePlannedStart ? dayjs(workOrder.datePlannedStart) : null,
        datePlannedFinished: workOrder.datePlannedFinished
          ? dayjs(workOrder.datePlannedFinished)
          : null,
      });
    }
  }, [workOrder, form]);

  const createMutation = useMutation({
    mutationFn: (dto: CreateWorkOrderDto) => manufacturingService.createWorkOrder(dto),
    onSuccess: () => {
      message.success(t('messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      navigate('/dashboard/production/work-orders');
    },
    onError: () => message.error(t('messages.saveError')),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: CreateWorkOrderDto) => manufacturingService.updateWorkOrder(id!, dto),
    onSuccess: () => {
      message.success(t('messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      navigate('/dashboard/production/work-orders');
    },
    onError: () => message.error(t('messages.saveError')),
  });

  const onFinish = (values: Record<string, unknown>) => {
    const dto: CreateWorkOrderDto = {
      productId: values.productId as string,
      bomId: values.bomId as string | undefined,
      qtyToProduce: values.qtyToProduce as number,
      responsibleId: values.responsibleId as string | undefined,
      notes: values.notes as string | undefined,
      datePlannedStart: values.datePlannedStart
        ? dayjs(values.datePlannedStart as dayjs.Dayjs).toISOString()
        : (undefined as unknown as string),
      datePlannedFinished: values.datePlannedFinished
        ? dayjs(values.datePlannedFinished as dayjs.Dayjs).toISOString()
        : undefined,
    };
    if (isEdit) {
      updateMutation.mutate(dto);
    } else {
      createMutation.mutate(dto);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const getTitle = (wo?: WorkOrder) => {
    if (!isEdit) return t('workOrders.create');
    return `${t('workOrders.edit')} — ${wo?.reference ?? ''}`;
  };

  return (
    <Card
      title={getTitle(workOrder)}
      loading={loadingData}
      extra={
        <Space>
          <Button onClick={() => navigate('/dashboard/production/work-orders')}>
            {t('actions.cancel')}
          </Button>
          <Button type="primary" onClick={() => form.submit()} loading={isSaving}>
            {t('actions.save')}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="productId"
              label={t('workOrders.productId')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="bomId" label={t('workOrders.bomId')}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="qtyToProduce"
              label={t('workOrders.qtyToProduce')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <InputNumber min={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="responsibleId" label={t('workOrders.responsibleId')}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="datePlannedStart"
              label={t('workOrders.plannedStartDate')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="datePlannedFinished" label={t('workOrders.plannedEndDate')}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="notes" label={t('workOrders.notes')}>
              <TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
