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
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import { Product, SyncStatus } from '../lib/offline/db';
import { offlineServices } from '../services/offline-services';
import { syncManager } from '../lib/offline/sync-manager';

const { Title, Paragraph } = Typography;
type ProductDraft = Omit<Product, 'id' | 'tenantId' | 'version' | 'lastSyncedAt' | 'syncStatus' | 'offlineId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export const ProductOfflineDemo: React.FC = () => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm<Partial<Product>>();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await offlineServices.products.getAll();
      setProducts(allProducts);
    } catch {
      message.error(t('offline:messages.loadFailed', { entity: t('offline:entities.products') }));
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
    form.setFieldsValue({
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      cost: product.cost,
      status: product.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (product: Product) => {
    try {
      await offlineServices.products.delete(product.id);
      message.success(t('offline:messages.deletedSuccess', { entity: t('offline:entities.product') }));
      loadProducts();
    } catch {
      message.error(t('offline:messages.deleteFailed', { entity: t('offline:entities.product') }));
    }
  };

  const handleSubmit = async (values: Partial<Product>) => {
    try {
      if (editingProduct) {
        // Update existing product
        await offlineServices.products.update(editingProduct.id, values as Partial<ProductDraft>);
        message.success(t('offline:messages.updatedSuccess', { entity: t('offline:entities.product') }));
      } else {
        // Create new product
        const newProduct: ProductDraft = {
          name: values.name || '',
          sku: values.sku || '',
          price: values.price || 0,
          cost: values.cost,
          description: values.description,
          status: 'active',
        };
        await offlineServices.products.create(newProduct);
        message.success(t('offline:messages.createdSuccess', { entity: t('offline:entities.product') }));
      }
      setModalVisible(false);
      loadProducts();
    } catch {
      message.error(t('offline:messages.saveFailed', { entity: t('offline:entities.product') }));
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
        loadProducts();
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
      title: t('offline:table.sku'),
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: t('offline:table.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('offline:table.price'),
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price.toFixed(2)}`,
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
      render: (record: Product) => (
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
        <Title level={2}>{t('offline:productTitle')}</Title>
        <Paragraph>
          {t('offline:instructions.productIntro')}
        </Paragraph>
        <ul>
          <li>{t('offline:instructions.step1', { entity: t('offline:entities.products') })}</li>
          <li>{t('offline:instructions.step2')}</li>
          <li>{t('offline:instructions.step3', { entity: t('offline:entities.products') })}</li>
          <li>{t('offline:instructions.step4')}</li>
        </ul>

        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {t('offline:buttons.addProduct')}
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
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingProduct ? t('offline:modal.editProduct') : t('offline:modal.addProduct')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form as FormInstance<Partial<Product>>} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="sku"
            label={t('offline:form.sku')}
            rules={[{ required: true, message: t('offline:form.skuRequired') }]}
          >
            <Input disabled={!!editingProduct} />
          </Form.Item>
          <Form.Item
            name="name"
            label={t('offline:form.productName')}
            rules={[{ required: true, message: t('offline:form.nameRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('offline:form.description')}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="price"
            label={t('offline:form.price')}
            rules={[{ required: true, message: t('offline:form.priceRequired') }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="cost"
            label={t('offline:form.cost')}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
