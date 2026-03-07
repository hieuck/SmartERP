/**
 * Material List Page
 * Displays and manages production materials
 * Requirements: 35.1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Space, Tag, message, Select, Badge, Alert } from 'antd';
import { PlusOutlined, WarningOutlined, InboxOutlined, EditOutlined } from '@ant-design/icons';
import StandardListPage from '../../components/common/StandardListPage';
import { createExpandableRender } from '../../components/common/ExpandableContent';
import {
  formatCurrency,
  COLUMN_WIDTHS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from '../../constants/ui';
import productionService, { Material } from '../../services/productionService';
import type { ColumnsType } from 'antd/es/table';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;

const MaterialList = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>();
  const [status, setStatus] = useState<string>();

  // Fetch materials
  const { data, isLoading } = useQuery({
    queryKey: ['materials', { search, type, status }],
    queryFn: async () => {
      const response = await productionService.material.getMaterials({ search, type, status });
      return response.data;
    },
  });

  // Fetch material alerts
  const { data: alertsData } = useQuery({
    queryKey: ['material-alerts'],
    queryFn: async () => {
      const response = await productionService.material.getMaterialAlerts();
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productionService.material.deleteMaterial(id);
      return response.data;
    },
    onSuccess: () => {
      message.success('Xóa nguyên vật liệu thành công');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: () => {
      message.error('Xóa nguyên vật liệu thất bại');
    },
  });

  const typeColors: Record<string, string> = {
    plaster: 'blue',
    mold: 'purple',
    paint: 'green',
    accessory: 'orange',
    packaging: 'cyan',
  };

  const typeLabels: Record<string, string> = {
    plaster: 'Thạch cao',
    mold: 'Khuôn mẫu',
    paint: 'Sơn',
    accessory: 'Phụ kiện',
    packaging: 'Bao bì',
  };

  const columns: ColumnsType<Material> = [
    {
      title: 'Mã NVL',
      dataIndex: 'code',
      key: 'code',
      width: isMobile ? 80 : COLUMN_WIDTHS.code,
    },
    {
      title: 'Tên nguyên vật liệu',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Material) => (
        <Space>
          {name}
          {record.minQuantity && record.quantity <= record.minQuantity && <Badge status="error" />}
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: isMobile ? 90 : 120,
      render: (type: string) => <Tag color={typeColors[type]}>{typeLabels[type]}</Tag>,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: isMobile ? 60 : 80,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      width: isMobile ? 80 : COLUMN_WIDTHS.quantity,
      align: 'right' as const,
      render: (quantity: number, record: Material) => {
        const isLow = record.minQuantity && quantity <= record.minQuantity;
        return (
          <span
            style={{ color: isLow ? '#ff4d4f' : undefined, fontWeight: isLow ? 'bold' : undefined }}
          >
            {quantity.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: 'Tồn tối thiểu',
      dataIndex: 'minQuantity',
      key: 'minQuantity',
      width: isMobile ? 90 : 120,
      align: 'right' as const,
      render: (value: number) => (value ? value.toLocaleString() : '-'),
    },
    {
      title: 'Giá nhập',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      width: isMobile ? 90 : COLUMN_WIDTHS.price,
      align: 'right' as const,
      render: formatCurrency,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 90 : COLUMN_WIDTHS.status,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Ngừng dùng'}
        </Tag>
      ),
    },
    {
      title: 'Giao dịch',
      key: 'transactions',
      width: isMobile ? 80 : 100,
      render: (_: any, record: Material) => (
        <Button
          type="link"
          icon={<InboxOutlined />}
          onClick={() => navigate(`/production/materials/${record.id}/transactions`)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div>
      {alertsData?.data && alertsData.data.length > 0 && (
        <Alert
          message="Cảnh báo tồn kho"
          description={
            <div>
              <p>Có {alertsData.data.length} nguyên vật liệu dưới mức tối thiểu:</p>
              <ul>
                {alertsData.data.slice(0, 5).map((material: Material) => (
                  <li key={material.id}>
                    <strong>{material.name}</strong>: {material.quantity} {material.unit}
                    (Tối thiểu: {material.minQuantity} {material.unit})
                  </li>
                ))}
              </ul>
              {alertsData.data.length > 5 && (
                <p>...và {alertsData.data.length - 5} nguyên vật liệu khác</p>
              )}
            </div>
          }
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <StandardListPage
        title="Quản lý nguyên vật liệu"
        createButtonText="Thêm nguyên vật liệu"
        onCreateClick={() => navigate('/production/materials/new')}
        searchPlaceholder="Tìm kiếm nguyên vật liệu..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <Space wrap>
            <Select
              placeholder="Loại"
              style={{ width: 150 }}
              allowClear
              value={type}
              onChange={setType}
            >
              <Option value="plaster">Thạch cao</Option>
              <Option value="mold">Khuôn mẫu</Option>
              <Option value="paint">Sơn</Option>
              <Option value="accessory">Phụ kiện</Option>
              <Option value="packaging">Bao bì</Option>
            </Select>
            <Select
              placeholder="Trạng thái"
              style={{ width: 150 }}
              allowClear
              value={status}
              onChange={setStatus}
            >
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Ngừng dùng</Option>
            </Select>
          </Space>
        }
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        onEdit={(record) => navigate(`/production/materials/${record.id}`)}
        onDelete={(record) => deleteMutation.mutate(record.id)}
        deleteConfirmTitle="Bạn có chắc muốn xóa nguyên vật liệu này?"
        pagination={false}
      />
    </div>
  );
};

export default MaterialList;
