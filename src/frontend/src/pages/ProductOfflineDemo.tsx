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
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Product, SyncStatus } from '../lib/offline/db';
import { offlineServices } from '../services/offline-services';
import { syncManager } from '../lib/offline/sync-manager';

const { Title, Paragraph } = Typography;

export const ProductOfflineDemo: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await offlineServices.products.getAll();
      setProducts(allProducts);
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const handleDelete = async (product: Product) => {
    try {
      await offlineServices.products.delete(product.id);
      message.success('Product deleted (will sync when online)');
      loadProducts();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingProduct) {
        // Update existing product
        await offlineServices.products.update(editingProduct.id, values);
        message.success('Product updated (will sync when online)');
      } else {
        // Create new product
        await offlineServices.products.create({
          tenantId: 'demo-tenant',
          name: values.name,
          sku: values.sku,
          price: values.price,
          cost: values.cost,
          description: values.description,
          status: 'active',
        } as any);
        message.success('Product created (will sync when online)');
      }
      setModalVisible(false);
      loadProducts();
    } catch (error: any) {
      message.error(`Failed to save product: ${error.message}`);
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
        loadProducts();
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
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
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
      render: (record: Product) => (
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
        <Title level={2}>Product Offline-First Demo</Title>
        <Paragraph>
          This page demonstrates offline-first functionality with Products using
          the generic OfflineService. Try the following:
        </Paragraph>
        <ul>
          <li>Create/Edit/Delete products while online</li>
          <li>Turn off your internet connection</li>
          <li>Continue creating/editing/deleting products (they'll be queued)</li>
          <li>Turn internet back on and click "Sync" to push changes</li>
        </ul>

        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Product
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
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="sku"
            label="SKU"
            rules={[{ required: true, message: 'Please input SKU' }]}
          >
            <Input disabled={!!editingProduct} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please input price' }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="cost"
            label="Cost"
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
