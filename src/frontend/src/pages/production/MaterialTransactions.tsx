/**
 * Material Transactions Page
 * View and manage material inventory transactions
 * Requirements: 35.2
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import productionService, { MaterialTransaction } from '@/services/production/productionService';
import { formatDate } from '@/utils/responsive';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { TextArea } = Input;

export default function MaterialTransactions() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch material
  const { data: materialData } = useQuery({
    queryKey: ['material', id],
    queryFn: async () => {
      const response = await productionService.material.getMaterial(id!);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['material-transactions', id],
    queryFn: async () => {
      const response = await productionService.material.getMaterialTransactions({
        materialId: id,
      });
      return response.data;
    },
    enabled: !!id,
  });

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await productionService.material.createMaterialTransaction(data);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['material-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['material', id] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  const onFinish = (values: any) => {
    createMutation.mutate({
      materialId: id,
      type: values.type,
      quantity: values.quantity,
      notes: values.notes,
    });
  };

  const typeColors: Record<string, string> = {
    in: 'green',
    out: 'red',
    adjustment: 'blue',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    in: <ArrowUpOutlined />,
    out: <ArrowDownOutlined />,
    adjustment: null,
  };

  const columns: ColumnsType<MaterialTransaction> = [
    {
      title: t('production:materials.transactions'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={typeColors[type]} icon={typeIcons[type]}>
          {t(`production:materials.transactionTypes.${type}`)}
        </Tag>
      ),
    },
    {
      title: t('production:piecework.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right' as const,
      render: (value: number, record: MaterialTransaction) => {
        const color = record.type === 'in' ? '#52c41a' : record.type === 'out' ? '#ff4d4f' : undefined;
        return (
          <span style={{ color, fontWeight: 'bold' }}>
            {record.type === 'in' ? '+' : record.type === 'out' ? '-' : ''}
            {value.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: t('production:piecework.date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('production:piecework.notes'),
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
  ];

  const totalIn = transactionsData?.filter((t: MaterialTransaction) => t.type === 'in')
    .reduce((sum: number, t: MaterialTransaction) => sum + t.quantity, 0) || 0;
  const totalOut = transactionsData?.filter((t: MaterialTransaction) => t.type === 'out')
    .reduce((sum: number, t: MaterialTransaction) => sum + t.quantity, 0) || 0;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('production:materials.quantity')}
              value={materialData?.quantity || 0}
              suffix={materialData?.unit}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title={t('production:materials.transactionTypes.in')}
              value={totalIn}
              suffix={materialData?.unit}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title={t('production:materials.transactionTypes.out')}
              value={totalOut}
              suffix={materialData?.unit}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <StandardListPage
        title={`${t('production:materials.transactions')} - ${materialData?.name || ''}`}
        createButtonText={t('production:actions.save')}
        onCreateClick={() => setModalVisible(true)}
        columns={columns}
        dataSource={transactionsData || []}
        loading={isLoading || createMutation.isPending}
        pagination={{
          current: 1,
          pageSize: 20,
          total: transactionsData?.length || 0,
          showTotal: (total: number) => t('production:messages.total', { total }),
          onChange: () => {},
        }}
      />

      {/* Create Transaction Modal */}
      <Modal
        title={t('production:materials.transactions')}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={t('production:materials.type')}
            name="type"
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <Select placeholder={t('production:materials.type')}>
              <Option value="in">{t('production:materials.transactionTypes.in')}</Option>
              <Option value="out">{t('production:materials.transactionTypes.out')}</Option>
              <Option value="adjustment">{t('production:materials.transactionTypes.adjustment')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={t('production:piecework.quantity')}
            name="quantity"
            rules={[
              { required: true, message: t('production:validation.required') },
              { type: 'number', min: 1, message: t('production:validation.minQuantity') },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item label={t('production:piecework.notes')} name="notes">
            <TextArea rows={3} placeholder={t('production:piecework.notes')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                {t('production:actions.save')}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                {t('production:actions.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
