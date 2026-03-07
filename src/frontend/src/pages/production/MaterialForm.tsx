/**
 * Material Form Page
 * Create and edit production materials
 * Requirements: 35.1
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Select, InputNumber, Button, Card, message, Space, Row, Col } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import productionService from '../../services/productionService';

const { Option } = Select;

const MaterialForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEdit = !!id;

  // Fetch material data if editing
  const { data: materialData } = useQuery({
    queryKey: ['material', id],
    queryFn: () => productionService.material.getMaterial(id!),
    enabled: isEdit,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => productionService.material.createMaterial(data),
    onSuccess: () => {
      message.success('Tạo nguyên vật liệu thành công');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      navigate('/production/materials');
    },
    onError: () => {
      message.error('Tạo nguyên vật liệu thất bại');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => productionService.material.updateMaterial(id!, data),
    onSuccess: () => {
      message.success('Cập nhật nguyên vật liệu thành công');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material', id] });
      navigate('/production/materials');
    },
    onError: () => {
      message.error('Cập nhật nguyên vật liệu thất bại');
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (materialData?.data) {
      form.setFieldsValue(materialData.data);
    }
  }, [materialData, form]);

  const onFinish = (values: any) => {
    if (isEdit) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Card
      title={isEdit ? 'Sửa nguyên vật liệu' : 'Thêm nguyên vật liệu mới'}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/materials')}>
          Quay lại
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          type: 'plaster',
          status: 'active',
          quantity: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tên nguyên vật liệu"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            >
              <Input placeholder="Nhập tên nguyên vật liệu" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Loại"
              name="type"
              rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
            >
              <Select placeholder="Chọn loại">
                <Option value="plaster">Thạch cao</Option>
                <Option value="mold">Khuôn mẫu</Option>
                <Option value="paint">Sơn</Option>
                <Option value="accessory">Phụ kiện</Option>
                <Option value="packaging">Bao bì</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Đơn vị tính"
              name="unit"
              rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
            >
              <Input placeholder="kg, lít, cái..." />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Giá nhập"
              name="purchasePrice"
              rules={[
                { required: true, message: 'Vui lòng nhập giá nhập' },
                { type: 'number', min: 0, message: 'Giá phải lớn hơn 0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                addonAfter="đ"
                placeholder="Nhập giá nhập"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
            >
              <Select>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Ngừng dùng</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Số lượng tồn kho"
              name="quantity"
              rules={[
                { required: true, message: 'Vui lòng nhập số lượng' },
                { type: 'number', min: 0, message: 'Số lượng phải >= 0' },
              ]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="Nhập số lượng" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Tồn kho tối thiểu" name="minQuantity">
              <InputNumber style={{ width: '100%' }} placeholder="Nhập tồn tối thiểu" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
            <Button onClick={() => navigate('/production/materials')}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default MaterialForm;
