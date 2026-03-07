import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Space, Card, Tag, Popconfirm, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import customerService from '../../services/customerService';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  balance: number;
  createdAt: string;
}

export default function CustomerList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, pageSize, search }],
    queryFn: () => customerService.getAll({ page, limit: pageSize, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customerService.delete(id),
    onSuccess: () => {
      message.success('Xóa khách hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => {
      message.error('Không thể xóa khách hàng');
    },
  });

  const columns: ColumnsType<Customer> = [
    {
      title: 'Tên khách hàng',
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
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Hạn mức',
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      width: 120,
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Công nợ',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (value: number) => (
        <Tag color={value > 0 ? 'red' : 'green'}>
          {value.toLocaleString('vi-VN')} ₫
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: Customer) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/dashboard/customers/${record.id}`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa khách hàng"
            description="Bạn có chắc muốn xóa khách hàng này?"
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
              <UserOutlined /> Danh sách khách hàng
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/dashboard/customers/new')}
            >
              Thêm khách hàng
            </Button>
          </div>

          <Input
            placeholder="Tìm kiếm khách hàng..."
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
              showTotal: (total) => `Tổng ${total} khách hàng`,
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
