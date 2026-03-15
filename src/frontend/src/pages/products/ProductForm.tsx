import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Space,
  message,
  Typography,
  Row,
  Col,
  Modal,
  Badge,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, AppstoreOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import type { Product, Category } from '@/lib/offline/db';

const { Title } = Typography;
const { TextArea } = Input;

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
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
      message.error('Không thể tải sản phẩm');
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
      message.error('Không thể tải danh mục');
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
      message.success('Tạo danh mục thành công');
      logger.info('ProductForm', 'Category created', { id: newCategory.id });
      
      categoryForm.resetFields();
      setShowCategoryModal(false);
      form.setFieldsValue({ categoryId: newCategory.id });
      
      await loadCategories();
      await loadQueueSize();
    } catch (error) {
      logger.error('ProductForm', 'Failed to create category', error as Error);
      message.error('Tạo danh mục thất bại');
    } finally {
      setCreatingCategory(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      if (isEdit && id) {
        await offlineServices.products.update(id, values);
        message.success('Cập nhật sản phẩm thành công');
        logger.info('ProductForm', 'Product updated', { id });
      } else {
        await offlineServices.products.create(values);
        message.success('Tạo sản phẩm thành công');
        logger.info('ProductForm', 'Product created');
      }
      
      await loadQueueSize();
      navigate('/dashboard/products');
    } catch (error) {
      logger.error('ProductForm', 'Failed to save product', error as Error);
      message.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ padding: '24px' }}>
        <Card>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/products')}>
              Quay lại
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
          </Space>

          <Title level={3}>
            <AppstoreOutlined /> {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
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
                  label="Tên sản phẩm"
                  rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                >
                  <Input placeholder="Nhập tên sản phẩm" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="sku"
                  label="Mã SKU"
                  rules={[{ required: true, message: 'Vui lòng nhập mã SKU' }]}
                >
                  <Input placeholder="Nhập mã SKU" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="categoryId"
              label="Danh mục"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
            >
              <Select
                placeholder="Chọn danh mục"
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
                        Thêm danh mục mới
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

            <Form.Item name="description" label="Mô tả">
              <TextArea rows={3} placeholder="Nhập mô tả sản phẩm" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="price"
                  label="Giá bán"
                  rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    addonAfter="₫"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="cost"
                  label="Giá vốn"
                  rules={[{ required: true, message: 'Vui lòng nhập giá vốn' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    addonAfter="₫"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="stockQuantity"
                  label="Số lượng tồn kho"
                  rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="minStockLevel"
                  label="Ngưỡng cảnh báo tồn kho"
                  rules={[{ required: true, message: 'Vui lòng nhập ngưỡng cảnh báo' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {isEdit ? 'Cập nhật' : 'Tạo mới'}
                </Button>
                <Button onClick={() => navigate('/dashboard/products')}>Hủy</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>

      <Modal
        title="Thêm danh mục mới"
        open={showCategoryModal}
        onCancel={() => setShowCategoryModal(false)}
        footer={null}
      >
        <Form form={categoryForm} layout="vertical" onFinish={handleCreateCategory}>
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Mã danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập mã danh mục' }]}
          >
            <Input placeholder="Ví dụ: GYPSUM_BOARD" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Nhập mô tả danh mục" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={creatingCategory} block>
              Tạo danh mục
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
