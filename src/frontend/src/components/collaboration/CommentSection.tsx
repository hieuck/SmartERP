import { UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Form, Input, List } from 'antd';
import React, { useState } from 'react';

const { TextArea } = Input;

interface CommentData {
  id: string;
  author: string;
  content: string;
  datetime: string;
  avatar?: string;
}

interface CommentSectionProps {
  recordId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ recordId: _recordId }) => {
  const [comments, setComments] = useState<CommentData[]>([
    {
      id: '1',
      author: 'Nguyễn Văn A',
      content: 'Đơn hàng này cần xử lý gấp',
      datetime: '2 giờ trước',
    },
    {
      id: '2',
      author: 'Trần Thị B',
      content: '@Nguyễn Văn A Đã xác nhận, sẽ xử lý trong hôm nay',
      datetime: '1 giờ trước',
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value) return;

    setSubmitting(true);
    setTimeout(() => {
      setComments([
        ...comments,
        {
          id: Date.now().toString(),
          author: 'Người dùng hiện tại',
          content: value,
          datetime: 'Vừa xong',
        },
      ]);
      setValue('');
      setSubmitting(false);
    }, 500);
  };

  return (
    <div>
      <List
        dataSource={comments}
        header={`${comments.length} bình luận`}
        itemLayout="horizontal"
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} src={item.avatar} />}
              title={item.author}
              description={
                <div>
                  <div>{item.content}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{item.datetime}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
      <div style={{ marginTop: 16 }}>
        <Form.Item>
          <TextArea
            rows={4}
            onChange={(e) => setValue(e.target.value)}
            value={value}
            placeholder="Nhập bình luận... (Sử dụng @ để mention người dùng)"
          />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" loading={submitting} onClick={handleSubmit} type="primary">
            Gửi bình luận
          </Button>
        </Form.Item>
      </div>
    </div>
  );
};
