import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Select,
  DatePicker,
  Space,
  Descriptions,
  Drawer,
  Button,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  EyeOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  auditService,
  AuditLog,
  AuditAction,
  AuditEntity,
} from '@/services/audit/auditService';
import { logger } from '@/lib/logger/logger.service';
import dayjs from 'dayjs';
import { useResponsive } from '@/hooks/useResponsive';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
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

const actionLabels: Record<AuditAction, string> = {
  [AuditAction.CREATE]: 'Tạo mới',
  [AuditAction.UPDATE]: 'Cập nhật',
  [AuditAction.DELETE]: 'Xóa',
  [AuditAction.LOGIN]: 'Đăng nhập',
  [AuditAction.LOGOUT]: 'Đăng xuất',
  [AuditAction.EXPORT]: 'Xuất dữ liệu',
  [AuditAction.IMPORT]: 'Nhập dữ liệu',
};

const entityLabels: Record<AuditEntity, string> = {
  [AuditEntity.USER]: 'Người dùng',
  [AuditEntity.PRODUCT]: 'Sản phẩm',
  [AuditEntity.INVENTORY]: 'Kho hàng',
  [AuditEntity.ORDER]: 'Đơn hàng',
  [AuditEntity.CUSTOMER]: 'Khách hàng',
  [AuditEntity.SUPPLIER]: 'Nhà cung cấp',
  [AuditEntity.PURCHASE_ORDER]: 'Đơn mua hàng',
  [AuditEntity.INVOICE]: 'Hóa đơn',
  [AuditEntity.PAYMENT]: 'Thanh toán',
  [AuditEntity.SETTINGS]: 'Cài đặt',
};

export default function AuditLogPage() {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filters, setFilters] = useState({
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
    } catch (error: any) {
      logger.error('AuditLogPage', 'Error fetching audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await auditService.getStatistics();
      setStatistics(stats);
    } catch (error: any) {
      logger.error('AuditLogPage', 'Error fetching statistics', error);
    }
  };

  const fetchTimeline = async () => {
    try {
      const data = await auditService.getTimeline(30);
      setTimeline(data);
    } catch (error: any) {
      logger.error('AuditLogPage', 'Error fetching timeline', error);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDrawerVisible(true);
  };

  const renderValue = (value: any) => {
    if (!value) return '-';
    if (typeof value === 'object') {
      return <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(value, null, 2)}</pre>;
    }
    return String(value);
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Người dùng',
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: AuditAction) => (
        <Tag color={actionColors[action]}>{actionLabels[action]}</Tag>
      ),
    },
    {
      title: 'Đối tượng',
      dataIndex: 'entity',
      key: 'entity',
      width: 130,
      render: (entity: AuditEntity) => entityLabels[entity],
    },
    {
      title: 'ID đối tượng',
      dataIndex: 'entityId',
      key: 'entityId',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: AuditLog) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Xem
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
              title="Tổng hoạt động"
              value={statistics?.totalLogs || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Người dùng hoạt động"
              value={statistics?.topUsers?.length || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tạo mới"
              value={statistics?.byAction?.[AuditAction.CREATE] || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Xóa"
              value={statistics?.byAction?.[AuditAction.DELETE] || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Hoạt động 30 ngày gần nhất">
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
                  name="Số hoạt động"
                  stroke="#1890ff"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Hoạt động theo loại">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={Object.entries(statistics?.byAction || {}).map(([action, count]) => ({
                  action: actionLabels[action as AuditAction],
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

      <Card title="Nhật ký hoạt động">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Select
              placeholder="Hành động"
              style={{ width: 150 }}
              allowClear
              value={filters.action}
              onChange={(value) => setFilters({ ...filters, action: value, page: 1 })}
            >
              {Object.entries(actionLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Đối tượng"
              style={{ width: 150 }}
              allowClear
              value={filters.entity}
              onChange={(value) => setFilters({ ...filters, entity: value, page: 1 })}
            >
              {Object.entries(entityLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
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
              showTotal: (total) => `Tổng ${total} hoạt động`,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, limit: pageSize });
              },
            }}
          />
        </Space>
      </Card>

      <Drawer
        title="Chi tiết hoạt động"
        placement="right"
        width={isMobile ? '100%' : 600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedLog && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="ID">{selectedLog.id}</Descriptions.Item>
            <Descriptions.Item label="Người dùng">{selectedLog.userId}</Descriptions.Item>
            <Descriptions.Item label="Hành động">
              <Tag color={actionColors[selectedLog.action]}>{actionLabels[selectedLog.action]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Đối tượng">
              {entityLabels[selectedLog.entity]}
            </Descriptions.Item>
            <Descriptions.Item label="ID đối tượng">{selectedLog.entityId}</Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs(selectedLog.createdAt).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="IP">{selectedLog.ipAddress || '-'}</Descriptions.Item>
            <Descriptions.Item label="User Agent">{selectedLog.userAgent || '-'}</Descriptions.Item>
            {selectedLog.oldValue && (
              <Descriptions.Item label="Giá trị cũ">
                {renderValue(selectedLog.oldValue)}
              </Descriptions.Item>
            )}
            {selectedLog.newValue && (
              <Descriptions.Item label="Giá trị mới">
                {renderValue(selectedLog.newValue)}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
