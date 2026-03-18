import { CheckCircleOutlined } from '@ant-design/icons';
import { Button, Modal, Progress, Result, Steps } from 'antd';
import React, { useState } from 'react';

interface InstallationWizardProps {
  visible: boolean;
  moduleName: string;
  onClose: () => void;
}

export const InstallationWizard: React.FC<InstallationWizardProps> = ({
  visible,
  moduleName,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps = [
    { title: 'Kiểm tra tương thích', description: 'Kiểm tra phiên bản và dependencies' },
    { title: 'Sao lưu dữ liệu', description: 'Tạo bản sao lưu trước khi cài đặt' },
    { title: 'Cài đặt', description: 'Cài đặt module và cấu hình' },
    { title: 'Hoàn thành', description: 'Kích hoạt module' },
  ];

  const handleNext = () => {
    if (currentStep === 2) {
      setInstalling(true);
      // Simulate installation
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setInstalling(false);
            setCurrentStep(3);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setProgress(0);
    onClose();
  };

  return (
    <Modal
      title={`Cài đặt ${moduleName}`}
      open={visible}
      onCancel={handleClose}
      footer={
        currentStep === 3 ? (
          <Button type="primary" onClick={handleClose}>
            Đóng
          </Button>
        ) : (
          <Button type="primary" onClick={handleNext} loading={installing}>
            {currentStep === 2 ? 'Bắt đầu cài đặt' : 'Tiếp tục'}
          </Button>
        )
      }
      width={600}
    >
      <Steps
        current={currentStep}
        style={{ marginBottom: 24 }}
        items={steps.map((step) => ({ title: step.title, description: step.description }))}
      />

      {currentStep === 2 && installing && <Progress percent={progress} status="active" />}

      {currentStep === 3 && (
        <Result
          status="success"
          title="Cài đặt thành công!"
          subTitle={`Module ${moduleName} đã được cài đặt và kích hoạt.`}
          icon={<CheckCircleOutlined />}
        />
      )}
    </Modal>
  );
};
