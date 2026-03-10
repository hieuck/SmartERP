// @ts-nocheck
/**
 * Stock Transfer Form Page
 * Create and manage stock transfers between warehouses
 * Requirements: 27.3
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Select,
  DatePicker,
  Table,
  InputNumber,
  message,
  Spin,
  Popconfirm,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import warehouseService, {
  StockTransfer,
  StockTransferItem,
} from '../../services/inventory/warehouseService';
import { productService } from '../../services/inventory/productService';

const StockTransferForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEdit = !!id;
  const [items, setItems] = useState<StockTransferItem[]>([]);

  // Fetch warehouses
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses', { status: 'active' }],
    queryFn: () => warehouseService.getWarehouses({ status: 'active' }),
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products', { status: 'active' }],
    queryFn: () => productService.getProducts({ status: 'active' }),
  });

  // Fetch transfer data for edit
  const { data: transfer, isLoading } = useQuery({
    queryKey: ['stockTransfer', id],
    queryFn: () => warehouseService.getStockTransfer(id!),
    enabled: isEdit,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: Partial<StockTransfer>) =>
      isEdit
        ? warehouseService.updateStockTransfer(id!, data)
        : warehouseService.createStockTransfer(data),
    onSuccess: () => {
      message.success(`Stock transfer ${isEdit ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['stockTransfers'] });
      navigate('/warehouses/transfers');
    },
    onError: () => {
      message.error(`Failed to ${isEdit ? 'update' : 'create'} stock transfer`);
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => warehouseService.approveStockTransfer(id),
    onSuccess: () => {
      message.success('Stock transfer approved successfully');
      queryClient.invalidateQueries({ queryKey: ['stockTransfers'] });
      navigate('/warehouses/transfers');
    },
    onError: () => {
      message.error('Failed to approve stock transfer');
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (transfer?.data) {
      form.setFieldsValue({
        ...transfer.data,
        transferDate: dayjs(transfer.data.transferDate),
      });
      setItems(transfer.data.items || []);
    }
  }, [transfer, form]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `temp-${Date.now()}`,
        productId: '',
        quantity: 1,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const onFinish = (values: any) => {
    if (items.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    const data = {
      ...values,
      transferDate: values.transferDate.format('YYYY-MM-DD'),
      items: items.map(({ id, ...item }) => item),
    };

    saveMutation.mutate(data);
  };

  const itemColumns = [
    {
      title: 'Product',
      dataIndex: 'productId',
      key: 'productId',
      render: (_: any, record: StockTransferItem, index: number) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select product"
          value={record.productId}
          onChange={(value) => updateItem(index, 'productId', value)}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={products?.data?.map((p: any) => ({
            label: `${p.sku} - ${p.name}`,
            value: p.id,
          }))}
        />
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 150,
      render: (_: any, record: StockTransferItem, index: number) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => updateItem(index, 'quantity', value || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (_: any, record: StockTransferItem, index: number) => (
        <Input
          placeholder="Notes"
          value={record.notes}
          onChange={(e) => updateItem(index, 'notes', e.target.value)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, __: StockTransferItem, index: number) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
      ),
    },
  ];

  if (isEdit && isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const canApprove = isEdit && transfer?.data?.status === 'pending';

  return (
    <Card
      title={isEdit ? 'Edit Stock Transfer' : 'New Stock Transfer'}
      extra={
        <Space>
          {canApprove && (
            <Popconfirm
              title="Are you sure you want to approve this transfer?"
              onConfirm={() => approveMutation.mutate(id!)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" icon={<CheckOutlined />} loading={approveMutation.isPending}>
                Approve
              </Button>
            </Popconfirm>
          )}
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/warehouses/transfers')}>
            Back
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          transferDate: dayjs(),
          status: 'draft',
        }}
      >
        <Form.Item
          label="From Warehouse"
          name="fromWarehouseId"
          rules={[{ required: true, message: 'Please select source warehouse' }]}
        >
          <Select
            placeholder="Select source warehouse"
            options={warehouses?.data?.map((w: any) => ({
              label: `${w.code} - ${w.name}`,
              value: w.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="To Warehouse"
          name="toWarehouseId"
          rules={[{ required: true, message: 'Please select destination warehouse' }]}
        >
          <Select
            placeholder="Select destination warehouse"
            options={warehouses?.data?.map((w: any) => ({
              label: `${w.code} - ${w.name}`,
              value: w.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Transfer Date"
          name="transferDate"
          rules={[{ required: true, message: 'Please select transfer date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <Input.TextArea rows={3} placeholder="Enter notes" />
        </Form.Item>

        <Card
          title="Transfer Items"
          size="small"
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
              Add Item
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          <Table
            columns={itemColumns}
            dataSource={items}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
            >
              Save
            </Button>
            <Button onClick={() => navigate('/warehouses/transfers')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default StockTransferForm;
