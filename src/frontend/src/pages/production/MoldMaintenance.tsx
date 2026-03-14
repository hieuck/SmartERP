/**
 * Mold Maintenance Page
 * Track and manage mold maintenance history
 * Requirements: 36.2
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Input,
  Card,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined, ToolOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import productionService, { MoldMaintenance } from '@/services/production/productionService';
import { formatCurrency, formatDate } from '@/utils/responsive';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { TextArea } = Input;

export default function MoldMaintenancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch mold
  const { data: moldData } = useQuery({
    queryKey: ['mold', id],
    queryFn: async () => {
      const response = await productionService.mold.getMold(id!);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch maintenance history
  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ['mold-maintenances', id],
    queryFn: async () => {
      const response = await productionService.mold.getMoldMaintenances(id!);
      return response.data;
    },
    enabled: !!id,
  });

  // Create maintenance mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await productionService.mold.createMoldMaintenance(id!, data);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['mold-maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['mold', id] });
      queryClient.invalidateQueries({ queryKey: ['molds'] });
      setModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  const onFinish = (values: any) => {
    createMutation.mutate({
      date: values.date.toDate(),
      type: values.type,
      description: values.description,
      cost: values.cost,
      performedBy: values.performedBy,
    });
  };

  const typeColors: Record<string, string> = {
    routine: 'blue',
    repair: 'orange',
  };

  const columns: ColumnsType<MoldMaintenance> = [
    {
      title: t('production:molds.maintenanceDate'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('production:molds.maintenanceType'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={typeColors[type]} icon={<ToolOutlined />}>
          {t(`production:molds.maintenanceTypes.${type}`)}
        </Tag>
      ),
    },
    {
      title: t('production:molds.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('production:molds.cost'),
      dataIndex: 'cost',
      key: 'cost',
      width: 130,
      align: 'right' as const,
      render: (value: number) => (value ? formatCurrency(value) : '-'),
    },
    {
      title: t('production:molds.performedBy'),
      dataIndex: 'performedBy',
      key: 'performedBy',
      width: 150,
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/production/molds')}
            >
              {t('common:actions.back')}
            </Button>
            <span>
              {t('production:molds.maintenanceHistory')} - {moldData?.name || ''}
            </span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>{t('production:molds.code')}:</strong> {moldData?.code}
          </div>
          <div>
            <strong>{t('production:molds.status')}:</strong>{' '}
            <Tag color={moldData?.status === 'available' ? 'green' : 'orange'}>
              {moldData?.status && t(`production:molds.statuses.${moldData.status}`)}
            </Tag>
          </div>
          <div>
            <strong>{t('production:molds.usageCount')}:</strong> {moldData?.usageCount || 0}
          </div>
          <div>
            <strong>{t('production:molds.lastMaintenance')}:</strong>{' '}
            {moldData?.lastMaintenanceDate ? formatDate(moldData.lastMaintenanceDate) : '-'}
          </div>
          <div>
            <strong>{t('production:molds.nextMaintenance')}:</strong>{' '}
            {moldData?.nextMaintenanceDate ? formatDate(moldData.nextMaintenanceDate) : '-'}
          </div>
        </Space>
      </Card>

      <StandardListPage
        title={t('production:molds.maintenanceHistory')}
        createButtonText={t('production:molds.recordMaintenance')}
        onCreateClick={() => setModalVisible(true)}
        columns={columns}
        dataSource={maintenanceData || []}
        loading={isLoading || createMutation.isPending}
        pagination={{
          current: 1,
          pageSize: 20,
          total: maintenanceData?.length || 0,
          showTotal: (total: number) => t('production:messages.total', { total }),
          onChange: () => {},
        }}
      />

      {/* Create Maintenance Modal */}
      <Modal
        title={t('production:molds.recordMaintenance')}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            date: dayjs(),
          }}
        >
          <Form.Item
            label={t('production:molds.maintenanceDate')}
            name="date"
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label={t('production:molds.maintenanceType')}
            name="type"
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <Select placeholder={t('production:molds.maintenanceType')}>
              <Option value="routine">{t('production:molds.maintenanceTypes.routine')}</Option>
              <Option value="repair">{t('production:molds.maintenanceTypes.repair')}</Option>
            </Select>
          </Form.Item>

          <Form.Item label={t('production:molds.description')} name="description">
            <TextArea rows={3} placeholder={t('production:molds.description')} />
          </Form.Item>

          <Form.Item label={t('production:molds.cost')} name="cost">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item label={t('production:molds.performedBy')} name="performedBy">
            <Input placeholder={t('production:molds.performedBy')} />
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
