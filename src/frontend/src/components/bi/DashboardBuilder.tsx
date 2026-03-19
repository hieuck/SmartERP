import React, { useState } from 'react';
import { Card, Row, Col, Button, Select, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';

const { Option } = Select;

interface Widget {
  id: string;
  type: 'chart' | 'kpi' | 'table';
  title: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  dataSource?: string;
  span: number;
}

export const DashboardBuilder: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: '1', type: 'kpi', title: 'Doanh thu tháng', span: 6 },
    { id: '2', type: 'chart', title: 'Xu hướng bán hàng', chartType: 'line', span: 12 },
    { id: '3', type: 'chart', title: 'Top sản phẩm', chartType: 'bar', span: 6 },
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleAddWidget: FormProps<Pick<Widget, 'title' | 'type' | 'chartType' | 'dataSource'>>['onFinish'] = (values) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      ...values,
      span: 6,
    };
    setWidgets([...widgets, newWidget]);
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Thêm widget
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {widgets.map((widget) => (
          <Col key={widget.id} span={widget.span}>
            <Card
              title={
                <span>
                  <DragOutlined style={{ marginRight: 8, cursor: 'move' }} />
                  {widget.title}
                </span>
              }
              extra={
                <>
                  <Button type="text" icon={<EditOutlined />} />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteWidget(widget.id)}
                  />
                </>
              }
            >
              <div
                style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {widget.type === 'kpi' && <h2>123,456,789 VND</h2>}
                {widget.type === 'chart' && <div>Biểu đồ {widget.chartType}</div>}
                {widget.type === 'table' && <div>Bảng dữ liệu</div>}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="Thêm widget"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAddWidget}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Loại widget" rules={[{ required: true }]}>
            <Select>
              <Option value="kpi">KPI</Option>
              <Option value="chart">Biểu đồ</Option>
              <Option value="table">Bảng</Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === 'chart' ? (
                <Form.Item name="chartType" label="Loại biểu đồ" rules={[{ required: true }]}>
                  <Select>
                    <Option value="line">Line</Option>
                    <Option value="bar">Bar</Option>
                    <Option value="pie">Pie</Option>
                    <Option value="area">Area</Option>
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="dataSource" label="Nguồn dữ liệu">
            <Select>
              <Option value="revenue">Doanh thu</Option>
              <Option value="orders">Đơn hàng</Option>
              <Option value="products">Sản phẩm</Option>
              <Option value="customers">Khách hàng</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
