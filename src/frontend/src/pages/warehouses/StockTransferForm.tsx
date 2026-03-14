import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Spin,
  InputNumber,
  Input,
  Tag,
  Descriptions,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import { formatDate } from '@/utils/responsive';
import warehouseService from '@/services/inventory/warehouseService';
import MobileFormItemCard from '@/components/common/MobileFormItemCard';
import dayjs from 'dayjs';

const { Option } = Select;

export default function StockTransferForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsive();
  const { t } = useTranslation(['warehouses', 'common']);
  const [form] = Form.useForm();
  const isEdit = !!id;
  const [items, setItems] = useState<any[]>([]);

  const { data: transferData, isLoading } = useQuery({
    queryKey: ['stockTransfer', id],
    queryFn: () => warehouseService.getStockTransfer(id!),
    enabled: isEdit,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseService.getWarehouses(),
  });

  useEffect(() => {
    if (transferData?.data) {
      const transfer = transferData.data;
      form.setFieldsValue({
        fromWarehouseId: transfer.fromWarehouseId,
        toWarehouseId: transfer.toWarehouseId,
        transferDate: transfer.transferDate ? dayjs(transfer.transferDate) : undefined,
        notes: transfer.notes,
      });
      if (transfer.items) {
        setItems(transfer.items);
      }
    }
  }, [transferData, form]);

  const createMutation = useMutation({
    mutationFn: (data: any) => warehouseService.createStockTransfer(data),
    onSuccess: () => {
      message.success(t('warehouses:messages.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['stockTransfers'] });
      navigate('/dashboard/warehouses/transfers');
    },
    onError: () => {
      message.error(t('warehouses:messages.createError'));
    },
  });

  const onFinish = (values: any) => {
    const data = {
      ...values,
      transferDate: values.transferDate?.toDate(),
      items: items,
    };
    createMutation.mutate(data);
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  if (isEdit && isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  // View mode for existing transfer
  if (isEdit && transferData?.data) {
    const transfer = transferData.data;
    const statusColors: Record<string, string> = {
      draft: 'default',
      pending: 'processing',
      in_transit: 'warning',
      completed: 'success',
      cancelled: 'error',
    };

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/dashboard/warehouses/transfers')}
          >
            {t('warehouses:transfer.back')}
          </Button>
        </div>

        <Card title={t('warehouses:transfer.viewTitle')}>
          <Descriptions bordered column={isMobile ? 1 : 2}>
            <Descriptions.Item label={t('warehouses:transfer.code')}>
              {transfer.code}
            </Descriptions.Item>
            <Descriptions.Item label={t('warehouses:transfer.status')}>
              <Tag color={statusColors[transfer.status]}>
                {t(`warehouses:status.${transfer.status}`)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('warehouses:transfer.fromWarehouse')}>
              {transfer.fromWarehouseName || transfer.fromWarehouseId}
            </Descriptions.Item>
            <Descriptions.Item label={t('warehouses:transfer.toWarehouse')}>
              {transfer.toWarehouseName || transfer.toWarehouseId}
            </Descriptions.Item>
            <Descriptions.Item label={t('warehouses:transfer.transferDate')}>
              {transfer.transferDate ? formatDate(transfer.transferDate) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('warehouses:transfer.notes')}>
              {transfer.notes || '-'}
            </Descriptions.Item>
          </Descriptions>

          {transfer.items && transfer.items.length > 0 && (
            <Card title={t('warehouses:transfer.productList')} size="small" style={{ marginTop: 16 }}>
              {isMobile ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {transfer.items.map((item: any, index: number) => (
                    <Card key={index} size="small">
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {t('warehouses:transfer.product')}
                        </div>
                        <div style={{ fontSize: 14 }}>{item.productName || item.productId}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {t('warehouses:transfer.quantity')}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{item.quantity}</div>
                      </div>
                    </Card>
                  ))}
                </Space>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <th style={{ padding: 8, textAlign: 'left' }}>
                        {t('warehouses:transfer.product')}
                      </th>
                      <th style={{ padding: 8, textAlign: 'right' }}>
                        {t('warehouses:transfer.quantity')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfer.items.map((item: any, index: number) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: 8 }}>{item.productName || item.productId}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </Card>
      </div>
    );
  }

  // Create mode
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard/warehouses/transfers')}
        >
          {t('warehouses:transfer.back')}
        </Button>
      </div>

      <Card title={t('warehouses:transfer.createTitle')}>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 800 }}>
          <Form.Item
            label={t('warehouses:transfer.fromWarehouse')}
            name="fromWarehouseId"
            rules={[{ required: true, message: t('warehouses:transfer.required.fromWarehouse') }]}
          >
            <Select placeholder={t('warehouses:transfer.from')}>
              {(warehousesData?.data || []).map((w: any) => (
                <Option key={w.id} value={w.id}>
                  {w.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('warehouses:transfer.toWarehouse')}
            name="toWarehouseId"
            rules={[{ required: true, message: t('warehouses:transfer.required.toWarehouse') }]}
          >
            <Select placeholder={t('warehouses:transfer.to')}>
              {(warehousesData?.data || []).map((w: any) => (
                <Option key={w.id} value={w.id}>
                  {w.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('warehouses:transfer.transferDate')}
            name="transferDate"
            rules={[{ required: true, message: t('warehouses:transfer.required.transferDate') }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label={t('warehouses:transfer.notes')} name="notes">
            <Input.TextArea rows={2} placeholder={t('warehouses:transfer.notesPlaceholder')} />
          </Form.Item>

          <Card
            title={t('warehouses:transfer.productList')}
            size="small"
            extra={
              <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
                {t('warehouses:transfer.addProduct')}
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            {isMobile ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {items.map((item, index) => (
                  <MobileFormItemCard key={index} index={index} onRemove={() => removeItem(index)}>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                        {t('warehouses:transfer.productId')}
                      </div>
                      <Input
                        placeholder={t('warehouses:transfer.productIdPlaceholder')}
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      />
                    </div>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                        {t('warehouses:transfer.quantity')}
                      </div>
                      <InputNumber
                        min={1}
                        value={item.quantity}
                        onChange={(v) => updateItem(index, 'quantity', v)}
                        placeholder={t('warehouses:transfer.quantityPlaceholder')}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </MobileFormItemCard>
                ))}
              </Space>
            ) : (
              items.map((item, index) => (
                <Space key={index} style={{ display: 'flex', marginBottom: 8 }}>
                  <Input
                    placeholder={t('warehouses:transfer.productIdPlaceholder')}
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    style={{ width: 200 }}
                  />
                  <InputNumber
                    min={1}
                    value={item.quantity}
                    onChange={(v) => updateItem(index, 'quantity', v)}
                    placeholder={t('warehouses:transfer.quantityPlaceholder')}
                  />
                  <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
                </Space>
              ))
            )}
          </Card>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createMutation.isPending}
              >
                {t('warehouses:transfer.save')}
              </Button>
              <Button onClick={() => navigate('/dashboard/warehouses/transfers')}>
                {t('warehouses:transfer.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
