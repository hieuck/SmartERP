import { useResponsive } from '@/hooks/useResponsive';
import { logger } from '@/lib/logger/logger.service';
import { AuditAction, AuditEntity, AuditLog, auditService } from '@/services/audit/auditService';
import type { ActivityTimeline, AuditQueryParams, AuditStatistics } from '@/services/audit/auditService';
import { EyeOutlined, FileTextOutlined, UserOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const { RangePicker } = DatePicker;

const actionColors: Record<AuditAction, string> = {
  [AuditAction.CREATE]: 'success',
  [AuditAction.UPDATE]: 'processing',
  [AuditAction.DELETE]: 'error',
  [AuditAction.LOGIN]: 'cyan',
  [AuditAction.LOGOUT]: 'default',
  [AuditAction.EXPORT]: 'purple',
  [AuditAction.IMPORT]: 'orange',
};

export default function AuditLogPage() {
  const { isMobile } = useResponsive();
  const { t } = useTranslation(['audit', 'common']);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [timeline, setTimeline] = useState<ActivityTimeline[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filters, setFilters] = useState<AuditQueryParams>({
    page: 1,
    limit: 20,
    action: undefined as AuditAction | undefined,
    entity: undefined as AuditEntity | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  useEffect(() => {
    fetchLogs();
    fetchStatistics();
    fetchTimeline();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await auditService.getAll(filters);
      setLogs(response.data || []);
      setTotal(response.total || 0);
    } catch (error: unknown) {
      logger.error('AuditLogPage', 'Error fetching audit logs', error instanceof Error ? error : new Error('Error fetching audit logs'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await auditService.getStatistics();
      setStatistics(stats);
    } catch (error: unknown) {
      logger.error('AuditLogPage', 'Error fetching statistics', error instanceof Error ? error : new Error('Error fetching statistics'));
    }
  };

  const fetchTimeline = async () => {
    try {
      const data = await auditService.getTimeline(30);
      setTimeline(data);
    } catch (error: unknown) {
      logger.error('AuditLogPage', 'Error fetching timeline', error instanceof Error ? error : new Error('Error fetching timeline'));
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDrawerVisible(true);
  };

  const renderValue = (value: unknown): ReactNode => {
    if (!value) return '-';
    if (typeof value === 'object') {
      return <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(value, null, 2)}</pre>;
    }
    return String(value);
  };

  const getActionLabel = (action: AuditAction): string => {
    const actionKey = action.toLowerCase();
    return t(`audit:actions.${actionKey}`);
  };

  const getEntityLabel = (entity: AuditEntity | string): string => {
    const entityKey = entity.toLowerCase().replace(/_/g, '');
    return t(`audit:entities.${entityKey}`);
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: t('audit:columns.time'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: t('audit:columns.user'),
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('audit:columns.action'),
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: AuditAction) => (
        <Tag color={actionColors[action]}>{getActionLabel(action)}</Tag>
      ),
    },
    {
      title: t('audit:columns.entity'),
      dataIndex: 'entity',
      key: 'entity',
      width: 130,
      render: (entity: AuditEntity) => getEntityLabel(entity),
    },
    {
      title: t('audit:columns.entityId'),
      dataIndex: 'entityId',
      key: 'entityId',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('audit:columns.ip'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
    },
    {
      title: t('audit:columns.operations'),
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_value: unknown, record: AuditLog) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          {t('audit:columns.view')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('audit:statistics.totalActivities')}
              value={statistics?.totalLogs || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('audit:statistics.activeUsers')}
              value={statistics?.topUsers?.length || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('audit:statistics.creates')}
              value={statistics?.byAction?.[AuditAction.CREATE] || 0}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('audit:statistics.deletes')}
              value={statistics?.byAction?.[AuditAction.DELETE] || 0}
              styles={{ content: { color: '#cf1322' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title={t('audit:charts.last30Days')}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => dayjs(value).format('DD/MM')} />
                <YAxis />
                <Tooltip labelFormatter={(label) => dayjs(label).format('DD/MM/YYYY')} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t('audit:charts.activityCount')}
                  stroke="#1890ff"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t('audit:charts.byType')}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={Object.entries(statistics?.byAction || {}).map(([action, count]) => ({
                  action: getActionLabel(action as AuditAction),
                  count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="action" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title={t('audit:title')}>
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Select
              placeholder={t('audit:filters.action')}
              style={{ width: 150 }}
              allowClear
              value={filters.action}
              onChange={(value) => setFilters({ ...filters, action: value, page: 1 })}
            >
              {Object.values(AuditAction).map((action) => (
                <Select.Option key={action} value={action}>
                  {getActionLabel(action)}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder={t('audit:filters.entity')}
              style={{ width: 150 }}
              allowClear
              value={filters.entity}
              onChange={(value) => setFilters({ ...filters, entity: value, page: 1 })}
            >
              {Object.values(AuditEntity).map((entity) => (
                <Select.Option key={entity} value={entity}>
                  {getEntityLabel(entity)}
                </Select.Option>
              ))}
            </Select>
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={[t('audit:filters.startDate'), t('audit:filters.endDate')]}
              onChange={(dates) => {
                setFilters({
                  ...filters,
                  startDate: dates?.[0]?.format('YYYY-MM-DD'),
                  endDate: dates?.[1]?.format('YYYY-MM-DD'),
                  page: 1,
                });
              }}
            />
          </Space>

          <Table
            loading={loading}
            dataSource={logs}
            columns={columns}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total,
              showSizeChanger: true,
              showTotal: (total) => t('audit:pagination.total', { count: total }),
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, limit: pageSize });
              },
            }}
          />
        </Space>
      </Card>

      <Drawer
        title={t('audit:details.title')}
        placement="right"
        size={isMobile ? 'large' : 'default'}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedLog && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t('audit:details.id')}>{selectedLog.id}</Descriptions.Item>
            <Descriptions.Item label={t('audit:details.user')}>
              {selectedLog.userId}
            </Descriptions.Item>
            <Descriptions.Item label={t('audit:details.action')}>
              <Tag color={actionColors[selectedLog.action]}>
                {getActionLabel(selectedLog.action)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('audit:details.entity')}>
              {getEntityLabel(selectedLog.entity)}
            </Descriptions.Item>
            <Descriptions.Item label={t('audit:details.entityId')}>
              {selectedLog.entityId}
            </Descriptions.Item>
            <Descriptions.Item label={t('audit:details.time')}>
              {dayjs(selectedLog.createdAt).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label={t('audit:details.ip')}>
              {selectedLog.ipAddress || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('audit:details.userAgent')}>
              {selectedLog.userAgent || '-'}
            </Descriptions.Item>
            {Boolean(selectedLog.oldValue) && (
              <Descriptions.Item label={t('audit:details.oldValue')}>
                {renderValue(selectedLog.oldValue)}
              </Descriptions.Item>
            )}
            {Boolean(selectedLog.newValue) && (
              <Descriptions.Item label={t('audit:details.newValue')}>
                {renderValue(selectedLog.newValue)}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
