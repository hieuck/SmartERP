import React, { useState } from 'react';
import { Modal, Radio, Button, Space, message, Typography } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import importExportService from '@/services/import-export/importExportService';

const { Text } = Typography;

interface ExportDialogProps {
  visible: boolean;
  onClose: () => void;
  type: 'products' | 'customers' | 'suppliers';
  title?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ visible, onClose, type, title }) => {
  const [format, setFormat] = useState<'excel' | 'csv'>('excel');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'products':
          blob = await importExportService.exportProducts(format);
          filename = `products.${format === 'excel' ? 'xlsx' : 'csv'}`;
          break;
        case 'customers':
          blob = await importExportService.exportCustomers(format);
          filename = `customers.${format === 'excel' ? 'xlsx' : 'csv'}`;
          break;
        case 'suppliers':
          blob = await importExportService.exportSuppliers(format);
          filename = `suppliers.${format === 'excel' ? 'xlsx' : 'csv'}`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      importExportService.downloadBlob(blob, filename);
      message.success('Export completed successfully');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={title || `Export ${type.charAt(0).toUpperCase() + type.slice(1)}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleExport}
        >
          Export
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>Select Export Format:</Text>
          <Radio.Group
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ marginTop: 12, display: 'block' }}
          >
            <Space direction="vertical">
              <Radio value="excel">
                <Space>
                  <FileExcelOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                  <span>Excel (.xlsx)</span>
                </Space>
              </Radio>
              <Radio value="csv">
                <Space>
                  <FileTextOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                  <span>CSV (.csv)</span>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        <div>
          <Text type="secondary">
            The export will include all {type} data with their complete information.
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

export default ExportDialog;
