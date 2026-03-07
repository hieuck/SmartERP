import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, InputNumber, Button, Card, Space, message, Typography, Row, Col } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import customerService, { CreateCustomerDto, UpdateCustomerDto } from '../../services/customerService';

const { Title } = Typography;
const { TextArea } = Input;

export default function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  const { data: customer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getById(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        creditLimit: customer.creditLimit,
      });
    }
  }, [customer, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      setLoading(true);
      try {
        if (isEdit) {
          return await customerService.update(Number(id), values as UpdateCustomerDto);
        } else {
          return await customerService.create(values as CreateCustomerDto);
        }
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      message.success(isEdit ? 'Cập nhật khách hàng thành công' : 'Tạo khách hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/dashboard/customers');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/customers')}>
            Quay lại
          </Button>
        </Space>

        <Title level={3}>
          <UserOutlined /> {isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            creditLimit: 0,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Tên khách hàng"
                rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
              >
                <Input placeholder="Nhập tên khách hàng" />
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
                name="creditLimit"
                label="Hạn mức tín dụng"
                rules={[{ required: true, message: 'Vui lòng nhập hạn mức' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="₫"
                />
              </Form.Item>
            </Col>
          </Row>

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
              <Button onClick={() => navigate('/dashboard/customers')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
