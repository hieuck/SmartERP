import { ShopOutlined } from '@ant-design/icons';
import { Avatar, Card, Select, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

interface Tenant {
  id: string;
  name: string;
  logo?: string;
  currency: string;
  timezone: string;
}

interface TenantSelectorProps {
  onTenantChange: (tenantId: string) => void;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({ onTenantChange }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [loading, _setLoading] = useState(false);

  useEffect(() => {
    // Mock data - replace with actual API call
    setTenants([
      { id: '1', name: 'Công ty TNHH ABC', currency: 'VND', timezone: 'Asia/Ho_Chi_Minh' },
      { id: '2', name: 'Công ty XYZ', currency: 'USD', timezone: 'Asia/Ho_Chi_Minh' },
    ]);
  }, []);

  const handleChange = (value: string) => {
    setSelectedTenant(value);
    onTenantChange(value);
    localStorage.setItem('selectedTenant', value);
  };

  return (
    <Card style={{ maxWidth: 400, margin: '50px auto' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={4}>Chọn Tổ Chức</Title>
        <Select
          style={{ width: '100%' }}
          placeholder="Chọn tổ chức để làm việc"
          onChange={handleChange}
          value={selectedTenant}
          loading={loading}
        >
          {tenants.map((tenant) => (
            <Option key={tenant.id} value={tenant.id}>
              <Space>
                <Avatar icon={<ShopOutlined />} src={tenant.logo} />
                <div>
                  <div>{tenant.name}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {tenant.currency} • {tenant.timezone}
                  </Text>
                </div>
              </Space>
            </Option>
          ))}
        </Select>
      </Space>
    </Card>
  );
};
