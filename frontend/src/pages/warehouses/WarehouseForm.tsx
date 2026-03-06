/**
 * Warehouse Form Page
 * Create and edit warehouses
 * Requirements: 27.1
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Button, Card, Space, Switch, message, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import warehouseService, { Warehouse } from '../../services/warehouseService';

const WarehouseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEdit = !!id;

  // Fetch warehouse data for edit
  const { data: warehouse, isLoading } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => warehouseService.getWarehouse(id!),
    enabled: isEdit,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: Partial<Warehouse>) =>
      isEdit ? warehouseService.updateWarehouse(id!, data) : warehouseService.createWarehouse(data),
    onSuccess: () => {
      message.success(`${isEdit ? 'Cập nhật' : 'Tạo'} kho thành công`);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      navigate('/warehouses');
    },
    onError: () => {
      message.error(`Không thể ${isEdit ? 'cập nhật' : 'tạo'} kho`);
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (warehouse?.data) {
      form.setFieldsValue(warehouse.data);
    }
  }, [warehouse, form]);

  const onFinish = (values: any) => {
    saveMutation.mutate(values);
  };

  if (isEdit && isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card
      title={isEdit ? 'Chỉnh sửa kho' : 'Thêm kho mới'}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/warehouses')}>
          Quay lại
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          status: 'active',
          isDefault: false,
        }}
      >
        <Form.Item
          label="Mã kho"
          name="code"
          rules={[{ required: true, message: 'Vui lòng nhập mã kho' }]}
        >
          <Input placeholder="Nhập mã kho" />
        </Form.Item>

        <Form.Item
          label="Tên kho"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên kho' }]}
        >
          <Input placeholder="Nhập tên kho" />
        </Form.Item>

        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
        >
          <Input placeholder="Nhập địa chỉ" />
        </Form.Item>

        <Form.Item label="Phường/Xã" name="ward">
          <Input placeholder="Nhập phường/xã" />
        </Form.Item>

        <Form.Item label="Quận/Huyện" name="district">
          <Input placeholder="Nhập quận/huyện" />
        </Form.Item>

        <Form.Item
          label="Tỉnh/Thành phố"
          name="city"
          rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
        >
          <Input placeholder="Nhập tỉnh/thành phố" />
        </Form.Item>

        <Form.Item label="Điện thoại" name="phone">
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input type="email" placeholder="Nhập email" />
        </Form.Item>

        <Form.Item label="Trạng thái" name="status" valuePropName="checked">
          <Switch
            checkedChildren="Hoạt động"
            unCheckedChildren="Ngừng"
            onChange={(checked) => form.setFieldValue('status', checked ? 'active' : 'inactive')}
          />
        </Form.Item>

        <Form.Item label="Đặt làm kho mặc định" name="isDefault" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
            >
              Lưu
            </Button>
            <Button onClick={() => navigate('/warehouses')}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default WarehouseForm;
