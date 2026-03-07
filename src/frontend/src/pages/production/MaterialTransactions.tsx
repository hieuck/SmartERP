/**
 * Material Transactions Page
 * View and manage material transactions
 * Requirements: 35.4
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
import {
  PlusOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import productionService, { MaterialTransaction } from '../../services/productionService';
import dayjs from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;
const { TextArea } = Input;

const MaterialTransactions = () => {
  const { isMobile } = useResponsive();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch material
  const { data: materialData } = useQuery({
    queryKey: ['material', id],
    queryFn: async () => {
      const response = await productionService.material.getMaterial(id!);
      return response.data;
    },
  });

  // Fetch transactions
  const { data, isLoading } = useQuery({
    queryKey: ['material-transactions', id],
    queryFn: async () => {
      const response = await productionService.material.getMaterialTransactions({ materialId: id });
      return response.data;
    },
  });

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await productionService.material.createMaterialTransaction(data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Tạo giao dịch thành công');
      queryClient.invalidateQueries({ queryKey: ['material-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['material', id] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Tạo giao dịch thất bại');
    },
  });

  const handleCreate = () => {
    setModalVisible(true);
  };

  const onFinish = (values: any) => {
    createMutation.mutate({
      materialId: id,
      type: values.type,
      quantity: values.quantity,
      notes: values.notes,
    });
  };

  const typeColors: Record<string, string> = {
    in: 'green',
    out: 'red',
    adjustment: 'orange',
  };

  const typeLabels: Record<string, string> = {
    in: 'Nhập kho',
    out: 'Xuất kho',
    adjustment: 'Điều chỉnh',
  };

  const typeIcons: Record<string, any> = {
    in: <ArrowDownOutlined />,
    out: <ArrowUpOutlined />,
    adjustment: <PlusOutlined />,
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => (
        <Tag color={typeColors[type]} icon={typeIcons[type]}>
          {typeLabels[type]}
        </Tag>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right' as const,
      render: (quantity: number, record: MaterialTransaction) => {
        const color =
          record.type === 'in' ? '#52c41a' : record.type === 'out' ? '#ff4d4f' : '#faad14';
        const sign = record.type === 'in' ? '+' : record.type === 'out' ? '-' : '';
        return (
          <strong style={{ color }}>
            {sign}
            {quantity.toLocaleString()} {materialData?.unit}
          </strong>
        );
      },
    },
    {
      title: 'Tham chiếu',
      key: 'reference',
      render: (_: any, record: MaterialTransaction) =>
        record.referenceType && record.referenceId
          ? `${record.referenceType} #${record.referenceId}`
          : '-',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
    },
  ];

  return (
    <Card
      title={
        <Space>
          <span>Lịch sử giao dịch - {materialData?.name}</span>
          <Tag color="blue">
            Tồn kho: {materialData?.quantity} {materialData?.unit}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo giao dịch
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/materials')}>
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
        pagination={false}
      />

      <Modal
        title="Tạo giao dịch nguyên vật liệu"
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
            type: 'in',
          }}
        >
          <Form.Item
            label="Loại giao dịch"
            name="type"
            rules={[{ required: true, message: 'Vui lòng chọn loại giao dịch' }]}
          >
            <Select>
              <Option value="in">Nhập kho</Option>
              <Option value="out">Xuất kho</Option>
              <Option value="adjustment">Điều chỉnh</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={`Số lượng (${materialData?.unit})`}
            name="quantity"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Nhập số lượng" />
          </Form.Item>

          <Form.Item label="Ghi chú" name="notes">
            <TextArea rows={3} placeholder="Nhập ghi chú" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                Tạo giao dịch
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

export default MaterialTransactions;
