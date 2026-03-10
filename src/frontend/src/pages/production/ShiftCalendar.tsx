// @ts-nocheck
/**
 * Shift Calendar Page
 * Manage worker shift assignments
 * Requirements: 33.3
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Calendar,
  Badge,
  Modal,
  Form,
  Select,
  Button,
  Space,
  message,
  List,
  Tag,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import productionService, {
  ShiftAssignment,
  Worker,
  Shift,
} from '../../services/production/productionService';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;

const ShiftCalendar = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch shifts
  const { data: shiftsData } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => productionService.shift.getShifts(),
  });

  // Fetch workers
  const { data: workersData } = useQuery({
    queryKey: ['workers', { status: 'active' }],
    queryFn: () => productionService.worker.getWorkers({ status: 'active' }),
  });

  // Fetch shift assignments for the month
  const { data: assignmentsData } = useQuery({
    queryKey: [
      'shift-assignments',
      {
        startDate: selectedDate.startOf('month').toDate(),
        endDate: selectedDate.endOf('month').toDate(),
      },
    ],
    queryFn: () =>
      productionService.shift.getShiftAssignments({
        startDate: selectedDate.startOf('month').toDate(),
        endDate: selectedDate.endOf('month').toDate(),
      }),
  });

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => productionService.shift.createShiftAssignment(data),
    onSuccess: () => {
      message.success('Phân công ca làm việc thành công');
      queryClient.invalidateQueries({ queryKey: ['shift-assignments'] });
      setModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Phân công ca làm việc thất bại');
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productionService.shift.deleteShiftAssignment(id),
    onSuccess: () => {
      message.success('Xóa phân công thành công');
      queryClient.invalidateQueries({ queryKey: ['shift-assignments'] });
    },
    onError: () => {
      message.error('Xóa phân công thất bại');
    },
  });

  const getAssignmentsForDate = (date: Dayjs) => {
    if (!assignmentsData?.data) return [];
    return assignmentsData.data.filter((assignment: ShiftAssignment) =>
      dayjs(assignment.date).isSame(date, 'day'),
    );
  };

  const dateCellRender = (date: Dayjs) => {
    const assignments = getAssignmentsForDate(date);
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {assignments.map((assignment: ShiftAssignment) => (
          <li key={assignment.id}>
            <Badge
              status="success"
              text={`${assignment.worker?.fullName} - ${assignment.shift?.name}`}
            />
          </li>
        ))}
      </ul>
    );
  };

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setModalVisible(true);
  };

  const onFinish = (values: any) => {
    createMutation.mutate({
      workerId: values.workerId,
      shiftId: values.shiftId,
      date: selectedDate.toDate(),
    });
  };

  const selectedDateAssignments = getAssignmentsForDate(selectedDate);

  return (
    <div>
      <Card
        title="Lịch phân công ca làm việc"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Phân công ca
          </Button>
        }
      >
        <Calendar dateCellRender={dateCellRender} onSelect={handleDateSelect} />
      </Card>

      {selectedDateAssignments.length > 0 && (
        <Card
          title={`Phân công ngày ${selectedDate.format('DD/MM/YYYY')}`}
          style={{ marginTop: 16 }}
        >
          <List
            dataSource={selectedDateAssignments}
            renderItem={(assignment: ShiftAssignment) => (
              <List.Item
                actions={[
                  <Popconfirm
                    title="Bạn có chắc muốn xóa phân công này?"
                    onConfirm={() => deleteMutation.mutate(assignment.id)}
                    okText="Có"
                    cancelText="Không"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      Xóa
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={assignment.worker?.fullName}
                  description={
                    <Space>
                      <Tag color="blue">{assignment.shift?.name}</Tag>
                      <span>
                        {assignment.shift?.startTime} - {assignment.shift?.endTime}
                      </span>
                      <Tag color={assignment.status === 'completed' ? 'green' : 'orange'}>
                        {assignment.status === 'completed'
                          ? 'Hoàn thành'
                          : assignment.status === 'assigned'
                            ? 'Đã phân công'
                            : 'Đã hủy'}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Modal
        title={`Phân công ca - ${selectedDate.format('DD/MM/YYYY')}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Nhân viên"
            name="workerId"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select placeholder="Chọn nhân viên" showSearch optionFilterProp="children">
              {workersData?.data?.map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} ({worker.code}) -{' '}
                  {worker.specialty === 'molding'
                    ? 'Đúc tượng'
                    : worker.specialty === 'painting'
                      ? 'Sơn màu'
                      : worker.specialty === 'finishing'
                        ? 'Hoàn thiện'
                        : 'Đóng gói'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Ca làm việc"
            name="shiftId"
            rules={[{ required: true, message: 'Vui lòng chọn ca làm việc' }]}
          >
            <Select placeholder="Chọn ca làm việc">
              {shiftsData?.data?.map((shift: Shift) => (
                <Option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                Phân công
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
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
