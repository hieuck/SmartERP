/**
 * Worker List Page
 * Displays and manages production workers
 * Requirements: 31.1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Space, Input, Tag, Card, Modal, message, List, Dropdown } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import productionService, { Worker } from '../../services/production/productionService';
import { useResponsive } from '../../hooks/useResponsive';
import type { MenuProps } from 'antd';

const WorkerList = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();

  const { data, isLoading } = useQuery({
    queryKey: ['workers', { search, status: statusFilter }],
    queryFn: () => productionService.worker.getWorkers({ search, status: statusFilter }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productionService.worker.deleteWorker(id),
    onSuccess: () => {
      message.success('Xóa nhân viên thành công');
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
    onError: () => {
      message.error('Xóa nhân viên thất bại');
    },
  });

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa nhân viên này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const specialtyLabels: Record<string, string> = {
    molding: 'Đúc khuôn',
    painting: 'Sơn',
    finishing: 'Hoàn thiện',
    packaging: 'Đóng gói',
  };

  const skillLevelLabels: Record<string, string> = {
    apprentice: 'Học việc',
    skilled: 'Lành nghề',
    master: 'Bậc thợ cao',
  };

  const skillLevelColors: Record<string, string> = {
    apprentice: 'default',
    skilled: 'blue',
    master: 'gold',
  };

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Chuyên môn',
      dataIndex: 'specialty',
      key: 'specialty',
      render: (specialty: string) => specialtyLabels[specialty] || specialty,
    },
    {
      title: 'Trình độ',
      dataIndex: 'skillLevel',
      key: 'skillLevel',
      render: (level: string) => (
        <Tag color={skillLevelColors[level]}>{skillLevelLabels[level] || level}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Ngưng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: Worker) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/dashboard/production/workers/${record.id}`)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Danh sách nhân viên sản xuất"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/dashboard/production/workers/new')}
        >
          {isMobile ? '' : 'Thêm nhân viên'}
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm nhân viên..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: isMobile ? '100%' : 300 }}
        />
      </Space>

      {isMobile ? (
        <List
          dataSource={data?.data || []}
          loading={isLoading}
          renderItem={(worker: Worker) => {
            const menuItems: MenuProps['items'] = [
              {
                key: 'edit',
                label: 'Sửa',
                icon: <EditOutlined />,
                onClick: () => navigate(`/dashboard/production/workers/${worker.id}`),
              },
              {
                key: 'delete',
                label: 'Xóa',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDelete(worker.id),
              },
            ];

            return (
              <Card
                size="small"
                style={{ marginBottom: 8 }}
                extra={
                  <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                }
              >
                <div style={{ marginBottom: 4 }}>
                  <strong>{worker.fullName}</strong> ({worker.code})
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {specialtyLabels[worker.specialty]} •{' '}
                  <Tag color={skillLevelColors[worker.skillLevel]} style={{ margin: 0 }}>
                    {skillLevelLabels[worker.skillLevel]}
                  </Tag>
                </div>
              </Card>
            );
          }}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: data?.meta?.total,
            pageSize: data?.meta?.limit,
            current: data?.meta?.page,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} nhân viên`,
          }}
        />
      )}
    </Card>
  );
};

export default WorkerList;
