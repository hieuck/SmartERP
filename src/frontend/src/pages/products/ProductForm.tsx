import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, InputNumber, Select, Button, Card, Space, message, Typography, Row, Col, Modal } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, AppstoreOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productService, { CreateProductDto, UpdateProductDto } from '../../services/productService';

const { Title } = Typography;
const { TextArea } = Input;

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const isEdit = !!id;

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(Number(id)),
    enabled: isEdit,
  });

  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        categoryId: product.categoryId,
      });
    }
  }, [product, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      setLoading(true);
      try {
        if (isEdit) {
          return await productService.update(Number(id), values as UpdateProductDto);
        } else {
          return await productService.create(values as CreateProductDto);
        }
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      message.success(isEdit ? 'Cập nhật sản phẩm thành công' : 'Tạo sản phẩm thành công');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/dashboard/products');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  const handleCreateCategory = async (values: any) => {
    try {
      setCreatingCategory(true);
      const newCategory = await productService.createCategory(values);
      message.success('Tạo danh mục thành công');
      categoryForm.resetFields();
      setShowCategoryModal(false);
      form.setFieldsValue({ categoryId: newCategory.id });
      await refetchCategories();
    } catch (error) {
      message.error('Tạo danh mục thất bại');
    } finally {
      setCreatingCategory(false);
    }
  };

  const onFinish = (values: any) => {
    saveMutation.mutate(values);
  };

  return (
    <>
      <div style={{ padding: '24px' }}>
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/products')}>
              Quay lại
            </Button>
          </Space>

          <Title level={3}>
            <AppstoreOutlined /> {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              stock: 0,
              lowStockThreshold: 10,
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
                {categoriesData?.map((cat: any) => (
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
                  name="stock"
                  label="Số lượng tồn kho"
                  rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="lowStockThreshold"
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
                <Button onClick={() => navigate('/dashboard/products')}>
                  Hủy
                </Button>
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
