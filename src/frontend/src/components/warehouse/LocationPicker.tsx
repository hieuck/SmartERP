import { EnvironmentOutlined } from '@ant-design/icons';
import { Cascader, Modal, Space, Tag } from 'antd';
import React, { useState } from 'react';

interface LocationPickerProps {
  visible: boolean;
  onSelect: (location: string[]) => void;
  onCancel: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ visible, onSelect, onCancel }) => {
  const [selectedLocation, setSelectedLocation] = useState<string[]>([]);

  const options = [
    {
      value: 'A',
      label: 'Khu A',
      children: [
        {
          value: '01',
          label: 'Dãy 01',
          children: [
            {
              value: 'R1',
              label: 'Kệ R1',
              children: [
                { value: 'B1', label: 'Ngăn B1' },
                { value: 'B2', label: 'Ngăn B2' },
                { value: 'B3', label: 'Ngăn B3' },
              ],
            },
            {
              value: 'R2',
              label: 'Kệ R2',
              children: [
                { value: 'B1', label: 'Ngăn B1' },
                { value: 'B2', label: 'Ngăn B2' },
              ],
            },
          ],
        },
        {
          value: '02',
          label: 'Dãy 02',
          children: [
            {
              value: 'R1',
              label: 'Kệ R1',
              children: [
                { value: 'B1', label: 'Ngăn B1' },
                { value: 'B2', label: 'Ngăn B2' },
              ],
            },
          ],
        },
      ],
    },
    {
      value: 'B',
      label: 'Khu B',
      children: [
        {
          value: '01',
          label: 'Dãy 01',
          children: [
            {
              value: 'R1',
              label: 'Kệ R1',
              children: [{ value: 'B1', label: 'Ngăn B1' }],
            },
          ],
        },
      ],
    },
  ];

  const handleOk = () => {
    if (selectedLocation.length === 4) {
      onSelect(selectedLocation);
    }
  };

  return (
    <Modal
      title="Chọn vị trí kho"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okButtonProps={{ disabled: selectedLocation.length !== 4 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <EnvironmentOutlined /> Chọn vị trí: Khu vực → Dãy → Kệ → Ngăn
        </div>
        <Cascader
          options={options}
          onChange={(value) => setSelectedLocation(value as string[])}
          placeholder="Chọn vị trí kho"
          style={{ width: '100%' }}
          expandTrigger="hover"
        />
        {selectedLocation.length === 4 && (
          <div>
            <strong>Vị trí đã chọn:</strong>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{selectedLocation.join('-')}</Tag>
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
};
