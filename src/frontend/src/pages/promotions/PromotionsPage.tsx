import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Switch,
  message,
  Popconfirm,
  Tabs,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons';
import promotionService, { Promotion, Coupon } from '../../services/crm/promotionService';
import dayjs from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const PromotionsPage: React.FC = () => {
  const { isMobile } = useResponsive();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'promotion' | 'coupon'>('promotion');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPromotions();
    loadCoupons();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const result = await promotionService.getPromotions();
      setPromotions(result.data);
    } catch (error) {
      message.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      const result = await promotionService.getCoupons();
      setCoupons(result.data);
    } catch (error) {
      message.error('Failed to load coupons');
    }
  };

  const handleAdd = (type: 'promotion' | 'coupon') => {
    setModalType(type);
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (id: string, type: 'promotion' | 'coupon') => {
    setModalType(type);
    setEditingId(id);

    try {
      if (type === 'promotion') {
        const promotion = await promotionService.getPromotion(id);
        form.setFieldsValue({
          ...promotion,
          dateRange: [dayjs(promotion.startDate), dayjs(promotion.endDate)],
        });
      } else {
        const coupon = await promotionService.getCoupon(id);
        form.setFieldsValue({
          ...coupon,
          dateRange: [dayjs(coupon.startDate), dayjs(coupon.endDate)],
        });
      }
      setModalVisible(true);
    } catch (error) {
      message.error(`Failed to load ${type}`);
    }
  };

  const handleDelete = async (id: string, type: 'promotion' | 'coupon') => {
    try {
      if (type === 'promotion') {
        await promotionService.deletePromotion(id);
        message.success('Promotion deleted');
        loadPromotions();
      } else {
        await promotionService.deleteCoupon(id);
        message.success('Coupon deleted');
        loadCoupons();
      }
    } catch (error) {
      message.error(`Failed to delete ${type}`);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        dateRange: undefined,
      };

      if (modalType === 'promotion') {
        if (editingId) {
          await promotionService.updatePromotion(editingId, data);
          message.success('Promotion updated');
        } else {
          await promotionService.createPromotion(data);
          message.success('Promotion created');
        }
        loadPromotions();
      } else {
        if (editingId) {
          await promotionService.updateCoupon(editingId, data);
          message.success('Coupon updated');
        } else {
          await promotionService.createCoupon(data);
          message.success('Coupon created');
        }
        loadCoupons();
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(`Failed to save ${modalType}`);
    }
  };

  const promotionColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'percentage' ? 'blue' : 'green'}>
          {type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
        </Tag>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number, record: Promotion) =>
        record.type === 'percentage' ? `${value}%` : `${value.toLocaleString()} VND`,
    },
    {
      title: 'Period',
      key: 'period',
      render: (_: any, record: Promotion) =>
        `${dayjs(record.startDate).format('DD/MM/YYYY')} - ${dayjs(record.endDate).format('DD/MM/YYYY')}`,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Usage',
      dataIndex: 'usageCount',
      key: 'usageCount',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Promotion) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id, 'promotion')}
          />
          <Popconfirm
            title="Delete this promotion?"
            onConfirm={() => handleDelete(record.id, 'promotion')}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const couponColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="purple">{code}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'percentage' ? 'blue' : 'green'}>
          {type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
        </Tag>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number, record: Coupon) =>
        record.type === 'percentage' ? `${value}%` : `${value.toLocaleString()} VND`,
    },
    {
      title: 'Period',
      key: 'period',
      render: (_: any, record: Coupon) =>
        `${dayjs(record.startDate).format('DD/MM/YYYY')} - ${dayjs(record.endDate).format('DD/MM/YYYY')}`,
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_: any, record: Coupon) =>
        `${record.usageCount}${record.usageLimit ? ` / ${record.usageLimit}` : ''}`,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Coupon) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id, 'coupon')}
          />
          <Popconfirm
            title="Delete this coupon?"
            onConfirm={() => handleDelete(record.id, 'coupon')}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Tabs
          tabBarExtraContent={
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('promotion')}>
                New Promotion
              </Button>
              <Button icon={<GiftOutlined />} onClick={() => handleAdd('coupon')}>
                New Coupon
              </Button>
            </Space>
          }
        >
          <TabPane tab="Promotions" key="promotions">
            <Table
              size={isMobile ? 'small' : 'middle'}
              scroll={{ x: 'max-content' }}
              columns={promotionColumns}
              dataSource={promotions}
              rowKey="id"
              loading={loading}
            />
          </TabPane>

          <TabPane tab="Coupons" key="coupons">
            <Table
              size={isMobile ? 'small' : 'middle'}
              scroll={{ x: 'max-content' }}
              columns={couponColumns}
              dataSource={coupons}
              rowKey="id"
              loading={loading}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={`${editingId ? 'Edit' : 'Create'} ${modalType === 'promotion' ? 'Promotion' : 'Coupon'}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          {modalType === 'promotion' ? (
            <>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <TextArea rows={3} />
              </Form.Item>
            </>
          ) : (
            <Form.Item name="code" label="Coupon Code" rules={[{ required: true }]}>
              <Input placeholder="e.g., SUMMER2024" />
            </Form.Item>
          )}

          <Form.Item name="type" label="Discount Type" rules={[{ required: true }]}>
            <Select>
              <Option value="percentage">Percentage</Option>
              <Option value="fixed">Fixed Amount</Option>
            </Select>
          </Form.Item>

          <Form.Item name="value" label="Discount Value" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="dateRange" label="Valid Period" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="minOrderAmount" label="Minimum Order Amount">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          {modalType === 'coupon' && (
            <Form.Item name="usageLimit" label="Usage Limit">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          )}

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionsPage;
