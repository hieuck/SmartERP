/**
 * Shift Calendar Page
 * Manage worker shift assignments with calendar view
 * Requirements: 33.1
 */

import { useState } from 'react';
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
} from 'antd';
import { PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import productionService, {
  Worker,
  Shift,
  ShiftAssignment,
} from '@/services/production/productionService';
import { formatDate } from '@/utils/responsive';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ShiftCalendar() {
  const { t } = useTranslation(['production', 'common']);
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
    queryFn: async () => {
      const response = await productionService.worker.getWorkers({ status: 'active' });
      return response.data;
    },
  });

  // Fetch shifts
  const { data: shiftsResponse } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const response = await productionService.shift.getShifts();
      return response.data;
    },
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
    queryFn: async () => {
      const response = await productionService.shift.getShiftAssignments({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      });
      return response.data;
    },
  });

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => productionService.shift.createShiftAssignment(data),
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['shiftAssignments'] });
      setAssignModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productionService.shift.deleteShiftAssignment(id),
    onSuccess: () => {
      message.success(t('production:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['shiftAssignments'] });
    },
    onError: () => {
      message.error(t('production:messages.deleteError'));
    },
  });

  const onAssignFinish = (values: any) => {
    createMutation.mutate({
      workerId: values.workerId,
      shiftId: values.shiftId,
      date: values.date.toDate(),
    });
  };

  const statusColors: Record<string, string> = {
    assigned: 'blue',
    completed: 'green',
    cancelled: 'red',
  };

  const shifts: Shift[] = shiftsResponse?.data || (Array.isArray(shiftsResponse) ? shiftsResponse : []);
  const assignments: ShiftAssignment[] = assignmentsData?.data || (Array.isArray(assignmentsData) ? assignmentsData : []);

  const columns: ColumnsType<ShiftAssignment> = [
    {
      title: t('production:shifts.worker'),
      dataIndex: ['worker', 'fullName'],
      key: 'worker',
      ellipsis: true,
    },
    {
      title: t('production:shifts.shift'),
      dataIndex: ['shift', 'name'],
      key: 'shift',
      width: 150,
    },
    {
      title: t('production:shifts.date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: Date) => formatDate(date),
    },
    {
      title: t('production:shifts.time'),
      key: 'time',
      width: 150,
      render: (_: any, record: ShiftAssignment) =>
        record.shift ? `${record.shift.startTime} - ${record.shift.endTime}` : '-',
    },
    {
      title: t('production:shifts.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{t(`production:shifts.statuses.${status}`)}</Tag>
      ),
    },
  ];

  const filterComponents = (
    <RangePicker
      value={dateRange}
      onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
      format="DD/MM/YYYY"
    />
  );

  return (
    <>
      <StandardListPage
        title={
          <Space>
            <CalendarOutlined />
            <span>{t('production:shifts.shiftSchedule')}</span>
          </Space>
        }
        createButtonText={t('production:shifts.assignShift')}
        onCreateClick={() => setAssignModalVisible(true)}
        filters={filterComponents}
        columns={columns}
        dataSource={assignments}
        loading={isLoading || createMutation.isPending || deleteMutation.isPending}
        onDelete={(record) => deleteMutation.mutate(record.id)}
        deleteConfirmTitle={t('production:messages.deleteConfirm')}
        pagination={false}
      />

      {/* Assign Shift Modal */}
      <Modal
        title={t('production:shifts.assignShift')}
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onAssignFinish}>
          <Form.Item
            label={t('production:shifts.worker')}
            name="workerId"
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <Select
              placeholder={t('production:shifts.selectWorker')}
              showSearch
              optionFilterProp="children"
            >
              {(workersData || []).map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} ({worker.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('production:shifts.shift')}
            name="shiftId"
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <Select placeholder={t('production:shifts.selectShift')}>
              {shifts.map((shift: Shift) => (
                <Option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('production:shifts.date')}
            name="date"
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                {t('production:actions.confirm')}
              </Button>
              <Button
                onClick={() => {
                  setAssignModalVisible(false);
                  form.resetFields();
                }}
              >
                {t('production:actions.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
