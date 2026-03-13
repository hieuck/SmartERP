import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Tag,
  Popconfirm,
  message,
  Typography,
  Rate,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supplierService from '../../services/logistics/supplierService';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  paymentTerms: string;
  leadTime: number;
  createdAt: string;
}

export default function SupplierList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', { page, pageSize, search }],
    queryFn: () => supplierService.getAll({ page, limit: pageSize, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => supplierService.delete(id),
    onSuccess: () => {
      message.success('Xóa nhà cung cấp thành công');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: () => {
      message.error('Không thể xóa nhà cung cấp');
    },
  });

  const columns: ColumnsType<Supplier> = [
    {
      title: 'Tên nhà cung cấp',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (rating: number) => <Rate disabled value={rating} />,
    },
    {
      title: 'Điều khoản thanh toán',
      dataIndex: 'paymentTerms',
      key: 'paymentTerms',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Thời gian giao hàng',
      dataIndex: 'leadTime',
      key: 'leadTime',
      width: 120,
      render: (days: number) => `${days} ngày`,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: Supplier) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/dashboard/suppliers/${record.id}`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa nhà cung cấp"
            description="Bạn có chắc muốn xóa nhà cung cấp này?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <ShopOutlined /> Danh sách nhà cung cấp
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/dashboard/suppliers/new')}
            >
              Thêm nhà cung cấp
            </Button>
          </div>

          <Input
            placeholder="Tìm kiếm nhà cung cấp..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Table
            columns={columns}
            dataSource={data?.data || []}
            loading={isLoading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total: data?.meta?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} nhà cung cấp`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
            }}
            scroll={{ x: 1000 }}
          />
        </Space>
      </Card>
    </div>
  );
}
