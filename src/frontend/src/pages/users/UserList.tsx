/**
 * User List Page
 * Displays list of users with search and CRUD operations
 * Uses StandardListPage with dropdown menu for actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, message, Modal, Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd/es/menu';
import {
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import StandardListPage from '../../components/common/StandardListPage';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

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
  admin: 'red',
  MANAGER: 'orange',
  manager: 'orange',
  USER: 'blue',
  user: 'blue',
  staff: 'blue',
  VIEWER: 'default',
  viewer: 'default',
};

export default function UserList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['users', 'commonUi']);
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
      message.success(t('users:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error(t('users:messages.deleteError'));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      // Mock toggle - implement when backend ready
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      message.success(t('users:messages.updateStatusSuccess'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error(t('users:messages.updateStatusError'));
    },
  });

  const handleResetPassword = (id: number) => {
    Modal.confirm({
      title: t('users:messages.resetPasswordConfirm'),
      content: t('users:messages.resetPasswordDescription'),
      onOk: async () => {
        try {
          // Mock reset password - implement when backend ready
          message.success(t('users:messages.resetPasswordSuccess'));
        } catch (error) {
          message.error(t('users:messages.resetPasswordError'));
        }
      },
    });
  };

  const getActionMenu = (record: User): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('users:actions.viewDetail'),
      onClick: () => navigate(`/dashboard/users/${record.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('users:actions.edit'),
      onClick: () => navigate(`/dashboard/users/${record.id}/edit`),
    },
    {
      key: 'reset-password',
      icon: <LockOutlined />,
      label: t('users:actions.resetPassword'),
      onClick: () => handleResetPassword(record.id),
    },
    {
      key: 'toggle-active',
      label: record.isActive ? t('users:actions.deactivate') : t('users:actions.activate'),
      onClick: () => toggleActiveMutation.mutate({ id: record.id, isActive: !record.isActive }),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('users:actions.delete'),
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: t('users:messages.deleteConfirm'),
          content: t('users:messages.deleteDescription'),
          onOk: () => deleteMutation.mutate(record.id),
        });
      },
    },
  ];

  const columns: ColumnsType<User> = [
    {
      title: t('users:columns.email'),
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
      title: t('users:columns.fullName'),
      key: 'fullName',
      width: 200,
      render: (_: any, record: User) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: t('users:columns.role'),
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: string) => {
        const roleKey = role.toLowerCase();
        return (
          <Tag color={roleColors[role] || roleColors[roleKey]}>
            {t(`users:roles.${roleKey}`, { defaultValue: role })}
          </Tag>
        );
      },
    },
    {
      title: t('users:columns.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {t(`users:status.${isActive ? 'active' : 'inactive'}`)}
        </Tag>
      ),
    },
    {
      title: t('users:columns.lastLogin'),
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'),
    },
    {
      title: t('users:columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('commonUi:table.actions'),
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
    <StandardListPage
      title={
        <>
          <UserOutlined /> {t('users:title')}
        </>
      }
      createButtonText={t('users:createButton')}
      onCreateClick={() => navigate('/dashboard/users/new')}
      searchPlaceholder={t('users:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={data?.data || []}
      loading={isLoading}
      rowKey="id"
      pagination={{
        current: page,
        pageSize,
        total: data?.meta?.total || 0,
        showTotal: (total) => t('users:messages.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
