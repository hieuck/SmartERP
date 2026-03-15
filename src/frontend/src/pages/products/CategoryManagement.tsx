import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Space, Modal, Form, Input, message, Popconfirm, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, SyncOutlined, WifiOutlined, CloudOutlined } from '@ant-design/icons';
import { useResponsive } from '@/hooks/useResponsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import type { Category } from '@/lib/offline/db';

export default function CategoryManagement() {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load categories from IndexedDB
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await offlineServices.categories.getAll();
      setCategories(data);
      logger.info('CategoryManagement', 'Loaded categories from IndexedDB', { count: data.length });
    } catch (error) {
      logger.error('CategoryManagement', 'Failed to load categories', error as Error);
      message.error('Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  // Load queue size
  const loadQueueSize = async () => {
    const size = await syncManager.getQueueSize();
    setQueueSize(size);
  };

  // Initial load
  useEffect(() => {
    loadCategories();
    loadQueueSize();
  }, []);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline) {
      handleSync();
    }
  }, [isOnline]);

  // Manual sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để đồng bộ');
      return;
    }

    try {
      setSyncing(true);
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(`Đồng bộ thành công: ${result.pulled} pulled, ${result.pushed} pushed`);
        await loadCategories();
        await loadQueueSize();
      } else {
        message.error(`Đồng bộ thất bại: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('CategoryManagement', 'Sync failed', error as Error);
      message.error('Đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue(category);
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCategory) {
        await offlineServices.categories.update(editingCategory.id, values);
        message.success('Cập nhật danh mục thành công!');
        logger.info('CategoryManagement', 'Category updated', { id: editingCategory.id });
      } else {
        await offlineServices.categories.create(values);
        message.success('Tạo danh mục thành công!');
        logger.info('CategoryManagement', 'Category created');
      }
      
      handleCloseModal();
      await loadCategories();
      await loadQueueSize();
    } catch (error) {
      logger.error('CategoryManagement', 'Failed to save category', error as Error);
      message.error(editingCategory ? 'Cập nhật danh mục thất bại!' : 'Tạo danh mục thất bại!');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await offlineServices.categories.delete(id);
      message.success('Xóa danh mục thành công!');
      logger.info('CategoryManagement', 'Category deleted', { id });
      await loadCategories();
      await loadQueueSize();
    } catch (error) {
      logger.error('CategoryManagement', 'Failed to delete category', error as Error);
      message.error('Xóa danh mục thất bại!');
    }
  };

  const getSyncStatusBadge = (category: Category) => {
    if (category.syncStatus === 'synced') {
      return <Badge status="success" text="Synced" />;
    } else if (category.syncStatus === 'pending') {
      return <Badge status="warning" text="Pending" />;
    } else if (category.syncStatus === 'conflict') {
      return <Badge status="error" text="Conflict" />;
    }
    return null;
  };

  const columns = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Trạng thái đồng bộ',
      key: 'syncStatus',
      width: 150,
      render: (_: any, record: Category) => getSyncStatusBadge(record),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: any, record: Category) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa danh mục"
            description="Bạn có chắc muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record.id)}
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
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
          Quay Lại
        </Button>
        <Space>
          <Badge count={queueSize} offset={[-5, 5]}>
            <Button
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
              disabled={!isOnline}
            >
              Đồng bộ
            </Button>
          </Badge>
          <Badge status={isOnline ? 'success' : 'error'} text={isOnline ? 'Online' : 'Offline'} />
        </Space>
      </div>
      <Card
        title="Quản lý danh mục sản phẩm"
        bordered={false}
        style={{ margin: 0 }}
        bodyStyle={{ padding: 0 }}
        headStyle={{ paddingLeft: 24, paddingRight: 24 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Thêm danh mục
          </Button>
        }
      >
        <Table
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 'max-content' }}
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="Ví dụ: Tấm thạch cao" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Mã danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập mã danh mục!' }]}
          >
            <Input placeholder="Ví dụ: GYPSUM_BOARD" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả danh mục" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingCategory ? 'Cập nhật' : 'Tạo mới'}
              </Button>
              <Button onClick={handleCloseModal}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
