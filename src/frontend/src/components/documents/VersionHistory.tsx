import { DownloadOutlined, RollbackOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Tag, Timeline } from 'antd';
import React, { useState } from 'react';

interface Version {
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  changes: string;
  size: string;
}

interface VersionHistoryProps {
  documentId: string;
  visible: boolean;
  onClose: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  documentId: _documentId,
  visible,
  onClose,
}) => {
  const [versions] = useState<Version[]>([
    {
      version: 2,
      uploadedBy: 'Nguyễn Văn A',
      uploadedAt: '2024-01-15 10:30',
      changes: 'Cập nhật điều khoản thanh toán',
      size: '2.5 MB',
    },
    {
      version: 1,
      uploadedBy: 'Trần Thị B',
      uploadedAt: '2024-01-10 14:20',
      changes: 'Phiên bản đầu tiên',
      size: '2.3 MB',
    },
  ]);

  const handleRollback = (version: number) => {
    Modal.confirm({
      title: 'Xác nhận khôi phục',
      content: `Bạn có chắc chắn muốn khôi phục về phiên bản ${version}?`,
      onOk: () => {
        // Handle rollback logic
      },
    });
  };

  return (
    <Modal title="Lịch sử phiên bản" open={visible} onCancel={onClose} footer={null} width={600}>
      <Timeline>
        {versions.map((version) => (
          <Timeline.Item
            key={version.version}
            color={version.version === versions[0].version ? 'green' : 'gray'}
          >
            <div>
              <Space>
                <Tag color={version.version === versions[0].version ? 'green' : 'default'}>
                  v{version.version}
                  {version.version === versions[0].version && ' (Hiện tại)'}
                </Tag>
                <span>{version.size}</span>
              </Space>
              <div style={{ marginTop: 8 }}>
                <strong>{version.uploadedBy}</strong> - {version.uploadedAt}
              </div>
              <div style={{ marginTop: 4, color: '#666' }}>{version.changes}</div>
              <Space style={{ marginTop: 8 }}>
                <Button size="small" icon={<DownloadOutlined />}>
                  Tải xuống
                </Button>
                {version.version !== versions[0].version && (
                  <Button
                    size="small"
                    icon={<RollbackOutlined />}
                    onClick={() => handleRollback(version.version)}
                  >
                    Khôi phục
                  </Button>
                )}
              </Space>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </Modal>
  );
};
