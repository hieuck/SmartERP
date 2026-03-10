// @ts-nocheck
/**
 * Worker Form Page
 * Create and edit production workers
 * Requirements: 31.1
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Select, DatePicker, Button, Card, message, Space, Row, Col } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import productionService, { CreateWorkerDto } from '../../services/production/productionService';
import dayjs from 'dayjs';

const { Option } = Select;

const WorkerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEdit = !!id;

  // Fetch worker data if editing
  const { data: workerData } = useQuery({
    queryKey: ['worker', id],
    queryFn: () => productionService.worker.getWorker(id!),
    enabled: isEdit,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateWorkerDto) => productionService.worker.createWorker(data),
    onSuccess: () => {
      message.success('Tạo nhân viên thành công');
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      navigate('/production/workers');
    },
    onError: () => {
      message.error('Tạo nhân viên thất bại');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateWorkerDto>) =>
      productionService.worker.updateWorker(id!, data),
    onSuccess: () => {
      message.success('Cập nhật nhân viên thành công');
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker', id] });
      navigate('/production/workers');
    },
    onError: () => {
      message.error('Cập nhật nhân viên thất bại');
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (workerData?.data) {
      form.setFieldsValue({
        ...workerData.data,
        hireDate: dayjs(workerData.data.hireDate),
      });
    }
  }, [workerData, form]);

  const onFinish = (values: any) => {
    const data = {
      ...values,
      hireDate: values.hireDate.toDate(),
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Card
      title={isEdit ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/workers')}>
          Quay lại
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          specialty: 'molding',
          skillLevel: 'apprentice',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Họ tên"
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input placeholder="Nhập họ tên nhân viên" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Số điện thoại" name="phone">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Chuyên môn"
              name="specialty"
              rules={[{ required: true, message: 'Vui lòng chọn chuyên môn' }]}
            >
              <Select placeholder="Chọn chuyên môn">
                <Option value="molding">Đúc tượng</Option>
                <Option value="painting">Sơn màu</Option>
                <Option value="finishing">Hoàn thiện</Option>
                <Option value="packaging">Đóng gói</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Trình độ"
              name="skillLevel"
              rules={[{ required: true, message: 'Vui lòng chọn trình độ' }]}
            >
              <Select placeholder="Chọn trình độ">
                <Option value="apprentice">Thợ phụ</Option>
                <Option value="skilled">Thợ chính</Option>
                <Option value="master">Thợ bậc cao</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Ngày vào làm"
              name="hireDate"
              rules={[{ required: true, message: 'Vui lòng chọn ngày vào làm' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày vào làm"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Địa chỉ" name="address">
          <Input.TextArea rows={3} placeholder="Nhập địa chỉ nhân viên" />
        </Form.Item>

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
            <Button onClick={() => navigate('/production/workers')}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default WorkerForm;
