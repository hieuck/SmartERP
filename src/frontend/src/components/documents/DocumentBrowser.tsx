import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  HistoryOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { App, Button, Space, Table, Tag, Upload } from 'antd';
import type { UploadProps } from 'antd';
import React, { useState } from 'react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  version: number;
}

export const DocumentBrowser: React.FC = () => {
  const { message } = App.useApp();
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Hợp đồng mua bán.pdf',
      type: 'PDF',
      size: '2.5 MB',
      uploadedBy: 'Nguyễn Văn A',
      uploadedAt: '2024-01-15',
      version: 2,
    },
    {
      id: '2',
      name: 'Báo giá sản phẩm.xlsx',
      type: 'Excel',
      size: '1.2 MB',
      uploadedBy: 'Trần Thị B',
      uploadedAt: '2024-01-14',
      version: 1,
    },
  ]);

  const renderActions = () => (
    <Space>
      <Button icon={<EyeOutlined />} size="small" />
      <Button icon={<DownloadOutlined />} size="small" />
      <Button icon={<HistoryOutlined />} size="small" title="Lịch sử phiên bản" />
      <Button icon={<DeleteOutlined />} size="small" danger />
    </Space>
  );

  const columns = [
    { title: 'Tên file', dataIndex: 'name', key: 'name' },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    { title: 'Kích thước', dataIndex: 'size', key: 'size' },
    { title: 'Người tải lên', dataIndex: 'uploadedBy', key: 'uploadedBy' },
    { title: 'Ngày tải lên', dataIndex: 'uploadedAt', key: 'uploadedAt' },
    {
      title: 'Phiên bản',
      dataIndex: 'version',
      key: 'version',
      render: (version: number) => `v${version}`,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: renderActions,
    },
  ];

  const handleUpload: UploadProps['beforeUpload'] = (file) => {
    const newDoc: Document = {
      id: Date.now().toString(),
      name: file.name,
      type: file.name.split('.').pop()?.toUpperCase() || 'Unknown',
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedBy: 'Người dùng hiện tại',
      uploadedAt: new Date().toISOString().split('T')[0],
      version: 1,
    };
    setDocuments([newDoc, ...documents]);
    message.success('Đã tải lên file thành công');
    return false;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Upload beforeUpload={handleUpload} showUploadList={false}>
          <Button type="primary" icon={<UploadOutlined />}>
            Tải lên tài liệu
          </Button>
        </Upload>
      </div>
      <Table columns={columns} dataSource={documents} rowKey="id" />
    </div>
  );
};
