import manufacturingService, {
  BOMLineItemDto,
  BOMType,
  CreateBOMDto,
} from '@/services/manufacturing/manufacturing.service';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Table,
} from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const { Option } = Select;

interface EditableBOMLine extends BOMLineItemDto {
  key: string;
}

function createBOMLineKey() {
  return `bom-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function BOMForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { t } = useTranslation('production');
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [lines, setLines] = useState<EditableBOMLine[]>([]);

  const { data: bom, isLoading: loadingData } = useQuery({
    queryKey: ['bom', id],
    queryFn: () => manufacturingService.getBOMById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (bom) {
      form.setFieldsValue({
        productId: bom.productId,
        productQty: bom.productQty,
        type: bom.type,
        isActive: bom.isActive,
      });
      setLines(
        bom.lines.map((l) => ({
          key: createBOMLineKey(),
          productId: l.productId,
          quantity: l.quantity,
          unitCost: l.unitCost,
        })),
      );
    }
  }, [bom, form]);

  const createMutation = useMutation({
    mutationFn: (dto: CreateBOMDto) => manufacturingService.createBOM(dto),
    onSuccess: () => {
      message.success(t('messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      navigate('/dashboard/production/boms');
    },
    onError: () => message.error(t('messages.saveError')),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: CreateBOMDto) => manufacturingService.updateBOM(id!, dto),
    onSuccess: () => {
      message.success(t('messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      queryClient.invalidateQueries({ queryKey: ['bom', id] });
      navigate('/dashboard/production/boms');
    },
    onError: () => message.error(t('messages.saveError')),
  });

  const onFinish = (values: Record<string, unknown>) => {
    const dto: CreateBOMDto = {
      productId: values.productId as string,
      productQty: values.productQty as number,
      type: values.type as BOMType,
      isActive: values.isActive as boolean | undefined,
      lines: lines.map(({ key, ...line }) => line),
    };
    if (isEdit) {
      updateMutation.mutate(dto);
    } else {
      createMutation.mutate(dto);
    }
  };

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { key: createBOMLineKey(), productId: '', quantity: 1, unitCost: 0 },
    ]);

  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const updateLine = (index: number, field: keyof BOMLineItemDto, value: string | number) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const lineColumns = [
    {
      title: t('bom.lineProductId'),
      dataIndex: 'productId',
      key: 'productId',
      render: (v: string, _: EditableBOMLine, i: number) => (
        <Input
          value={v}
          size="small"
          onChange={(e) => updateLine(i, 'productId', e.target.value)}
        />
      ),
    },
    {
      title: t('bom.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      render: (v: number, _: EditableBOMLine, i: number) => (
        <InputNumber
          value={v}
          min={0.01}
          size="small"
          style={{ width: '100%' }}
          onChange={(val) => updateLine(i, 'quantity', val ?? 1)}
        />
      ),
    },
    {
      title: t('bom.unitCost'),
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 110,
      render: (v: number, _: EditableBOMLine, i: number) => (
        <InputNumber
          value={v}
          min={0}
          size="small"
          style={{ width: '100%' }}
          onChange={(val) => updateLine(i, 'unitCost', val ?? 0)}
        />
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 50,
      render: (_: unknown, __: EditableBOMLine, i: number) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeLine(i)}
        />
      ),
    },
  ];

  return (
    <Card
      title={isEdit ? `${t('bom.edit')} — ${bom?.reference ?? ''}` : t('bom.create')}
      loading={loadingData}
      extra={
        <Space>
          <Button onClick={() => navigate('/dashboard/production/boms')}>
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
              label={t('bom.productId')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item
              name="productQty"
              label={t('bom.productQty')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <InputNumber min={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item
              name="type"
              label={t('bom.type')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <Select>
                {Object.values(BOMType).map((bt) => (
                  <Option key={bt} value={bt}>
                    {t(`bom.types.${bt}`)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="isActive" label={t('bom.isActive')} valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <div style={{ marginTop: 16 }}>
        <Space style={{ marginBottom: 8 }}>
          <strong>{t('bom.lines')}</strong>
          <Button size="small" icon={<PlusOutlined />} onClick={addLine}>
            {t('bom.addLine')}
          </Button>
        </Space>
        <Table<EditableBOMLine>
          size="small"
          rowKey="key"
          dataSource={lines}
          columns={lineColumns}
          pagination={false}
        />
      </div>
    </Card>
  );
}
