import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, InputNumber, Button, Card, Space, message, Typography, Row, Col, Rate } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, ShopOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supplierService, { CreateSupplierDto, UpdateSupplierDto } from '../../services/supplierService';

const { Title } = Typography;
const { TextArea } = Input;

export default function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  const { data: supplier } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierService.getById(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (supplier) {
      form.setFieldsValue({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        rating: supplier.rating,
        paymentTerms: supplier.paymentTerms,
        leadTime: supplier.leadTime,
        discount: supplier.discount,
      });
    }
  }, [supplier, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      setLoading(true);
      try {
        if (isEdit) {
          return await supplierService.update(Number(id), values as UpdateSupplierDto);
        } else {
          return await supplierService.create(values as CreateSupplierDto);
        }
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      message.success(isEdit ? 'Cập nhật nhà cung cấp thành công' : 'Tạo nhà cung cấp thành công');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate('/dashboard/suppliers');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  const onFinish = (values: any) => {
    saveMutation.mutate(values);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/suppliers')}>
            Quay lại
          </Button>
        </Space>

        <Title level={3}>
          <ShopOutlined /> {isEdit ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            rating: 3,
            leadTime: 7,
            discount: 0,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Tên nhà cung cấp"
                rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}
              >
                <Input placeholder="Nhập tên nhà cung cấp" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="rating"
                label="Đánh giá"
                rules={[{ required: true, message: 'Vui lòng chọn đánh giá' }]}
              >
                <Rate />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="leadTime"
                label="Thời gian giao hàng (ngày)"
                rules={[{ required: true, message: 'Vui lòng nhập thời gian giao hàng' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="discount"
                label="Chiết khấu (%)"
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="paymentTerms"
            label="Điều khoản thanh toán"
            rules={[{ required: true, message: 'Vui lòng nhập điều khoản thanh toán' }]}
          >
            <Input placeholder="Ví dụ: Thanh toán trong 30 ngày" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <TextArea rows={3} placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                {isEdit ? 'Cập nhật' : 'Tạo mới'}
              </Button>
              <Button onClick={() => navigate('/dashboard/suppliers')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
