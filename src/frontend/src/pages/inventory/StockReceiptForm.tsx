import MobileFormItemCard from '@/components/common/MobileFormItemCard';
import { useResponsive } from '@/hooks/useResponsive';
import { inventoryService } from '@/services/inventory/inventoryService';
import { productService, type Product } from '@/services/inventory/productService';
import { formatCurrency } from '@/utils/responsive';
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Table,
  theme,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

interface StockReceiptItem {
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

type StockReceiptFormValues = {
  receiptDate: dayjs.Dayjs;
  notes?: string;
};

type ProductListResponse = {
  data: Product[];
};

const { useToken } = theme;

export default function StockReceiptForm() {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['inventory', 'common']);
  const [form] = Form.useForm<StockReceiptFormValues>();
  const isEdit = !!id;
  const [items, setItems] = useState<StockReceiptItem[]>([]);
  const { token } = useToken();

  const { data: receipt } = useQuery({
    queryKey: ['stockReceipt', id],
    queryFn: () => inventoryService.getStockReceipt(id!),
    enabled: isEdit,
  });

  const { data: products } = useQuery<ProductListResponse>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await productService.getProducts({ limit: 1000 });
      return {
        data: Array.isArray(response.data) ? response.data : [],
      };
    },
  });

  useEffect(() => {
    if (receipt) {
      form.setFieldsValue({
        ...receipt,
        receiptDate: dayjs(receipt.receivedDate),
      });
      setItems(
        receipt.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitPrice ?? 0,
          totalCost: item.quantity * (item.unitPrice ?? 0),
        })),
      );
    }
  }, [receipt, form]);

  const saveMutation = useMutation({
    mutationFn: (values: StockReceiptFormValues) => {
      const data = {
        ...values,
        receiptDate: values.receiptDate.format('YYYY-MM-DD'),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitCost,
        })),
        totalAmount: items.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0),
      };
      return isEdit
        ? inventoryService.updateStockReceipt(id!, data)
        : inventoryService.createStockReceipt(data);
    },
    onSuccess: () => {
      message.success(
        isEdit ? t('inventory:messages.updateSuccess') : t('inventory:messages.createSuccess'),
      );
      queryClient.invalidateQueries({ queryKey: ['stockReceipts'] });
      navigate('/inventory/receipts');
    },
    onError: () => {
      message.error(
        isEdit ? t('inventory:messages.updateError') : t('inventory:messages.createError'),
      );
    },
  });

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        quantity: 1,
        unitCost: 0,
        totalCost: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof StockReceiptItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitCost') {
      const quantity = Number(newItems[index].quantity) || 0;
      const unitCost = Number(newItems[index].unitCost) || 0;
      newItems[index].totalCost = quantity * unitCost;
    }

    setItems(newItems);
  };

  const columns = [
    {
      title: t('inventory:form.selectProduct'),
      dataIndex: 'productId',
      key: 'productId',
      width: 300,
      render: (value: string, _record: StockReceiptItem, index: number) => (
        <Select
          value={value}
          onChange={(val) => updateItem(index, 'productId', val)}
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="children"
          placeholder={t('inventory:form.selectProduct')}
        >
          {products?.data?.map((product) => (
            <Select.Option key={product.id} value={product.id}>
              {product.name} ({product.sku})
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: t('inventory:form.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (value: number, _record: StockReceiptItem, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateItem(index, 'quantity', val || 0)}
          min={1}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: t('inventory:form.unitCost'),
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 150,
      render: (value: number, _record: StockReceiptItem, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateItem(index, 'unitCost', val || 0)}
          min={0}
          formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(val) => Number(val!.replace(/\$\s?|(,*)/g, '')) as unknown as 0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: t('inventory:form.totalCost'),
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 150,
      render: (value: number) => formatCurrency(value || 0),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_value: unknown, _record: StockReceiptItem, index: number) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
      ),
    },
  ];

  const onFinish = (values: StockReceiptFormValues) => {
    if (items.length === 0) {
      message.error(t('inventory:messages.addProductError'));
      return;
    }
    saveMutation.mutate(values);
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/receipts')}>
          {t('inventory:form.back')}
        </Button>
      </div>

      <Card
        title={isEdit ? t('inventory:receipts.editTitle') : t('inventory:receipts.createTitle')}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            receiptDate: dayjs(),
            status: 'draft',
          }}
        >
          <Form.Item
            name="receiptDate"
            label={t('inventory:receipts.receiptDate')}
            rules={[{ required: true, message: t('inventory:messages.addProductError') }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="notes" label={t('inventory:form.notes')}>
            <Input.TextArea rows={3} placeholder={t('inventory:form.notesPlaceholder')} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 8 }}>
              <h3>{t('inventory:receipts.productList')}</h3>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
                {t('inventory:actions.addProduct')}
              </Button>
            </Space>

            {isMobile ? (
              <div>
                {items.map((item, index) => (
                  <MobileFormItemCard key={index} index={index} onRemove={() => removeItem(index)}>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                        {t('inventory:form.selectProduct')}
                      </div>
                      <Select
                        value={item.productId}
                        onChange={(val) => updateItem(index, 'productId', val)}
                        style={{ width: '100%' }}
                        showSearch
                        optionFilterProp="children"
                        placeholder={t('inventory:form.selectProduct')}
                      >
                        {products?.data?.map((product) => (
                          <Select.Option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </Select.Option>
                        ))}
                      </Select>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                          {t('inventory:form.quantity')}
                        </div>
                        <InputNumber
                          min={1}
                          value={item.quantity}
                          onChange={(val) => updateItem(index, 'quantity', val || 1)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                          {t('inventory:form.unitCost')}
                        </div>
                        <InputNumber
                          min={0}
                          value={item.unitCost}
                          onChange={(val) => updateItem(index, 'unitCost', val || 0)}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                        {t('inventory:form.totalCost')}
                      </div>
                      <div
                        style={{
                          padding: '4px 11px',
                          border: '1px solid #d9d9d9',
                          borderRadius: 6,
                          background: token.colorBgElevated,
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {formatCurrency(item.totalCost || 0)}
                      </div>
                    </div>
                  </MobileFormItemCard>
                ))}

                <Card size="small" style={{ marginTop: 12, background: token.colorBgElevated }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    <span>{t('inventory:receipts.totalAmount')}:</span>
                    <span style={{ color: token.colorPrimary }}>{formatCurrency(totalAmount)}</span>
                  </div>
                </Card>
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={items}
                rowKey={(_, index) => index!.toString()}
                pagination={false}
                size="middle"
                scroll={{ x: 'max-content' }}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <strong>{t('inventory:receipts.totalAmount')}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{formatCurrency(totalAmount)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            )}
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
            >
              {isEdit ? t('common:actions.save') : t('common:actions.create')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
