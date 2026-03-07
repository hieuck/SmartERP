import React, { useState } from 'react';
import { Table, Button, Space, Modal, Input, Tag, message } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ApprovalRequest {
  id: string;
  type: string;
  title: string;
  requester: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const WorkflowApproval: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([
    {
      id: '1',
      type: 'Đơn hàng',
      title: 'ĐH-001',
      requester: 'Nguyễn Văn A',
      date: '2024-01-15',
      status: 'pending',
    },
    {
      id: '2',
      type: 'Phiếu nhập',
      title: 'PN-001',
      requester: 'Trần Thị B',
      date: '2024-01-14',
      status: 'pending',
    },
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState('');

  const columns = [
    { title: 'Loại', dataIndex: 'type', key: 'type' },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Người yêu cầu', dataIndex: 'requester', key: 'requester' },
    { title: 'Ngày', dataIndex: 'date', key: 'date' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = { pending: 'orange', approved: 'green', rejected: 'red' };
        const labels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {labels[status as keyof typeof labels]}
          </Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: ApprovalRequest) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleView(record)} />
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                Duyệt
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={() => handleReject(record.id)}>
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleView = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setIsModalVisible(true);
  };

  const handleApprove = (id: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'approved' as const } : r)));
    message.success('Đã phê duyệt');
  };

  const handleReject = (id: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r)));
    message.success('Đã từ chối');
  };

  return (
    <div>
      <Table columns={columns} dataSource={requests} rowKey="id" />

      <Modal
        title="Chi tiết yêu cầu"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedRequest && (
          <div>
            <p>
              <strong>Loại:</strong> {selectedRequest.type}
            </p>
            <p>
              <strong>Tiêu đề:</strong> {selectedRequest.title}
            </p>
            <p>
              <strong>Người yêu cầu:</strong> {selectedRequest.requester}
            </p>
            <p>
              <strong>Ngày:</strong> {selectedRequest.date}
            </p>
            <TextArea
              rows={4}
              placeholder="Nhập ghi chú..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
