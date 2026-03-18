import { UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Card, List } from 'antd';
import React, { useState } from 'react';

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  currentPage?: string;
}

export const OnlinePresence: React.FC = () => {
  const [users] = useState<User[]>([
    { id: '1', name: 'Nguyễn Văn A', status: 'online', currentPage: 'Đơn hàng' },
    { id: '2', name: 'Trần Thị B', status: 'online', currentPage: 'Sản phẩm' },
    { id: '3', name: 'Lê Văn C', status: 'away', currentPage: 'Dashboard' },
  ]);

  const statusColors = {
    online: '#52c41a',
    away: '#faad14',
    offline: '#d9d9d9',
  };

  return (
    <Card title="Người dùng đang online" style={{ width: 300 }}>
      <List
        dataSource={users.filter((u) => u.status !== 'offline')}
        renderItem={(user) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Badge dot color={statusColors[user.status]}>
                  <Avatar icon={<UserOutlined />} src={user.avatar} />
                </Badge>
              }
              title={user.name}
              description={user.currentPage}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};
