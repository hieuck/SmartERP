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
          label: 'D?y 01',
          children: [
            {
              value: 'R1',
              label: 'K? R1',
              children: [
                { value: 'B1', label: 'Ng?n B1' },
                { value: 'B2', label: 'Ng?n B2' },
                { value: 'B3', label: 'Ng?n B3' },
              ],
            },
            {
              value: 'R2',
              label: 'K? R2',
              children: [
                { value: 'B1', label: 'Ng?n B1' },
                { value: 'B2', label: 'Ng?n B2' },
              ],
            },
          ],
        },
        {
          value: '02',
          label: 'D?y 02',
          children: [
            {
              value: 'R1',
              label: 'K? R1',
              children: [
                { value: 'B1', label: 'Ng?n B1' },
                { value: 'B2', label: 'Ng?n B2' },
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
          label: 'D?y 01',
          children: [
            {
              value: 'R1',
              label: 'K? R1',
              children: [{ value: 'B1', label: 'Ng?n B1' }],
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
      title="Ch?n v? tr? kho"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okButtonProps={{ disabled: selectedLocation.length !== 4 }}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        <div>
          <EnvironmentOutlined /> Ch?n v? tr?: Khu v?c - D?y - K? - Ng?n
        </div>
        <Cascader
          options={options}
          onChange={(value) => setSelectedLocation(value as string[])}
          placeholder="Ch?n v? tr? kho"
          style={{ width: '100%' }}
          expandTrigger="hover"
        />
        {selectedLocation.length === 4 && (
          <div>
            <strong>V? tr? ?? ch?n:</strong>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{selectedLocation.join('-')}</Tag>
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
};
