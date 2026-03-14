/**
 * Attendance Tracking Page
 * Track worker attendance with check-in/check-out
 * Requirements: 32.1
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Space,
  DatePicker,
  Select,
  Tag,
  message,
  Modal,
  Form,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  LoginOutlined,
  LogoutOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '../../components/common/StandardListPage';
import productionService, { Attendance, Worker } from '../../services/production/productionService';
import { formatDate } from '../../utils/responsive';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function AttendanceTracking() {
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [selectedWorker, setSelectedWorker] = useState<string>();
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance>();
  const [form] = Form.useForm();

  // Fetch workers
  const { data: workersData } = useQuery({
    queryKey: ['workers', { status: 'active' }],
    queryFn: async () => {
      const response = await productionService.worker.getWorkers({ status: 'active' });
      return response.data;
    },
  });

  // Fetch attendances
  const { data: attendancesData, isLoading } = useQuery({
    queryKey: [
      'attendances',
      {
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
        workerId: selectedWorker,
      },
    ],
    queryFn: async () => {
      const response = await productionService.attendance.getAttendances({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
        workerId: selectedWorker,
      });
      return response.data;
    },
  });

  // Fetch attendance report
  const { data: reportData } = useQuery({
    queryKey: [
      'attendance-report',
      {
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
        workerId: selectedWorker,
      },
    ],
    queryFn: async () => {
      const response = await productionService.attendance.getAttendanceReport({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
        workerId: selectedWorker,
      });
      return response.data;
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await productionService.attendance.checkIn(data);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.checkInSuccess'));
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-report'] });
      setCheckInModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error(t('production:messages.checkInError'));
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await productionService.attendance.checkOut(data);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.checkOutSuccess'));
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-report'] });
      setCheckOutModalVisible(false);
    },
    onError: () => {
      message.error(t('production:messages.checkOutError'));
    },
  });

  const handleCheckOut = (record: Attendance) => {
    setSelectedAttendance(record);
    setCheckOutModalVisible(true);
  };

  const onCheckInFinish = (values: any) => {
    checkInMutation.mutate({
      workerId: values.workerId,
      date: selectedDate.toDate(),
      shiftId: values.shiftId,
    });
  };

  const onCheckOutConfirm = () => {
    if (selectedAttendance) {
      checkOutMutation.mutate({
        attendanceId: selectedAttendance.id,
      });
    }
  };

  const statusColors: Record<string, string> = {
    present: 'green',
    absent: 'red',
    late: 'orange',
    early_leave: 'yellow',
  };

  const columns: ColumnsType<Attendance> = [
    {
      title: t('production:attendance.worker'),
      dataIndex: ['worker', 'fullName'],
      key: 'worker',
      ellipsis: true,
    },
    {
      title: t('production:attendance.date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: Date) => formatDate(date),
    },
    {
      title: t('production:attendance.checkInTime'),
      dataIndex: 'checkIn',
      key: 'checkIn',
      width: 100,
      render: (time: Date) => (time ? dayjs(time).format('HH:mm') : '-'),
    },
    {
      title: t('production:attendance.checkOutTime'),
      dataIndex: 'checkOut',
      key: 'checkOut',
      width: 100,
      render: (time: Date) => (time ? dayjs(time).format('HH:mm') : '-'),
    },
    {
      title: t('production:attendance.hours'),
      key: 'hours',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: Attendance) => {
        if (record.checkIn && record.checkOut) {
          const hours = dayjs(record.checkOut).diff(dayjs(record.checkIn), 'hour', true);
          return hours.toFixed(1);
        }
        return '-';
      },
    },
    {
      title: t('production:attendance.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{t(`production:attendance.statuses.${status}`)}</Tag>
      ),
    },
    {
      title: t('production:attendance.notes'),
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
  ];

  const filterComponents = (
    <Space wrap>
      <RangePicker
        value={dateRange}
        onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
        format="DD/MM/YYYY"
      />
      <Select
        placeholder={t('production:attendance.selectWorker')}
        style={{ width: 200 }}
        allowClear
        value={selectedWorker}
        onChange={setSelectedWorker}
        showSearch
        optionFilterProp="children"
      >
        {workersData?.map((worker: Worker) => (
          <Option key={worker.id} value={worker.id}>
            {worker.fullName} ({worker.code})
          </Option>
        ))}
      </Select>
    </Space>
  );

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('production:attendance.totalDays')}
              value={reportData?.totalDays || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('production:attendance.presentDays')}
              value={reportData?.presentDays || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('production:attendance.absentDays')}
              value={reportData?.absentDays || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('production:attendance.lateDays')}
              value={reportData?.lateDays || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <StandardListPage
        title={t('production:attendance.title')}
        createButtonText={t('production:attendance.checkIn')}
        onCreateClick={() => setCheckInModalVisible(true)}
        filters={filterComponents}
        columns={columns}
        dataSource={attendancesData || []}
        loading={isLoading || checkInMutation.isPending || checkOutMutation.isPending}
        pagination={false}
        customContent={
          <Space style={{ marginBottom: 16 }}>
            {attendancesData?.filter((a: Attendance) => !a.checkOut).map((attendance: Attendance) => (
              <Button
                key={attendance.id}
                type="link"
                icon={<LogoutOutlined />}
                onClick={() => handleCheckOut(attendance)}
              >
                {t('production:attendance.checkOut')} - {attendance.worker?.fullName}
              </Button>
            ))}
          </Space>
        }
      />

      {/* Check-in Modal */}
      <Modal
        title={t('production:attendance.checkIn')}
        open={checkInModalVisible}
        onCancel={() => {
          setCheckInModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onCheckInFinish}>
          <Form.Item
            label={t('production:attendance.worker')}
            name="workerId"
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <Select
              placeholder={t('production:attendance.selectWorker')}
              showSearch
              optionFilterProp="children"
            >
              {workersData?.map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} ({worker.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label={t('production:attendance.date')} name="date" initialValue={selectedDate}>
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={checkInMutation.isPending}>
                {t('production:actions.confirm')}
              </Button>
              <Button
                onClick={() => {
                  setCheckInModalVisible(false);
                  form.resetFields();
                }}
              >
                {t('production:actions.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Check-out Modal */}
      <Modal
        title={t('production:attendance.checkOut')}
        open={checkOutModalVisible}
        onOk={onCheckOutConfirm}
        onCancel={() => setCheckOutModalVisible(false)}
        confirmLoading={checkOutMutation.isPending}
        okText={t('production:actions.confirm')}
        cancelText={t('production:actions.cancel')}
      >
        <p>
          {t('production:attendance.confirmCheckOut')}{' '}
          <strong>{selectedAttendance?.worker?.fullName}</strong>?
        </p>
        <p>
          {t('production:attendance.checkInTime')}:{' '}
          <strong>
            {selectedAttendance?.checkIn && dayjs(selectedAttendance.checkIn).format('HH:mm')}
          </strong>
        </p>
        <p>
          {t('production:attendance.checkOutTime')}: <strong>{dayjs().format('HH:mm')}</strong>
        </p>
      </Modal>
    </div>
  );
}
