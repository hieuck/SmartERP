/**
 * Production Order Detail Page
 * View and manage production order details
 * Requirements: 37.2
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Space, Tag, Descriptions, Progress, Spin, Row, Col, Statistic } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import productionService from '@/services/production/productionService';
import { formatDate } from '@/utils/responsive';
import { useResponsive } from '@/hooks/useResponsive';
import { getCardSize } from '@/utils/responsive';

export default function ProductionOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const responsive = useResponsive();

  // Fetch production order
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['production-order', id],
    queryFn: async () => {
      const response = await productionService.productionOrder.getProductionOrder(id!);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch production progress
  const { data: progressData } = useQuery({
    queryKey: ['production-progress', id],
    queryFn: async () => {
      const response = await productionService.productionOrder.getProductionProgress(id!);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch quality inspections
  const { data: inspectionsData } = useQuery({
    queryKey: ['quality-inspections', id],
    queryFn: async () => {
      const response = await productionService.productionOrder.getQualityInspections(id!);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  const statusColors: Record<string, string> = {
    draft: 'default',
    in_progress: 'blue',
    paused: 'orange',
    completed: 'green',
    cancelled: 'red',
  };

  const completionRate = orderData.quantity > 0
    ? Math.round((orderData.producedQuantity / orderData.quantity) * 100)
    : 0;

  const defectRate = orderData.producedQuantity > 0
    ? Math.round(((orderData.defectQuantity + orderData.wasteQuantity) / orderData.producedQuantity) * 100)
    : 0;

  return (
    <div>
      <Card
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/production/orders')}
            >
              {t('common:actions.back')}
            </Button>
            <span>{t('production:orders.detail')} - {orderData.code}</span>
          </Space>
        }
        size={getCardSize(responsive)}
        extra={
          <Tag color={statusColors[orderData.status]}>
            {t(`production:orders.statuses.${orderData.status}`)}
          </Tag>
        }
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }}>
          <Descriptions.Item label={t('production:orders.code')}>
            {orderData.code}
          </Descriptions.Item>
          <Descriptions.Item label={t('production:orders.product')}>
            {orderData.productName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('production:orders.quantity')}>
            {orderData.quantity.toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label={t('production:orders.producedQuantity')}>
            {orderData.producedQuantity.toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label={t('production:orders.startDate')}>
            {formatDate(orderData.startDate)}
          </Descriptions.Item>
          <Descriptions.Item label={t('production:orders.expectedEndDate')}>
            {formatDate(orderData.expectedEndDate)}
          </Descriptions.Item>
          {orderData.actualEndDate && (
            <Descriptions.Item label={t('production:orders.actualEndDate')}>
              {formatDate(orderData.actualEndDate)}
            </Descriptions.Item>
          )}
          <Descriptions.Item label={t('production:orders.notes')} span={2}>
            {orderData.notes || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('production:orders.progress')}
              value={completionRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
            <Progress percent={completionRate} status={completionRate === 100 ? 'success' : 'active'} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title={t('production:orders.defectQuantity')}
              value={orderData.defectQuantity}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title={t('production:reports.defectRate')}
              value={defectRate}
              suffix="%"
              valueStyle={{ color: defectRate > 5 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {progressData && progressData.length > 0 && (
        <Card title={t('production:orders.progress')} style={{ marginTop: 16 }}>
          {progressData.map((progress: any, index: number) => (
            <div key={index} style={{ marginBottom: 16 }}>
              <div>
                <strong>{progress.stage}</strong> - {progress.completedQuantity} {t('production:orders.quantity')}
              </div>
              {progress.worker && <div>{t('production:workers.name')}: {progress.worker.fullName}</div>}
              {progress.notes && <div>{t('production:orders.notes')}: {progress.notes}</div>}
            </div>
          ))}
        </Card>
      )}

      {inspectionsData && inspectionsData.length > 0 && (
        <Card title={t('production:orders.qualityInspection')} style={{ marginTop: 16 }}>
          {inspectionsData.map((inspection: any, index: number) => (
            <div key={index} style={{ marginBottom: 16 }}>
              <div>
                <strong>{formatDate(inspection.inspectionDate)}</strong> -{' '}
                <Tag color={inspection.result === 'pass' ? 'green' : 'red'}>
                  {inspection.result}
                </Tag>
              </div>
              <div>
                {t('production:orders.quantity')}: {inspection.passedQuantity} / {inspection.failedQuantity}
              </div>
              {inspection.defectDescription && (
                <div>{t('production:molds.description')}: {inspection.defectDescription}</div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
