import React, { useState } from 'react';
import { Card, Row, Col, Tag, Tooltip, Space, Select } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import styles from './WarehouseMap.module.css';

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

  const getStatusClass = (status: keyof typeof statusColors) => {
    return styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`];
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterSection}>
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
                  className={`${styles.locationCard} ${getStatusClass(location.status)}`}
                  bodyStyle={{ padding: '8px' }}
                >
                  <EnvironmentOutlined className={styles.locationIcon} />
                  <div className={styles.locationCode}>{location.code}</div>
                  <div className={styles.locationUsage}>
                    {Math.round((location.used / location.capacity) * 100)}%
                  </div>
                </Card>
              </Tooltip>
            </Col>
          ))}
        </Row>

        <div className={styles.legendSection}>
          <Tag color={statusColors.available}>Còn trống</Tag>
          <Tag color={statusColors.full}>Đầy</Tag>
          <Tag color={statusColors.reserved}>Đã đặt</Tag>
          <Tag color={statusColors.maintenance}>Bảo trì</Tag>
        </div>
      </Card>
    </div>
  );
};
