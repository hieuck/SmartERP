import React, { useState } from 'react';
import { Card, Row, Col, Button, Tag, Rate, Modal, message } from 'antd';
import { DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  rating: number;
  downloads: number;
  category: string;
  installed: boolean;
}

export const ModuleBrowser: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([
    {
      id: '1',
      name: 'CRM Advanced',
      description: 'Quản lý khách hàng nâng cao với tính năng email marketing',
      version: '1.2.0',
      rating: 4.5,
      downloads: 1250,
      category: 'CRM',
      installed: false,
    },
    {
      id: '2',
      name: 'Accounting Plus',
      description: 'Kế toán tổng hợp với báo cáo tài chính chi tiết',
      version: '2.0.1',
      rating: 4.8,
      downloads: 2100,
      category: 'Accounting',
      installed: true,
    },
    {
      id: '3',
      name: 'HR Management',
      description: 'Quản lý nhân sự, chấm công và tính lương',
      version: '1.5.3',
      rating: 4.3,
      downloads: 890,
      category: 'HR',
      installed: false,
    },
  ]);

  const handleInstall = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận cài đặt',
      content: 'Bạn có chắc chắn muốn cài đặt module này?',
      onOk: () => {
        setModules(modules.map((m) => (m.id === id ? { ...m, installed: true } : m)));
        message.success('Đã cài đặt module thành công');
      },
    });
  };

  const handleUninstall = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận gỡ bỏ',
      content: 'Bạn có chắc chắn muốn gỡ bỏ module này?',
      onOk: () => {
        setModules(modules.map((m) => (m.id === id ? { ...m, installed: false } : m)));
        message.success('Đã gỡ bỏ module');
      },
    });
  };

  return (
    <Row gutter={[16, 16]}>
      {modules.map((module) => (
        <Col key={module.id} xs={24} sm={12} lg={8}>
          <Card
            title={module.name}
            extra={<Tag color="blue">{module.category}</Tag>}
            actions={[
              module.installed ? (
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleUninstall(module.id)}
                >
                  Đã cài đặt
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => handleInstall(module.id)}
                >
                  Cài đặt
                </Button>
              ),
            ]}
          >
            <p>{module.description}</p>
            <div style={{ marginTop: 16 }}>
              <Rate disabled value={module.rating} />
              <div style={{ marginTop: 8 }}>
                <Tag>v{module.version}</Tag>
                <Tag>{module.downloads} lượt tải</Tag>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
