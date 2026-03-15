import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  message,
  Modal,
  Form,
  Input,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { db, User, SyncStatus, syncManager } from '../lib/offline';

const { Title, Paragraph } = Typography;

const OfflineDemo: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await db.users.toArray();
      setUsers(allUsers);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleDelete = async (user: User) => {
    try {
      await db.users.delete(user.id);
      await syncManager.queueOperation('users', 'delete', { id: user.id });
      message.success('User deleted (will sync when online)');
      loadUsers();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // Update existing user
        const updated: User = {
          ...editingUser,
          ...values,
          updatedAt: new Date(),
          version: editingUser.version + 1,
          syncStatus: SyncStatus.PENDING,
        };
        await db.users.put(updated);
        await syncManager.queueOperation(
          'users',
          'update',
          updated,
          editingUser.version
        );
        message.success('User updated (will sync when online)');
      } else {
        // Create new user
        const newUser: User = {
          id: crypto.randomUUID(),
          tenantId: 'demo-tenant',
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          role: 'user',
          status: 'active',
          version: 1,
          syncStatus: SyncStatus.PENDING,
          offlineId: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.users.add(newUser);
        await syncManager.queueOperation('users', 'create', newUser);
        message.success('User created (will sync when online)');
      }
      setModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error('Failed to save user');
    }
  };

  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('Please login first');
      return;
    }

    setLoading(true);
    try {
      const result = await syncManager.sync(token);
      if (result.success) {
        message.success(
          `Sync completed: ${result.pulled} pulled, ${result.pushed} pushed`
        );
        loadUsers();
      } else {
        message.error(`Sync failed: ${result.errors.join(', ')}`);
      }
    } catch (error: any) {
      message.error(`Sync error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Name',
      key: 'name',
      render: (record: User) =>
        `${record.firstName || ''} ${record.lastName || ''}`.trim() || '-',
    },
    {
      title: 'Status',
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      render: (status: SyncStatus) => {
        const colors = {
          [SyncStatus.SYNCED]: 'success',
          [SyncStatus.PENDING]: 'warning',
          [SyncStatus.CONFLICT]: 'error',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Offline-First Demo</Title>
        <Paragraph>
          This page demonstrates offline-first functionality. Try the following:
        </Paragraph>
        <ul>
          <li>Create/Edit/Delete users while online</li>
          <li>Turn off your internet connection</li>
          <li>Continue creating/editing/deleting users (they'll be queued)</li>
          <li>Turn internet back on and click "Sync" to push changes</li>
        </ul>

        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add User
          </Button>
          <Button
            icon={<SyncOutlined spin={loading} />}
            onClick={handleSync}
            loading={loading}
          >
            Sync Now
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input email' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="firstName" label="First Name">
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OfflineDemo;
