import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import apiClient from '@/services/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ProductFormValues {
  sku: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  category?: string;
  isPublished: boolean;
}

export default function ProductCatalogForm() {
  const { t } = useTranslation('ecommerce');
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm<ProductFormValues>();
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ['ecommerce-product', id],
    queryFn: async () => {
      const res = await apiClient.get(`/ecommerce/products/${id}`);
      form.setFieldsValue(res.data);
      return res.data;
    },
    enabled: isEdit,
  });

  const saveMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      isEdit
        ? apiClient.patch(`/ecommerce/products/${id}`, values)
        : apiClient.post('/ecommerce/products', values),
    onSuccess: () => {
      message.success(
        isEdit
          ? t('catalog.form.messages.updateSuccess')
          : t('catalog.form.messages.createSuccess'),
      );
      queryClient.invalidateQueries({ queryKey: ['ecommerce-products'] });
      navigate('/dashboard/ecommerce/products');
    },
    onError: () => {
      message.error(t('catalog.form.messages.saveError'));
    },
  });

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space orientation="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              {isEdit ? t('catalog.form.titleEdit') : t('catalog.form.titleCreate')}
            </Title>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard/ecommerce/products')}
            >
              {t('catalog.form.back')}
            </Button>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => saveMutation.mutate(values)}
            initialValues={{ isPublished: false, stockQuantity: 0, price: 0 }}
          >
            <Form.Item
              label={t('catalog.columns.sku')}
              name="sku"
              rules={[{ required: true, message: t('catalog.form.validation.skuRequired') }]}
            >
              <Input placeholder="SKU-001" autoComplete="off" />
            </Form.Item>

            <Form.Item
              label={t('catalog.columns.name')}
              name="name"
              rules={[{ required: true, message: t('catalog.form.validation.nameRequired') }]}
            >
              <Input placeholder={t('catalog.form.placeholders.name')} autoComplete="off" />
            </Form.Item>

            <Form.Item label={t('catalog.form.fields.description')} name="description">
              <TextArea rows={3} placeholder={t('catalog.form.placeholders.description')} />
            </Form.Item>

            <Form.Item
              label={t('catalog.columns.price')}
              name="price"
              rules={[{ required: true, message: t('catalog.form.validation.priceRequired') }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label={t('catalog.form.fields.compareAtPrice')} name="compareAtPrice">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label={t('catalog.columns.stock')}
              name="stockQuantity"
              rules={[{ required: true, message: t('catalog.form.validation.stockRequired') }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label={t('catalog.form.fields.category')} name="category">
              <Select placeholder={t('catalog.form.placeholders.category')} allowClear>
                <Option value="electronics">{t('catalog.categories.electronics')}</Option>
                <Option value="clothing">{t('catalog.categories.clothing')}</Option>
                <Option value="food">{t('catalog.categories.food')}</Option>
                <Option value="other">{t('catalog.categories.other')}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={t('catalog.columns.status')}
              name="isPublished"
              valuePropName="checked"
            >
              <Switch
                checkedChildren={t('catalog.status.published')}
                unCheckedChildren={t('catalog.status.unpublished')}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saveMutation.isPending}
                >
                  {isEdit ? t('catalog.form.buttons.update') : t('catalog.form.buttons.create')}
                </Button>
                <Button onClick={() => navigate('/dashboard/ecommerce/products')}>
                  {t('catalog.form.buttons.cancel')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
