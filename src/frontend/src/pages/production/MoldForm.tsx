/**
 * Mold Form Page
 * Create and edit production molds
 * Requirements: 36.1
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Card,
  message,
  Space,
  Row,
  Col,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import productionService from '../../services/production/productionService';
import dayjs from 'dayjs';

const { Option } = Select;

const MoldForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEdit = !!id;

  // Fetch mold data if editing
  const { data: moldData } = useQuery({
    queryKey: ['mold', id],
    queryFn: async () => {
      const response = await productionService.mold.getMold(id!);
      return response.data;
    },
    enabled: isEdit,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await productionService.mold.createMold(data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Tạo khuôn thành công');
      queryClient.invalidateQueries({ queryKey: ['molds'] });
      navigate('/production/molds');
    },
    onError: () => {
      message.error('Tạo khuôn thất bại');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await productionService.mold.updateMold(id!, data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Cập nhật khuôn thành công');
      queryClient.invalidateQueries({ queryKey: ['molds'] });
      queryClient.invalidateQueries({ queryKey: ['mold', id] });
      navigate('/production/molds');
    },
    onError: () => {
      message.error('Cập nhật khuôn thất bại');
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (moldData) {
      form.setFieldsValue({
        ...moldData,
        lastMaintenanceDate: moldData.lastMaintenanceDate
          ? dayjs(moldData.lastMaintenanceDate)
          : null,
        nextMaintenanceDate: moldData.nextMaintenanceDate
          ? dayjs(moldData.nextMaintenanceDate)
          : null,
      });
    }
  }, [moldData, form]);

  const onFinish = (values: any) => {
    const data = {
      ...values,
      lastMaintenanceDate: values.lastMaintenanceDate?.toDate(),
      nextMaintenanceDate: values.nextMaintenanceDate?.toDate(),
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Card
      title={isEdit ? 'Sửa thông tin khuôn' : 'Thêm khuôn mới'}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/molds')}>
          Quay lại
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          status: 'available',
          usageCount: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tên khuôn"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên khuôn' }]}
            >
              <Input placeholder="Nhập tên khuôn" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Kích thước" name="size">
              <Input placeholder="Ví dụ: 30x20x15 cm" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Trọng lượng sản phẩm (kg)" name="productWeight">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Nhập trọng lượng"
                min={0}
                step={0.1}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Số lần sử dụng" name="usageCount">
              <InputNumber style={{ width: '100%' }} placeholder="Số lần đã sử dụng" min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
            >
              <Select>
                <Option value="available">Sẵn sàng</Option>
                <Option value="in_use">Đang sử dụng</Option>
                <Option value="maintenance">Bảo trì</Option>
                <Option value="broken">Hỏng</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Bảo trì lần cuối" name="lastMaintenanceDate">
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày bảo trì lần cuối"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Bảo trì tiếp theo" name="nextMaintenanceDate">
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày bảo trì tiếp theo"
              />
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
            <Button onClick={() => navigate('/production/molds')}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default MoldForm;
