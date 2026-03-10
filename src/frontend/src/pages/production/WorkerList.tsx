// @ts-nocheck
/**
 * Worker List Page
 * Displays and manages production workers
 * Requirements: 31.1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, message, Select } from 'antd';
import StandardListPage from '../../components/common/StandardListPage';
import { createExpandableRender } from '../../components/common/ExpandableContent';
import {
  SPECIALTY_COLORS,
  SPECIALTY_LABELS,
  SKILL_LEVEL_LABELS,
  getStatusColor,
  getStatusLabel,
  formatDate,
  formatCurrency,
  COLUMN_WIDTHS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from '../../constants/ui';
import productionService, { Worker } from '../../services/production/productionService';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;

const WorkerList = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState<string>();
  const [skillLevel, setSkillLevel] = useState<string>();
  const [status, setStatus] = useState<string>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['workers', { search, specialty, skillLevel, status }],
    queryFn: () => productionService.worker.getWorkers({ search, specialty, skillLevel, status }),
  });

  // Debug logging
  console.log('Workers Query:', {
    data,
    isLoading,
    error,
    dataType: typeof data,
    dataData: data?.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productionService.worker.deleteWorker(id),
    onSuccess: () => {
      message.success(SUCCESS_MESSAGES.delete);
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
    onError: () => {
      message.error(ERROR_MESSAGES.delete);
    },
  });

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'code',
      key: 'code',
      width: isMobile ? 80 : COLUMN_WIDTHS.code,
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: isMobile ? 140 : COLUMN_WIDTHS.name,
      ellipsis: true,
    },
    {
      title: 'Chuyên môn',
      dataIndex: 'specialty',
      key: 'specialty',
      width: isMobile ? 90 : 120,
      render: (specialty: string) => (
        <Tag color={SPECIALTY_COLORS[specialty as keyof typeof SPECIALTY_COLORS]}>
          {SPECIALTY_LABELS[specialty as keyof typeof SPECIALTY_LABELS]}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 90 : COLUMN_WIDTHS.status,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
  ];

  const filters = (
    <>
      <Select
        placeholder="Chuyên môn"
        style={{ width: 150 }}
        allowClear
        value={specialty}
        onChange={setSpecialty}
      >
        <Option value="casting">Đúc tượng</Option>
        <Option value="painting">Sơn màu</Option>
        <Option value="finishing">Hoàn thiện</Option>
        <Option value="packaging">Đóng gói</Option>
      </Select>
      <Select
        placeholder="Trình độ"
        style={{ width: 150 }}
        allowClear
        value={skillLevel}
        onChange={setSkillLevel}
      >
        <Option value="apprentice">Thợ phụ</Option>
        <Option value="skilled">Thợ chính</Option>
        <Option value="master">Thợ bậc cao</Option>
      </Select>
      <Select
        placeholder="Trạng thái"
        style={{ width: 150 }}
        allowClear
        value={status}
        onChange={setStatus}
      >
        <Option value="active">Đang làm</Option>
        <Option value="inactive">Nghỉ việc</Option>
      </Select>
    </>
  );

  return (
    <StandardListPage
      title="Quản lý nhân viên sản xuất"
      createButtonText="Thêm nhân viên"
      onCreateClick={() => navigate('/production/workers/new')}
      searchPlaceholder="Tìm kiếm nhân viên..."
      searchValue={search}
      onSearchChange={setSearch}
      filters={filters}
      columns={columns}
      dataSource={Array.isArray(data?.data) ? data.data : []}
      loading={isLoading}
      expandable={{
        expandedRowRender: createExpandableRender<Worker>(
          (record) => [
            { label: 'Số điện thoại', value: record.phone },
            { label: 'Email', value: record.email },
            {
              label: 'Trình độ',
              value: SKILL_LEVEL_LABELS[record.skillLevel as keyof typeof SKILL_LEVEL_LABELS],
            },
            { label: 'Ngày vào làm', value: formatDate(record.hireDate) },
            { label: 'Lương theo giờ', value: formatCurrency(record.hourlyRate) },
            { label: 'Lương theo ngày', value: formatCurrency(record.dailyRate) },
            { label: 'Ngày sinh', value: formatDate(record.dateOfBirth) },
            { label: 'Địa chỉ', value: record.address, span: 2 },
            { label: 'Ghi chú', value: record.notes, span: 3 },
          ],
          { column: 3, bordered: true },
        ),
      }}
      onEdit={(record) => navigate(`/production/workers/${record.id}`)}
      onDelete={(record) => deleteMutation.mutate(record.id)}
      deleteConfirmTitle="Bạn có chắc muốn xóa nhân viên này?"
      pagination={{
        current: data?.meta?.page || 1,
        pageSize: data?.meta?.limit || 10,
        total: data?.meta?.total || 0,
        onChange: () => {},
      }}
    />
  );
};

export default WorkerList;
