/**
 * Warehouse List Page
 * Displays and manages warehouses
 * Requirements: 27.1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, message } from 'antd';
import StandardListPage from '../../components/common/StandardListPage';
import { createExpandableRender } from '../../components/common/ExpandableContent';
import { COLUMN_WIDTHS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants/ui';
import warehouseService, { Warehouse } from '../../services/inventory/warehouseService';
import type { ColumnsType } from 'antd/es/table';
import { useResponsive } from '../../hooks/useResponsive';

const WarehouseList = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();

  // Fetch warehouses
  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', { search, status }],
    queryFn: () => warehouseService.getWarehouses({ search, status }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => warehouseService.deleteWarehouse(id),
    onSuccess: () => {
      message.success('Xóa kho thành công');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: () => {
      message.error('Không thể xóa kho');
    },
  });

  const columns: ColumnsType<Warehouse> = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: isMobile ? 80 : COLUMN_WIDTHS.code,
    },
    {
      title: 'Tên Kho',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 140 : COLUMN_WIDTHS.name,
    },
    {
      title: 'Địa Chỉ',
      dataIndex: 'address',
      key: 'address',
      width: isMobile ? 140 : 200,
      ellipsis: true,
      render: (_: any, record: Warehouse) => (
        <span>
          {record.address}
          {record.ward && `, ${record.ward}`}
          {record.district && `, ${record.district}`}
          {record.city && `, ${record.city}`}
        </span>
      ),
    },
    {
      title: 'Điện Thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: isMobile ? 100 : COLUMN_WIDTHS.phone,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 90 : COLUMN_WIDTHS.status,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Mặc Định',
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: isMobile ? 80 : 100,
      render: (isDefault: boolean) => (isDefault ? <Tag color="blue">Mặc định</Tag> : null),
    },
  ];

  return (
    <StandardListPage
      title="Quản Lý Kho"
      createButtonText="Thêm Kho"
      onCreateClick={() => navigate('/warehouses/new')}
      searchPlaceholder="Tìm kiếm kho..."
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={data?.data || []}
      loading={isLoading}
      onEdit={(record) => navigate(`/warehouses/${record.id}`)}
      onDelete={(record) => deleteMutation.mutate(record.id)}
      deleteConfirmTitle="Bạn có chắc muốn xóa kho này?"
      pagination={{
        current: data?.meta?.page || 1,
        pageSize: data?.meta?.limit || 10,
        total: data?.meta?.total || 0,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} kho`,
        onChange: () => {},
      }}
    />
  );
};

export default WarehouseList;
