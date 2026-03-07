import React, { useState } from 'react';
import { Card, Row, Col, Tag, Tooltip, Space, Select } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

const { Option } = Select;

interface Location {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  bin: string;
  status: 'available' | 'full' | 'reserved' | 'maintenance';
  capacity: number;
  used: number;
}

export const WarehouseMap: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState('A');
  const [locations] = useState<Location[]>([
    {
      id: '1',
      code: 'A-01-R1-B1',
      zone: 'A',
      aisle: '01',
      rack: 'R1',
      bin: 'B1',
      status: 'full',
      capacity: 100,
      used: 100,
    },
    {
      id: '2',
      code: 'A-01-R1-B2',
      zone: 'A',
      aisle: '01',
      rack: 'R1',
      bin: 'B2',
      status: 'available',
      capacity: 100,
      used: 45,
    },
    {
      id: '3',
      code: 'A-01-R1-B3',
      zone: 'A',
      aisle: '01',
      rack: 'R1',
      bin: 'B3',
      status: 'reserved',
      capacity: 100,
      used: 80,
    },
    {
      id: '4',
      code: 'A-01-R2-B1',
      zone: 'A',
      aisle: '01',
      rack: 'R2',
      bin: 'B1',
      status: 'available',
      capacity: 100,
      used: 30,
    },
    {
      id: '5',
      code: 'A-01-R2-B2',
      zone: 'A',
      aisle: '01',
      rack: 'R2',
      bin: 'B2',
      status: 'maintenance',
      capacity: 100,
      used: 0,
    },
    {
      id: '6',
      code: 'A-01-R2-B3',
      zone: 'A',
      aisle: '01',
      rack: 'R2',
      bin: 'B3',
      status: 'available',
      capacity: 100,
      used: 60,
    },
  ]);

  const statusColors = {
    available: '#52c41a',
    full: '#ff4d4f',
    reserved: '#faad14',
    maintenance: '#d9d9d9',
  };

  const statusLabels = {
    available: 'Còn trống',
    full: 'Đầy',
    reserved: 'Đã đặt',
    maintenance: 'Bảo trì',
  };

  const filteredLocations = locations.filter((loc) => loc.zone === selectedZone);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>Khu vực:</span>
          <Select value={selectedZone} onChange={setSelectedZone} style={{ width: 120 }}>
            <Option value="A">Khu A</Option>
            <Option value="B">Khu B</Option>
            <Option value="C">Khu C</Option>
          </Select>
        </Space>
      </div>

      <Card title={`Sơ đồ kho - Khu ${selectedZone}`}>
        <Row gutter={[8, 8]}>
          {filteredLocations.map((location) => (
            <Col key={location.id} span={4}>
              <Tooltip
                title={
                  <div>
                    <div>
                      <strong>{location.code}</strong>
                    </div>
                    <div>Trạng thái: {statusLabels[location.status]}</div>
                    <div>
                      Sử dụng: {location.used}/{location.capacity} (
                      {Math.round((location.used / location.capacity) * 100)}%)
                    </div>
                  </div>
                }
              >
                <Card
                  size="small"
                  style={{
                    backgroundColor: statusColors[location.status],
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  bodyStyle={{ padding: '8px' }}
                >
                  <EnvironmentOutlined style={{ fontSize: 20 }} />
                  <div style={{ fontSize: 12, marginTop: 4 }}>{location.code}</div>
                  <div style={{ fontSize: 10 }}>
                    {Math.round((location.used / location.capacity) * 100)}%
                  </div>
                </Card>
              </Tooltip>
            </Col>
          ))}
        </Row>

        <div style={{ marginTop: 16 }}>
          <Space>
            <Tag color={statusColors.available}>Còn trống</Tag>
            <Tag color={statusColors.full}>Đầy</Tag>
            <Tag color={statusColors.reserved}>Đã đặt</Tag>
            <Tag color={statusColors.maintenance}>Bảo trì</Tag>
          </Space>
        </div>
      </Card>
    </div>
  );
};
