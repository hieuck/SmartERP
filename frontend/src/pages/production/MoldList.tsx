/**
 * Mold List Page
 * Displays and manages production molds
 * Requirements: 36.1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Space, Tag, message, Select, Badge } from 'antd';
import { PlusOutlined, ToolOutlined, WarningOutlined } from '@ant-design/icons';
import StandardListPage from '../../components/common/StandardListPage';
import { createExpandableRender } from '../../components/common/ExpandableContent';
import { formatDate, COLUMN_WIDTHS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants/ui';
import productionService, { Mold } from '../../services/productionService';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;

const MoldList = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();

  // Fetch molds
  const { data, isLoading } = useQuery({
    queryKey: ['molds', { search, status }],
    queryFn: async () => {
      const response = await productionService.mold.getMolds({ search, status });
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.mold.deleteMold(id);
      return response.data;
    },
    onSuccess: () => {
      message.success('Xóa khuôn thành công');
      queryClient.invalidateQueries({ queryKey: ['molds'] });
    },
    onError: () => {
      message.error('Xóa khuôn thất bại');
    },
  });

  const statusColors: Record<string, string> = {
    available: 'green',
    in_use: 'blue',
    maintenance: 'orange',
    broken: 'red',
  };

  const statusLabels: Record<string, string> = {
    available: 'Sẵn sàng',
    in_use: 'Đang sử dụng',
    maintenance: 'Bảo trì',
    broken: 'Hỏng',
  };

  const needsMaintenance = (mold: Mold) => {
    if (!mold.nextMaintenanceDate) return false;
    return dayjs(mold.nextMaintenanceDate).isBefore(dayjs().add(7, 'day'));
  };

  const columns: ColumnsType<Mold> = [
    {
      title: 'Mã khuôn',
      dataIndex: 'code',
      key: 'code',
      width: isMobile ? 80 : COLUMN_WIDTHS.code,
    },
    {
      title: 'Tên khuôn',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Mold) => (
        <Space>
          {name}
          {needsMaintenance(record) && <Badge status="warning" />}
        </Space>
      ),
    },
    {
      title: 'Kích thước',
      dataIndex: 'size',
      key: 'size',
      width: isMobile ? 90 : 120,
    },
    {
      title: 'Trọng lượng SP',
      dataIndex: 'productWeight',
      key: 'productWeight',
      width: isMobile ? 90 : 120,
      align: 'right' as const,
      render: (value: number) => (value ? `${value} kg` : '-'),
    },
    {
      title: 'Số lần sử dụng',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: isMobile ? 90 : 120,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Bảo trì tiếp theo',
      dataIndex: 'nextMaintenanceDate',
      key: 'nextMaintenanceDate',
      width: isMobile ? 90 : 130,
      render: (date: Date, record: Mold) => {
        if (!date) return '-';
        const isNear = needsMaintenance(record);
        return (
          <span
            style={{
              color: isNear ? '#faad14' : undefined,
              fontWeight: isNear ? 'bold' : undefined,
            }}
          >
            {formatDate(date)}
            {isNear && <WarningOutlined style={{ marginLeft: 8 }} />}
          </span>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 90 : COLUMN_WIDTHS.status,
      render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: 'Bảo trì',
      key: 'maintenance',
      width: isMobile ? 80 : 100,
      render: (_: any, record: Mold) => (
        <Button
          type="link"
          icon={<ToolOutlined />}
          onClick={() => navigate(`/production/molds/${record.id}/maintenance`)}
        >
          Bảo trì
        </Button>
      ),
    },
  ];

  const maintenanceNeeded = data?.filter((mold: Mold) => needsMaintenance(mold)).length || 0;

  return (
    <StandardListPage
      title={
        <Space>
          <span>Quản lý khuôn mẫu</span>
          {maintenanceNeeded > 0 && (
            <Tag color="warning" icon={<WarningOutlined />}>
              {maintenanceNeeded} khuôn cần bảo trì
            </Tag>
          )}
        </Space>
      }
      createButtonText="Thêm khuôn"
      onCreateClick={() => navigate('/production/molds/new')}
      searchPlaceholder="Tìm kiếm khuôn..."
      searchValue={search}
      onSearchChange={setSearch}
      filters={
        <Select
          placeholder="Trạng thái"
          style={{ width: 150 }}
          allowClear
          value={status}
          onChange={setStatus}
        >
          <Option value="available">Sẵn sàng</Option>
          <Option value="in_use">Đang sử dụng</Option>
          <Option value="maintenance">Bảo trì</Option>
          <Option value="broken">Hỏng</Option>
        </Select>
      }
      columns={columns}
      dataSource={data?.data || []}
      loading={isLoading}
      expandable={{
        expandedRowRender: createExpandableRender<Mold>(
          (record) => [
            { label: 'Bảo trì lần cuối', value: formatDate(record.lastMaintenanceDate) },
            { label: 'Ghi chú', value: record.notes, span: 3 },
          ],
          { column: 3, bordered: true },
        ),
      }}
      onEdit={(record) => navigate(`/production/molds/${record.id}`)}
      onDelete={(record) => deleteMutation.mutate(record.id)}
      deleteConfirmTitle="Bạn có chắc muốn xóa khuôn này?"
      pagination={false}
    />
  );
};

export default MoldList;
