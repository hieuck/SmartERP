import React, { useState, useEffect } from 'react';
import {
  App,
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
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
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import { db, User, SyncStatus, syncManager } from '../lib/offline';

const { Title, Paragraph } = Typography;

const OfflineDemo: React.FC = () => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm<Partial<User>>();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await db.users.toArray();
      setUsers(allUsers);
    } catch {
      message.error(t('offline:messages.loadFailed', { entity: t('offline:entities.users') }));
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
      message.success(t('offline:messages.deletedSuccess', { entity: t('offline:entities.user') }));
      loadUsers();
    } catch {
      message.error(t('offline:messages.deleteFailed', { entity: t('offline:entities.user') }));
    }
  };

  const handleSubmit = async (values: Partial<User>) => {
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
        message.success(t('offline:messages.updatedSuccess', { entity: t('offline:entities.user') }));
      } else {
        // Create new user
        const newUser: User = {
          id: crypto.randomUUID(),
          tenantId: 'demo-tenant',
          email: values.email || '',
          firstName: values.firstName || '',
          lastName: values.lastName || '',
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
        message.success(t('offline:messages.createdSuccess', { entity: t('offline:entities.user') }));
      }
      setModalVisible(false);
      loadUsers();
    } catch {
      message.error(t('offline:messages.saveFailed', { entity: t('offline:entities.user') }));
    }
  };

  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error(t('offline:messages.loginRequired'));
      return;
    }

    setLoading(true);
    try {
      const result = await syncManager.sync(token);
      if (result.success) {
        message.success(
          t('offline:messages.syncSuccess', { 
            pulled: result.pulled, 
            pushed: result.pushed 
          })
        );
        loadUsers();
      } else {
        message.error(
          t('offline:messages.syncFailed', { 
            errors: result.errors.join(', ') 
          })
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(
        t('offline:messages.syncError', { 
          message: errorMessage 
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: t('offline:table.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('offline:table.name'),
      key: 'name',
      render: (record: User) =>
        `${record.firstName || ''} ${record.lastName || ''}`.trim() || '-',
    },
    {
      title: t('offline:table.status'),
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      render: (status: SyncStatus) => {
        const colors = {
          [SyncStatus.SYNCED]: 'success',
          [SyncStatus.PENDING]: 'warning',
          [SyncStatus.CONFLICT]: 'error',
        };
        return <Tag color={colors[status]}>{t(`offline:syncStatus.${status.toLowerCase()}`)}</Tag>;
      },
    },
    {
      title: t('offline:table.version'),
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: t('offline:table.actions'),
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('offline:buttons.edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            {t('offline:buttons.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>{t('offline:title')}</Title>
        <Paragraph>
          {t('offline:instructions.intro')}
        </Paragraph>
        <ul>
          <li>{t('offline:instructions.step1', { entity: t('offline:entities.users') })}</li>
          <li>{t('offline:instructions.step2')}</li>
          <li>{t('offline:instructions.step3', { entity: t('offline:entities.users') })}</li>
          <li>{t('offline:instructions.step4')}</li>
        </ul>

        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {t('offline:buttons.addUser')}
          </Button>
          <Button
            icon={<SyncOutlined spin={loading} />}
            onClick={handleSync}
            loading={loading}
          >
            {t('offline:buttons.syncNow')}
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
        title={editingUser ? t('offline:modal.editUser') : t('offline:modal.addUser')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form as FormInstance<Partial<User>>} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="email"
            label={t('offline:form.email')}
            rules={[
              { required: true, message: t('offline:form.emailRequired') },
              { type: 'email', message: t('offline:form.emailInvalid') },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="firstName" label={t('offline:form.firstName')}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label={t('offline:form.lastName')}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OfflineDemo;
