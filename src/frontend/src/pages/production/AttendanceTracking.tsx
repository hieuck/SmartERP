/**
 * Attendance Tracking Page
 * Track worker attendance with check-in/check-out
 * Requirements: 32.1
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
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
import productionService, { Attendance, Worker } from '../../services/production/productionService';
import dayjs, { Dayjs } from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AttendanceTracking = () => {
  const { isMobile } = useResponsive();
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
      message.success('Chấm công vào thành công');
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-report'] });
      setCheckInModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Chấm công vào thất bại');
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await productionService.attendance.checkOut(data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Chấm công ra thành công');
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-report'] });
      setCheckOutModalVisible(false);
    },
    onError: () => {
      message.error('Chấm công ra thất bại');
    },
  });

  const handleCheckIn = () => {
    setCheckInModalVisible(true);
  };

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

  const statusLabels: Record<string, string> = {
    present: 'Có mặt',
    absent: 'Vắng',
    late: 'Đi muộn',
    early_leave: 'Về sớm',
  };

  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: ['worker', 'fullName'],
      key: 'worker',
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Giờ vào',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (time: Date) => (time ? dayjs(time).format('HH:mm') : '-'),
    },
    {
      title: 'Giờ ra',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (time: Date) => (time ? dayjs(time).format('HH:mm') : '-'),
    },
    {
      title: 'Số giờ',
      key: 'hours',
      render: (_: any, record: Attendance) => {
        if (record.checkIn && record.checkOut) {
          const hours = dayjs(record.checkOut).diff(dayjs(record.checkIn), 'hour', true);
          return hours.toFixed(1);
        }
        return '-';
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: Attendance) =>
        !record.checkOut && (
          <Button type="link" icon={<LogoutOutlined />} onClick={() => handleCheckOut(record)}>
            Chấm công ra
          </Button>
        ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số ngày công"
              value={reportData?.data?.totalDays || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Có mặt"
              value={reportData?.data?.presentDays || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Vắng mặt"
              value={reportData?.data?.absentDays || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đi muộn"
              value={reportData?.data?.lateDays || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Bảng chấm công"
        extra={
          <Button type="primary" icon={<LoginOutlined />} onClick={handleCheckIn}>
            Chấm công vào
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space wrap>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
              format="DD/MM/YYYY"
            />
            <Select
              placeholder="Chọn nhân viên"
              style={{ width: 200 }}
              allowClear
              value={selectedWorker}
              onChange={setSelectedWorker}
              showSearch
              optionFilterProp="children"
            >
              {workersData?.data?.map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} ({worker.code})
                </Option>
              ))}
            </Select>
          </Space>
        </Space>

        <Table
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 'max-content' }}
          columns={columns}
          dataSource={attendancesData?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </Card>

      {/* Check-in Modal */}
      <Modal
        title="Chấm công vào"
        open={checkInModalVisible}
        onCancel={() => {
          setCheckInModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onCheckInFinish}>
          <Form.Item
            label="Nhân viên"
            name="workerId"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select placeholder="Chọn nhân viên" showSearch optionFilterProp="children">
              {workersData?.data?.map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} ({worker.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Ngày" name="date" initialValue={selectedDate}>
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
                Xác nhận
              </Button>
              <Button
                onClick={() => {
                  setCheckInModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Check-out Modal */}
      <Modal
        title="Chấm công ra"
        open={checkOutModalVisible}
        onOk={onCheckOutConfirm}
        onCancel={() => setCheckOutModalVisible(false)}
        confirmLoading={checkOutMutation.isPending}
      >
        <p>
          Xác nhận chấm công ra cho nhân viên{' '}
          <strong>{selectedAttendance?.worker?.fullName}</strong>?
        </p>
        <p>
          Giờ vào:{' '}
          <strong>
            {selectedAttendance?.checkIn && dayjs(selectedAttendance.checkIn).format('HH:mm')}
          </strong>
        </p>
        <p>
          Giờ ra: <strong>{dayjs().format('HH:mm')}</strong>
        </p>
      </Modal>
    </div>
  );
};

export default AttendanceTracking;
