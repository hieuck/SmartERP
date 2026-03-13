/**
 * Shift Calendar Page
 * Manage worker shift assignments with calendar view
 * Requirements: 33.1
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
} from 'antd';
import { PlusOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import productionService, {
  Worker,
  Shift,
  ShiftAssignment,
} from '../../services/production/productionService';
import dayjs, { Dayjs } from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ShiftCalendar = () => {
  const { isMobile } = useResponsive();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week'),
  ]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch workers
  const { data: workersData } = useQuery({
    queryKey: ['workers', { status: 'active' }],
    queryFn: () => productionService.worker.getWorkers({ status: 'active' }),
  });

  // Fetch shifts
  const { data: shiftsResponse } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => productionService.shift.getShifts(),
  });

  // Fetch shift assignments
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: [
      'shiftAssignments',
      {
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      },
    ],
    queryFn: () =>
      productionService.shift.getShiftAssignments({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      }),
  });

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => productionService.shift.createShiftAssignment(data),
    onSuccess: () => {
      message.success('Phân ca thành công');
      queryClient.invalidateQueries({ queryKey: ['shiftAssignments'] });
      setAssignModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Phân ca thất bại');
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productionService.shift.deleteShiftAssignment(id),
    onSuccess: () => {
      message.success('Xóa lịch phân ca thành công');
      queryClient.invalidateQueries({ queryKey: ['shiftAssignments'] });
    },
    onError: () => {
      message.error('Xóa lịch phân ca thất bại');
    },
  });

  const onAssignFinish = (values: any) => {
    createMutation.mutate({
      workerId: values.workerId,
      shiftId: values.shiftId,
      date: values.date.toDate(),
    });
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa lịch phân ca này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const statusColors: Record<string, string> = {
    assigned: 'blue',
    completed: 'green',
    cancelled: 'red',
  };

  const statusLabels: Record<string, string> = {
    assigned: 'Đã phân ca',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const shifts: Shift[] = shiftsResponse?.data?.data || (Array.isArray(shiftsResponse?.data) ? shiftsResponse?.data : []);
  const assignments: ShiftAssignment[] = assignmentsData?.data?.data || (Array.isArray(assignmentsData?.data) ? assignmentsData?.data : []);

  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: ['worker', 'fullName'],
      key: 'worker',
    },
    {
      title: 'Ca làm',
      dataIndex: ['shift', 'name'],
      key: 'shift',
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Giờ',
      key: 'time',
      render: (_: any, record: ShiftAssignment) =>
        record.shift ? `${record.shift.startTime} - ${record.shift.endTime}` : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: ShiftAssignment) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Lịch phân ca</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAssignModalVisible(true)}
          >
            {isMobile ? '' : 'Phân ca'}
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            format="DD/MM/YYYY"
          />
        </Space>

        <Table
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 'max-content' }}
          columns={columns}
          dataSource={assignments}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </Card>

      {/* Assign Shift Modal */}
      <Modal
        title="Phân ca làm việc"
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onAssignFinish}>
          <Form.Item
            label="Nhân viên"
            name="workerId"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select placeholder="Chọn nhân viên" showSearch optionFilterProp="children">
              {(workersData?.data || []).map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} ({worker.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Ca làm"
            name="shiftId"
            rules={[{ required: true, message: 'Vui lòng chọn ca làm' }]}
          >
            <Select placeholder="Chọn ca làm">
              {shifts.map((shift: Shift) => (
                <Option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Ngày"
            name="date"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                Xác nhận
              </Button>
              <Button
                onClick={() => {
                  setAssignModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShiftCalendar;
