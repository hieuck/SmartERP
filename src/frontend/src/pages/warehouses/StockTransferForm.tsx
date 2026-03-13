/**
 * Stock Transfer Form Page
 * Create and view stock transfers between warehouses
 * Requirements: 27.3
 */

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
  Table,
  InputNumber,
  Input,
  Tag,
  Descriptions,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import warehouseService from '../../services/inventory/warehouseService';
import dayjs from 'dayjs';

const { Option } = Select;

const StockTransferForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEdit = !!id;
  const [items, setItems] = useState<any[]>([]);

  // Fetch transfer data for viewing/editing
  const { data: transferData, isLoading } = useQuery({
    queryKey: ['stockTransfer', id],
    queryFn: () => warehouseService.getStockTransfer(id!),
    enabled: isEdit,
  });

  // Fetch warehouses for dropdown
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
      message.success('Tạo phiếu chuyển kho thành công');
      queryClient.invalidateQueries({ queryKey: ['stockTransfers'] });
      navigate('/dashboard/warehouses/transfers');
    },
    onError: () => {
      message.error('Tạo phiếu chuyển kho thất bại');
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
      <Card
        title="Chi tiết phiếu chuyển kho"
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/dashboard/warehouses/transfers')}
          >
            Quay lại
          </Button>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã phiếu">{transfer.code}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={statusColors[transfer.status]}>
              {transfer.status?.replace('_', ' ')?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Kho nguồn">{transfer.fromWarehouseName || transfer.fromWarehouseId}</Descriptions.Item>
          <Descriptions.Item label="Kho đích">{transfer.toWarehouseName || transfer.toWarehouseId}</Descriptions.Item>
          <Descriptions.Item label="Ngày chuyển">
            {transfer.transferDate ? dayjs(transfer.transferDate).format('DD/MM/YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Ghi chú">{transfer.notes || '-'}</Descriptions.Item>
        </Descriptions>

        {transfer.items && transfer.items.length > 0 && (
          <Card title="Danh sách sản phẩm" size="small" style={{ marginTop: 16 }}>
            <Table
              dataSource={transfer.items}
              rowKey="productId"
              pagination={false}
              size="small"
              columns={[
                { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName' },
                { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'right' as const },
              ]}
            />
          </Card>
        )}
      </Card>
    );
  }

  // Create mode
  return (
    <Card
      title="Tạo phiếu chuyển kho"
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard/warehouses/transfers')}
        >
          Quay lại
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 800 }}>
        <Form.Item
          label="Kho nguồn"
          name="fromWarehouseId"
          rules={[{ required: true, message: 'Vui lòng chọn kho nguồn' }]}
        >
          <Select placeholder="Chọn kho nguồn">
            {(warehousesData?.data || []).map((w: any) => (
              <Option key={w.id} value={w.id}>
                {w.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Kho đích"
          name="toWarehouseId"
          rules={[{ required: true, message: 'Vui lòng chọn kho đích' }]}
        >
          <Select placeholder="Chọn kho đích">
            {(warehousesData?.data || []).map((w: any) => (
              <Option key={w.id} value={w.id}>
                {w.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Ngày chuyển"
          name="transferDate"
          rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item label="Ghi chú" name="notes">
          <Input.TextArea rows={2} placeholder="Nhập ghi chú" />
        </Form.Item>

        <Card
          title="Sản phẩm chuyển"
          size="small"
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
              Thêm
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          {items.map((item, index) => (
            <Space key={index} style={{ display: 'flex', marginBottom: 8 }}>
              <Input
                placeholder="Mã sản phẩm"
                value={item.productId}
                onChange={(e) => updateItem(index, 'productId', e.target.value)}
                style={{ width: 200 }}
              />
              <InputNumber
                min={1}
                value={item.quantity}
                onChange={(v) => updateItem(index, 'quantity', v)}
                placeholder="Số lượng"
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeItem(index)}
              />
            </Space>
          ))}
        </Card>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createMutation.isPending}
            >
              Tạo phiếu
            </Button>
            <Button onClick={() => navigate('/dashboard/warehouses/transfers')}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default StockTransferForm;
