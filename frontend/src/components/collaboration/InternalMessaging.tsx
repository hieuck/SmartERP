import React, { useState } from 'react';
import { Card, List, Avatar, Input, Button, Badge } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';

interface Message {
  id: string;
  from: string;
  content: string;
  time: string;
  unread: boolean;
}

export const InternalMessaging: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'Nguyễn Văn A',
      content: 'Đơn hàng ĐH-001 đã sẵn sàng',
      time: '10:30',
      unread: true,
    },
    { id: '2', from: 'Trần Thị B', content: 'Cần kiểm tra tồn kho', time: '09:15', unread: false },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      from: 'Bạn',
      content: inputValue,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      unread: false,
    };

    setMessages([newMessage, ...messages]);
    setInputValue('');
  };

  return (
    <Card title="Tin nhắn nội bộ" style={{ height: 500 }}>
      <div style={{ height: 380, overflowY: 'auto', marginBottom: 16 }}>
        <List
          dataSource={messages}
          renderItem={(message) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Badge dot={message.unread}>
                    <Avatar icon={<UserOutlined />} />
                  </Badge>
                }
                title={
                  <span>
                    {message.from}{' '}
                    <span style={{ fontSize: 12, color: '#999' }}>{message.time}</span>
                  </span>
                }
                description={message.content}
              />
            </List.Item>
          )}
        />
      </div>
      <Input.Group compact>
        <Input
          style={{ width: 'calc(100% - 80px)' }}
          placeholder="Nhập tin nhắn..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleSend}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
          Gửi
        </Button>
      </Input.Group>
    </Card>
  );
};
