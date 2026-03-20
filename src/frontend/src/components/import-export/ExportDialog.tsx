import React, { useState } from 'react';
import { App, Modal, Radio, Button, Space, Typography, theme } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import importExportService from '@/services/import-export/importExportService';
import { logger } from '@/lib/logger/logger.service';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
const { useToken } = theme;

interface ExportDialogProps {
  visible: boolean;
  onClose: () => void;
  type: 'products' | 'customers' | 'suppliers';
  title?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ visible, onClose, type, title }) => {
  const [format, setFormat] = useState<'excel' | 'csv'>('excel');
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { token } = useToken();
  const { t } = useTranslation('importExport');

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
          throw new Error(t('export.messages.invalidType'));
      }

      importExportService.downloadBlob(blob, filename);
      message.success(t('export.messages.success'));
      onClose();
    } catch (error) {
      logger.error('ExportDialog', 'Export error', error as Error);
      message.error(t('export.messages.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={title || t('export.title', { entity: t(`entities.${type}`) })}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('export.buttons.cancel')}
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleExport}
        >
          {t('export.buttons.export')}
        </Button>,
      ]}
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>{t('export.formatTitle')}</Text>
          <Radio.Group
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ marginTop: 12, display: 'block' }}
          >
            <Space orientation="vertical">
              <Radio value="excel">
                <Space>
                  <FileExcelOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                  <span>{t('export.formats.excel')}</span>
                </Space>
              </Radio>
              <Radio value="csv">
                <Space>
                  <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                  <span>{t('export.formats.csv')}</span>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        <div>
          <Text type="secondary">
            {t('export.description', { entity: t(`entities.${type}`) })}
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

export default ExportDialog;
