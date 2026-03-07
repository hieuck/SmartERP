import React, { useState } from 'react';
import { Table, Button, Space, Tag, Input, Card, message, Typography, Dropdown, Modal } from 'antd';
import type { ColumnsType, MenuProps } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, UserOutlined, EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authService from '../../services/authService';
import dayjs from 'dayjs';

const { Title } = Typography;

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const roleColors: Record<string, string> = {
  ADMIN: 'red',
  MANAGER: 'orange',
  USER: 'blue',
  VIEWER: 'default',
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  USER: 'Người dùng',
  VIEWER: 'Xem',
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, pageSize, search }],
    queryFn: async () => {
      // Mock data since we don't have user list endpoint yet
      return {
        data: [],
        meta: { total: 0, page, limit: pageSize },
      };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Mock delete - implement when backend ready
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      message.success('Xóa người dùng thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('Không thể xóa người dùng');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      // Mock toggle - implement when backend ready
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      message.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('Không thể cập nhật trạng thái');
    },
  });

  const handleResetPassword = (id: number) => {
    Modal.confirm({
      title: 'Đặt lại mật khẩu',
      content: 'Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng này?',
      onOk: async () => {
        try {
          // Mock reset password - implement when backend ready
          message.success('Đã gửi email đặt lại mật khẩu');
        } catch (error) {
          message.error('Không thể đặt lại mật khẩu');
        }
      },
    });
  };

  const getActionMenu = (record: User): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Xem chi tiết',
      onClick: () => navigate(`/dashboard/users/${record.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Chỉnh sửa',
      onClick: () => navigate(`/dashboard/users/${record.id}/edit`),
    },
    {
      key: 'reset-password',
      icon: <LockOutlined />,
      label: 'Đặt lại mật khẩu',
      onClick: () => handleResetPassword(record.id),
    },
    {
      key: 'toggle-active',
      label: record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt',
      onClick: () => toggleActiveMutation.mutate({ id: record.id, isActive: !record.isActive }),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Xóa',
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: 'Xác nhận xóa',
          content: 'Bạn có chắc chắn muốn xóa người dùng này?',
          onOk: () => deleteMutation.mutate(record.id),
        });
      },
    },
  ];

  const columns: ColumnsType<User> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 250,
      render: (text: string, record: User) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/users/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Họ tên',
      key: 'fullName',
      width: 200,
      render: (_: any, record: User) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: string) => (
        <Tag color={roleColors[role]}>{roleLabels[role] || role}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Vô hiệu'}
        </Tag>
      ),
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: User) => (
        <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <UserOutlined /> Quản lý người dùng
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/dashboard/users/new')}
            >
              Thêm người dùng
            </Button>
          </div>

          <Input
            placeholder="Tìm kiếm người dùng..."
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
              showTotal: (total) => `Tổng ${total} người dùng`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
            }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>
    </div>
  );
};

export default UserList;
