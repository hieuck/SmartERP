/**
 * Worker Form Page
 * Create and edit production workers
 * Requirements: 31.1
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Form, Input, Select, DatePicker, Button, Space, message, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import productionService, { CreateWorkerDto } from '../../services/production/productionService';
import dayjs from 'dayjs';

const { Option } = Select;

const WorkerForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEdit = !!id;

  // Fetch worker data for editing
  const { data: workerData, isLoading } = useQuery({
    queryKey: ['worker', id],
    queryFn: () => productionService.worker.getWorker(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (workerData?.data) {
      const worker = workerData.data;
      form.setFieldsValue({
        ...worker,
        hireDate: worker.hireDate ? dayjs(worker.hireDate) : undefined,
      });
    }
  }, [workerData, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateWorkerDto) => productionService.worker.createWorker(data),
    onSuccess: () => {
      message.success('Thêm nhân viên thành công');
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      navigate('/dashboard/production/workers');
    },
    onError: () => {
      message.error('Thêm nhân viên thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateWorkerDto>) =>
      productionService.worker.updateWorker(id!, data),
    onSuccess: () => {
      message.success('Cập nhật nhân viên thành công');
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      navigate('/dashboard/production/workers');
    },
    onError: () => {
      message.error('Cập nhật nhân viên thất bại');
    },
  });

  const onFinish = (values: any) => {
    const data = {
      ...values,
      hireDate: values.hireDate?.toDate(),
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card
      title={isEdit ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard/production/workers')}
        >
          Quay lại
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
        <Form.Item
          label="Họ tên"
          name="fullName"
          rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
        >
          <Input placeholder="Nhập họ tên nhân viên" />
        </Form.Item>

        <Form.Item label="Số điện thoại" name="phone">
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item label="Địa chỉ" name="address">
          <Input.TextArea placeholder="Nhập địa chỉ" rows={2} />
        </Form.Item>

        <Form.Item
          label="Ngày vào làm"
          name="hireDate"
          rules={[{ required: true, message: 'Vui lòng chọn ngày vào làm' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          label="Chuyên môn"
          name="specialty"
          rules={[{ required: true, message: 'Vui lòng chọn chuyên môn' }]}
        >
          <Select placeholder="Chọn chuyên môn">
            <Option value="molding">Đúc khuôn</Option>
            <Option value="painting">Sơn</Option>
            <Option value="finishing">Hoàn thiện</Option>
            <Option value="packaging">Đóng gói</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Trình độ"
          name="skillLevel"
          rules={[{ required: true, message: 'Vui lòng chọn trình độ' }]}
        >
          <Select placeholder="Chọn trình độ">
            <Option value="apprentice">Học việc</Option>
            <Option value="skilled">Lành nghề</Option>
            <Option value="master">Bậc thợ cao</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEdit ? 'Cập nhật' : 'Thêm mới'}
            </Button>
            <Button onClick={() => navigate('/dashboard/production/workers')}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default WorkerForm;
