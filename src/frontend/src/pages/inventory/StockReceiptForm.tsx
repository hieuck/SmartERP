import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  DatePicker,
  Button,
  Card,
  Table,
  Select,
  InputNumber,
  message,
  Space,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, StockReceiptItem } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { useResponsive } from '../../hooks/useResponsive';
import MobileFormItemCard from '../../components/common/MobileFormItemCard';
import dayjs from 'dayjs';

export default function StockReceiptForm() {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEdit = !!id;
  const [items, setItems] = useState<StockReceiptItem[]>([]);

  const { data: receipt } = useQuery({
    queryKey: ['stockReceipt', id],
    queryFn: () => inventoryService.getStockReceipt(id!),
    enabled: isEdit,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts({ limit: 1000 }),
  });

  useEffect(() => {
    if (receipt) {
      form.setFieldsValue({
        ...receipt,
        receiptDate: dayjs(receipt.receiptDate),
      });
      setItems(receipt.items);
    }
  }, [receipt, form]);

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const data = {
        ...values,
        receiptDate: values.receiptDate.format('YYYY-MM-DD'),
        items,
        totalAmount: items.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0),
      };
      return isEdit
        ? inventoryService.updateStockReceipt(id!, data)
        : inventoryService.createStockReceipt(data);
    },
    onSuccess: () => {
      message.success(isEdit ? 'Cập nhật phiếu nhập thành công!' : 'Tạo phiếu nhập thành công!');
      queryClient.invalidateQueries({ queryKey: ['stockReceipts'] });
      navigate('/inventory/receipts');
    },
    onError: () => {
      message.error(isEdit ? 'Cập nhật phiếu nhập thất bại!' : 'Tạo phiếu nhập thất bại!');
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

  const updateItem = (index: number, field: keyof StockReceiptItem, value: any) => {
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
      title: 'Sản Phẩm',
      dataIndex: 'productId',
      key: 'productId',
      width: 300,
      render: (value: string, _: any, index: number) => (
        <Select
          value={value}
          onChange={(val) => updateItem(index, 'productId', val)}
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="children"
          placeholder="Chọn sản phẩm"
        >
          {products?.data?.map((product: any) => (
            <Select.Option key={product.id} value={product.id}>
              {product.name} ({product.sku})
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Số Lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateItem(index, 'quantity', val || 0)}
          min={1}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Đơn Giá',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 150,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateItem(index, 'unitCost', val || 0)}
          min={0}
          formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(val) => val!.replace(/\$\s?|(,*)/g, '')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Thành Tiền',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 150,
      render: (value: number) => (value || 0).toLocaleString('vi-VN') + ' đ',
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
      ),
    },
  ];

  const onFinish = (values: any) => {
    if (items.length === 0) {
      message.error('Vui lòng thêm ít nhất một sản phẩm!');
      return;
    }
    saveMutation.mutate(values);
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/receipts')}>
          Quay Lại
        </Button>
      </div>

      <Card title={isEdit ? 'Chỉnh Sửa Phiếu Nhập' : 'Tạo Phiếu Nhập Mới'}>
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
            label="Ngày Nhập"
            rules={[{ required: true, message: 'Vui lòng chọn ngày nhập!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi Chú">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú" />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 8 }}>
              <h3>Danh Sách Sản Phẩm</h3>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
                Thêm Sản Phẩm
              </Button>
            </Space>

            {isMobile ? (
              /* Mobile: Card View */
              <div>
                {items.map((item, index) => (
                  <MobileFormItemCard key={index} index={index} onRemove={() => removeItem(index)}>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Sản phẩm</div>
                      <Select
                        value={item.productId}
                        onChange={(val) => updateItem(index, 'productId', val)}
                        style={{ width: '100%' }}
                        showSearch
                        optionFilterProp="children"
                        placeholder="Chọn sản phẩm"
                      >
                        {products?.data?.map((product: any) => (
                          <Select.Option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </Select.Option>
                        ))}
                      </Select>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Số lượng</div>
                        <InputNumber
                          min={1}
                          value={item.quantity}
                          onChange={(val) => updateItem(index, 'quantity', val || 1)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Đơn giá</div>
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
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Thành tiền</div>
                      <div
                        style={{
                          padding: '4px 11px',
                          border: '1px solid #d9d9d9',
                          borderRadius: 6,
                          background: '#f5f5f5',
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {(item.totalCost || 0).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </MobileFormItemCard>
                ))}

                <Card size="small" style={{ marginTop: 12, background: '#fafafa' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    <span>Tổng Cộng:</span>
                    <span style={{ color: '#1890ff' }}>
                      {totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </Card>
              </div>
            ) : (
              /* Desktop: Table View */
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
                        <strong>Tổng Cộng</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{totalAmount.toLocaleString('vi-VN')} đ</strong>
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
              {isEdit ? 'Cập Nhật' : 'Tạo Mới'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
