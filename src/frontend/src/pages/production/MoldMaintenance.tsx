/**
 * Mold Maintenance Page
 * Track mold maintenance history
 * Requirements: 36.4
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Card,
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
  DatePicker,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined, ToolOutlined } from '@ant-design/icons';
import productionService, { MoldMaintenance } from '../../services/productionService';
import dayjs from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;
const { TextArea } = Input;

const MoldMaintenancePage = () => {
  const { isMobile } = useResponsive();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch mold
  const { data: moldData } = useQuery({
    queryKey: ['mold', id],
    queryFn: () => productionService.mold.getMold(id!),
  });

  // Fetch maintenance history
  const { data, isLoading } = useQuery({
    queryKey: ['mold-maintenances', id],
    queryFn: () => productionService.mold.getMoldMaintenances(id!),
  });

  // Create maintenance mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => productionService.mold.createMoldMaintenance(id!, data),
    onSuccess: () => {
      message.success('Tạo bản ghi bảo trì thành công');
      queryClient.invalidateQueries({ queryKey: ['mold-maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['mold', id] });
      queryClient.invalidateQueries({ queryKey: ['molds'] });
      setModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Tạo bản ghi bảo trì thất bại');
    },
  });

  const handleCreate = () => {
    setModalVisible(true);
  };

  const onFinish = (values: any) => {
    createMutation.mutate({
      date: values.date.toDate(),
      type: values.type,
      description: values.description,
      cost: values.cost,
      performedBy: values.performedBy,
    });
  };

  const typeColors: Record<string, string> = {
    routine: 'blue',
    repair: 'orange',
  };

  const typeLabels: Record<string, string> = {
    routine: 'Bảo trì định kỳ',
    repair: 'Sửa chữa',
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => (
        <Tag color={typeColors[type]} icon={<ToolOutlined />}>
          {typeLabels[type]}
        </Tag>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Chi phí',
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (value ? value.toLocaleString('vi-VN') + ' đ' : '-'),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'performedBy',
      key: 'performedBy',
      width: 150,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const totalCost =
    data?.data?.reduce((sum: number, m: MoldMaintenance) => sum + (m.cost || 0), 0) || 0;

  return (
    <Card
      title={
        <Space>
          <span>Lịch sử bảo trì - {moldData?.data?.name}</span>
          <Tag color="blue">Mã: {moldData?.data?.code}</Tag>
          <Tag color="green">Tổng chi phí: {totalCost.toLocaleString('vi-VN')} đ</Tag>
        </Space>
      }
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm bảo trì
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/molds')}>
            Quay lại
          </Button>
        </Space>
      }
    >
      <Table
        size={isMobile ? 'small' : 'middle'}
        scroll={{ x: 'max-content' }}
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          total: data?.meta?.total,
          pageSize: data?.meta?.limit,
          current: data?.meta?.page,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} lần bảo trì`,
        }}
      />

      <Modal
        title="Thêm bản ghi bảo trì"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            date: dayjs(),
            type: 'routine',
          }}
        >
          <Form.Item
            label="Ngày bảo trì"
            name="date"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Loại bảo trì"
            name="type"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
          >
            <Select>
              <Option value="routine">Bảo trì định kỳ</Option>
              <Option value="repair">Sửa chữa</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} placeholder="Mô tả công việc bảo trì" />
          </Form.Item>

          <Form.Item label="Chi phí (đ)" name="cost">
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập chi phí"
              min={0}
            />
          </Form.Item>

          <Form.Item label="Người thực hiện" name="performedBy">
            <Input placeholder="Tên người thực hiện" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                Thêm bảo trì
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default MoldMaintenancePage;
