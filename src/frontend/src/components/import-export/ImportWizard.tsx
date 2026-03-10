import React, { useState } from 'react';
import {
  Modal,
  Steps,
  Button,
  Upload,
  Alert,
  Table,
  Progress,
  Result,
  Space,
  Typography,
  message,
  Divider,
} from 'antd';
import {
  UploadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import importExportService, { ImportResult } from '../../services/import-export/importExportService';

const { Step } = Steps;
const { Text, Title, Paragraph } = Typography;
const { Dragger } = Upload;

interface ImportWizardProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  type: 'products' | 'customers' | 'suppliers';
  title?: string;
}

const ImportWizard: React.FC<ImportWizardProps> = ({
  visible,
  onClose,
  onSuccess,
  type,
  title,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleReset = () => {
    setCurrentStep(0);
    setFile(null);
    setFileList([]);
    setValidationResult(null);
    setImportResult(null);
    setUploadProgress(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importExportService.downloadTemplate(type);
      importExportService.downloadBlob(blob, `template_${type}.xlsx`);
      message.success('Template downloaded successfully');
    } catch (error) {
      message.error('Failed to download template');
    }
  };

  const handleFileChange = (info: any) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.slice(-1); // Keep only the last file

    setFileList(newFileList);

    if (info.file.status !== 'uploading') {
      setFile(info.file.originFileObj);
    }
  };

  const handleValidate = async () => {
    if (!file) {
      message.error('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const result = await importExportService.validateImport(type, file);
      setValidationResult(result);

      if (result.success) {
        message.success('Validation passed! Ready to import.');
        setCurrentStep(2);
      } else {
        message.warning(`Validation found ${result.errorCount} errors`);
        setCurrentStep(1);
      }
    } catch (error) {
      message.error('Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setCurrentStep(2);

    try {
      const result = await importExportService.importData(type, file, setUploadProgress);
      setImportResult(result);

      if (result.success) {
        message.success(result.message);
        setCurrentStep(3);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        message.error('Import failed');
      }
    } catch (error) {
      message.error('Import failed');
      setImportResult({
        success: false,
        message: 'Import failed due to server error',
        totalRows: 0,
        successCount: 0,
        errorCount: 0,
        errors: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const errorColumns = [
    {
      title: 'Row',
      dataIndex: 'row',
      key: 'row',
      width: 80,
    },
    {
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      width: 150,
    },
    {
      title: 'Error',
      dataIndex: 'message',
      key: 'message',
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="Import Instructions"
              description={
                <div>
                  <p>1. Download the template file</p>
                  <p>2. Fill in your data following the template format</p>
                  <p>3. Upload the completed file</p>
                  <p>4. Review validation results and fix any errors</p>
                  <p>5. Complete the import</p>
                </div>
              }
              type="info"
              showIcon
            />

            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate} block size="large">
              Download Template
            </Button>

            <Divider>Upload File</Divider>

            <Dragger
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false}
              accept=".xlsx,.xls,.csv"
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <FileExcelOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to upload</p>
              <p className="ant-upload-hint">
                Support for Excel (.xlsx, .xls) and CSV (.csv) files
              </p>
            </Dragger>
          </Space>
        );

      case 1:
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {validationResult && !validationResult.success && (
              <>
                <Alert
                  message="Validation Errors Found"
                  description={`Found ${validationResult.errorCount} errors in ${validationResult.totalRows} rows. Please fix the errors and try again.`}
                  type="error"
                  showIcon
                />

                <Table
                  columns={errorColumns}
                  dataSource={validationResult.errors}
                  rowKey={(record) => `${record.row}-${record.field}`}
                  pagination={{ pageSize: 10 }}
                  scroll={{ y: 300 }}
                />

                <Alert
                  message="Next Steps"
                  description="Fix the errors in your file and upload again, or go back to select a different file."
                  type="info"
                />
              </>
            )}
          </Space>
        );

      case 2:
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {validationResult && validationResult.success && !importResult && (
              <>
                <Alert
                  message="Validation Successful"
                  description={`Ready to import ${validationResult.successCount} records.`}
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />

                <div>
                  <Text strong>Summary:</Text>
                  <ul>
                    <li>Total rows: {validationResult.totalRows}</li>
                    <li>Valid records: {validationResult.successCount}</li>
                    <li>Errors: {validationResult.errorCount}</li>
                  </ul>
                </div>
              </>
            )}

            {loading && (
              <>
                <Title level={4}>Importing...</Title>
                <Progress percent={uploadProgress} status="active" />
                <Text type="secondary">Please wait while we import your data...</Text>
              </>
            )}

            {importResult && !importResult.success && (
              <Alert
                message="Import Failed"
                description={importResult.message}
                type="error"
                showIcon
              />
            )}
          </Space>
        );

      case 3:
        return (
          <Result
            status="success"
            title="Import Completed Successfully!"
            subTitle={importResult?.message}
            extra={[
              <Button type="primary" key="done" onClick={handleClose}>
                Done
              </Button>,
              <Button key="another" onClick={handleReset}>
                Import Another File
              </Button>,
            ]}
          >
            {importResult && (
              <div style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
                <Paragraph>
                  <Text strong>Import Summary:</Text>
                </Paragraph>
                <ul>
                  <li>Total rows processed: {importResult.totalRows}</li>
                  <li>Successfully imported: {importResult.successCount}</li>
                  <li>Errors: {importResult.errorCount}</li>
                </ul>
              </div>
            )}
          </Result>
        );

      default:
        return null;
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'finish';
    if (step === currentStep) return 'process';
    return 'wait';
  };

  return (
    <Modal
      title={title || `Import ${type.charAt(0).toUpperCase() + type.slice(1)}`}
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={
        currentStep !== 3
          ? [
              <Button key="cancel" onClick={handleClose}>
                Cancel
              </Button>,
              currentStep === 1 && (
                <Button key="back" onClick={() => setCurrentStep(0)}>
                  Back
                </Button>
              ),
              currentStep === 0 && (
                <Button
                  key="validate"
                  type="primary"
                  onClick={handleValidate}
                  loading={loading}
                  disabled={!file}
                >
                  Validate & Continue
                </Button>
              ),
              currentStep === 2 && validationResult?.success && !importResult && (
                <Button key="import" type="primary" onClick={handleImport} loading={loading}>
                  Start Import
                </Button>
              ),
            ]
          : null
      }
    >
      {currentStep !== 3 && (
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Upload" icon={<UploadOutlined />} status={getStepStatus(0)} />
          <Step title="Validate" icon={<CheckCircleOutlined />} status={getStepStatus(1)} />
          <Step title="Import" icon={<FileExcelOutlined />} status={getStepStatus(2)} />
        </Steps>
      )}

      {renderStepContent()}
    </Modal>
  );
};

export default ImportWizard;
