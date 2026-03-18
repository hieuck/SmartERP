import { logger } from '@/lib/logger/logger.service';
import type { Category } from '@/lib/offline/db';
import { syncManager } from '@/lib/offline/sync-manager';
import { offlineServices } from '@/services/offline-services';
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  SaveOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const { Title } = Typography;
const { TextArea } = Input;

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, i18n } = useTranslation(['products', 'common']);
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const isEdit = !!id;

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

  const generateCode = (name: string) =>
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 30);

  const generateSku = (name: string) => {
    const base = generateCode(name).slice(0, 20);
    return `${base}-${Date.now().toString().slice(-5)}`;
  };

  const handleProductNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit) {
      form.setFieldValue('sku', generateSku(e.target.value));
    }
  };

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    categoryForm.setFieldValue('code', generateCode(e.target.value));
  };

  // Load product data for edit
  const loadProduct = async () => {
    if (!isEdit || !id) return;

    try {
      const product = await offlineServices.products.getById(id);
      if (product) {
        form.setFieldsValue({
          name: product.name,
          sku: product.sku,
          description: product.description,
          price: product.price,
          cost: product.cost,
          stockQuantity: product.stockQuantity,
          minStockLevel: product.minStockLevel,
          categoryId: product.categoryId,
        });
        logger.info('ProductForm', 'Loaded product from IndexedDB', { id });
      }
    } catch (error) {
      logger.error('ProductForm', 'Failed to load product', error as Error);
      message.error(t('products:messages.loadError'));
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const data = await offlineServices.categories.getAll();
      setCategories(data);
      logger.info('ProductForm', 'Loaded categories from IndexedDB', { count: data.length });
    } catch (error) {
      logger.error('ProductForm', 'Failed to load categories', error as Error);
      message.error(t('products:messages.loadError'));
    }
  };

  // Load queue size
  const loadQueueSize = async () => {
    const size = await syncManager.getQueueSize();
    setQueueSize(size);
  };

  // Initial load
  useEffect(() => {
    loadProduct();
    loadCategories();
    loadQueueSize();
  }, [id]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline) {
      handleSync();
    }
  }, [isOnline]);

  // Manual sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setSyncing(true);
      const result = await syncManager.sync(token);

      if (result.success) {
        await loadCategories();
        await loadQueueSize();
        if (isEdit) await loadProduct();
      }
    } catch (error) {
      logger.error('ProductForm', 'Sync failed', error as Error);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateCategory = async (values: any) => {
    try {
      setCreatingCategory(true);
      const newCategory = await offlineServices.categories.create(values);
      message.success(t('products:categories.createSuccess'));
      logger.info('ProductForm', 'Category created', { id: newCategory.id });

      categoryForm.resetFields();
      setShowCategoryModal(false);
      form.setFieldsValue({ categoryId: newCategory.id });

      await loadCategories();
      await loadQueueSize();
    } catch (error) {
      logger.error('ProductForm', 'Failed to create category', error as Error);
      message.error(t('products:categories.createError'));
    } finally {
      setCreatingCategory(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      if (isEdit && id) {
        await offlineServices.products.update(id, values);
        message.success(t('products:messages.updateSuccess'));
        logger.info('ProductForm', 'Product updated', { id });
      } else {
        await offlineServices.products.create(values);
        message.success(t('products:messages.createSuccess'));
        logger.info('ProductForm', 'Product created');
      }

      await loadQueueSize();
      navigate('/dashboard/products');
    } catch (error) {
      logger.error('ProductForm', 'Failed to save product', error as Error);
      message.error(t('products:messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  // Currency symbol based on locale
  const currencySymbol = i18n.language === 'vi' ? '₫' : '$';

  return (
    <>
      <div style={{ padding: '24px' }}>
        <Card>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/products')}>
              {t('products:form.backButton')}
            </Button>
            <Space>
              <Badge count={queueSize} offset={[-5, 5]}>
                <Button
                  icon={<SyncOutlined spin={syncing} />}
                  onClick={handleSync}
                  loading={syncing}
                  disabled={!isOnline}
                >
                  {t('products:sync.syncNow')}
                </Button>
              </Badge>
              <Badge
                status={isOnline ? 'success' : 'error'}
                text={t(isOnline ? 'products:sync.online' : 'products:sync.offline')}
              />
            </Space>
          </Space>

          <Title level={3}>
            <AppstoreOutlined />{' '}
            {isEdit ? t('products:form.editTitle') : t('products:form.createTitle')}
          </Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              stockQuantity: 0,
              minStockLevel: 10,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label={t('products:form.name')}
                  rules={[{ required: true, message: t('products:form.validation.nameRequired') }]}
                >
                  <Input
                    placeholder={t('products:form.placeholders.name')}
                    onChange={handleProductNameChange}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="sku"
                  label={t('products:form.sku')}
                  extra={
                    !isEdit ? t('products:form.skuAutoGenerated', 'Tự động tạo từ tên') : undefined
                  }
                >
                  <Input placeholder={t('products:form.placeholders.sku')} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="categoryId"
              label={t('products:fields.category')}
              rules={[{ required: true, message: t('products:form.validation.categoryRequired') }]}
            >
              <Select
                placeholder={t('products:form.placeholders.category')}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                      <Button
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={() => setShowCategoryModal(true)}
                        style={{ width: '100%', textAlign: 'left' }}
                      >
                        {t('products:categories.create')}
                      </Button>
                    </div>
                  </>
                )}
              >
                {categories.map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="description" label={t('products:fields.description')}>
              <TextArea rows={3} placeholder={t('products:form.placeholders.description')} />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="price"
                  label={t('products:form.price')}
                  rules={[{ required: true, message: t('products:form.validation.priceRequired') }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as unknown as 0}
                    addonAfter={currencySymbol}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="cost"
                  label={t('products:form.cost')}
                  rules={[{ required: true, message: t('products:form.validation.costRequired') }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as unknown as 0}
                    addonAfter={currencySymbol}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="stockQuantity"
                  label={t('products:fields.stockQuantity')}
                  rules={[{ required: true, message: t('products:form.validation.stockRequired') }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="minStockLevel"
                  label={t('products:fields.minStockLevel')}
                  rules={[
                    { required: true, message: t('products:form.validation.minStockRequired') },
                  ]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {isEdit ? t('products:form.updateButton') : t('products:form.createButton')}
                </Button>
                <Button onClick={() => navigate('/dashboard/products')}>
                  {t('products:form.cancelButton')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>

      <Modal
        title={t('products:categories.create')}
        open={showCategoryModal}
        onCancel={() => setShowCategoryModal(false)}
        footer={null}
      >
        <Form form={categoryForm} layout="vertical" onFinish={handleCreateCategory}>
          <Form.Item
            name="name"
            label={t('products:categories.name')}
            rules={[{ required: true, message: t('products:categories.validation.nameRequired') }]}
          >
            <Input
              placeholder={t('products:categories.placeholders.name')}
              onChange={handleCategoryNameChange}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label={t('products:categories.code')}
            extra={t('products:categories.codeAutoGenerated', 'Tự động tạo từ tên')}
          >
            <Input placeholder={t('products:categories.placeholders.code')} />
          </Form.Item>

          <Form.Item name="description" label={t('products:categories.description')}>
            <TextArea rows={3} placeholder={t('products:categories.placeholders.description')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={creatingCategory} block>
              {t('products:categories.createButton')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
