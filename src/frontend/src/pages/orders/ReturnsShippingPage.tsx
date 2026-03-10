import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Steps,
  Timeline,
  Descriptions,
} from 'antd';
import {
  RollbackOutlined,
  CarOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import returnService, { Return } from '../../services/order/returnService';
import shippingService, { Shipment } from '../../services/logistics/shippingService';
import dayjs from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const ReturnsShippingPage: React.FC = () => {
  const { isMobile } = useResponsive();
  const [returns, setReturns] = useState<Return[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadReturns();
    loadShipments();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const result = await returnService.getReturns();
      setReturns(result.data);
    } catch (error) {
      message.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const loadShipments = async () => {
    try {
      const result = await shippingService.getShipments();
      setShipments(result.data);
    } catch (error) {
      message.error('Failed to load shipments');
    }
  };

  const handleCreateReturn = async () => {
    try {
      const values = await form.validateFields();
      await returnService.createReturn(values);
      message.success('Return created successfully');
      setReturnModalVisible(false);
      form.resetFields();
      loadReturns();
    } catch (error) {
      message.error('Failed to create return');
    }
  };

  const handleApproveReturn = async (id: string) => {
    try {
      await returnService.approveReturn(id);
      message.success('Return approved');
      loadReturns();
    } catch (error) {
      message.error('Failed to approve return');
    }
  };

  const handleRejectReturn = async (id: string) => {
    try {
      await returnService.rejectReturn(id, 'Rejected by admin');
      message.success('Return rejected');
      loadReturns();
    } catch (error) {
      message.error('Failed to reject return');
    }
  };

  const handleTrackShipment = async (shipment: Shipment) => {
    try {
      const updated = await shippingService.getShipment(shipment.id);
      setSelectedShipment(updated);
      setTrackingModalVisible(true);
    } catch (error) {
      message.error('Failed to load shipment details');
    }
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      pending: 'default',
      approved: 'blue',
      rejected: 'red',
      completed: 'green',
      picked_up: 'blue',
      in_transit: 'orange',
      delivered: 'green',
      failed: 'red',
    };
    return colorMap[status] || 'default';
  };

  const getShipmentStep = (status: string): number => {
    const stepMap: Record<string, number> = {
      pending: 0,
      picked_up: 1,
      in_transit: 2,
      delivered: 3,
      failed: 3,
    };
    return stepMap[status] || 0;
  };

  const returnColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
    },
    {
      title: 'Return Date',
      dataIndex: 'returnDate',
      key: 'returnDate',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: 'Refund Amount',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      render: (amount: number) => `${amount.toLocaleString()} VND`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Return) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApproveReturn(record.id)}
              >
                Approve
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleRejectReturn(record.id)}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const shipmentColumns = [
    {
      title: 'Tracking Number',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
    },
    {
      title: 'Carrier',
      dataIndex: 'carrier',
      key: 'carrier',
    },
    {
      title: 'Recipient',
      dataIndex: 'recipientName',
      key: 'recipientName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Estimated Delivery',
      dataIndex: 'estimatedDelivery',
      key: 'estimatedDelivery',
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Shipment) => (
        <Button type="link" icon={<SearchOutlined />} onClick={() => handleTrackShipment(record)}>
          Track
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Tabs>
          <TabPane
            tab={
              <span>
                <RollbackOutlined /> Returns
              </span>
            }
            key="returns"
          >
            <Space style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<RollbackOutlined />}
                onClick={() => setReturnModalVisible(true)}
              >
                Create Return
              </Button>
            </Space>

            <Table
              size={isMobile ? 'small' : 'middle'}
              scroll={{ x: 'max-content' }}
              columns={returnColumns}
              dataSource={returns}
              rowKey="id"
              loading={loading}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <CarOutlined /> Shipping
              </span>
            }
            key="shipping"
          >
            <Table
              size={isMobile ? 'small' : 'middle'}
              scroll={{ x: 'max-content' }}
              columns={shipmentColumns}
              dataSource={shipments}
              rowKey="id"
              loading={loading}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Return Form Modal */}
      <Modal
        title="Create Return"
        open={returnModalVisible}
        onCancel={() => setReturnModalVisible(false)}
        onOk={handleCreateReturn}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="orderId" label="Order ID" rules={[{ required: true }]}>
            <Input placeholder="Enter order ID" />
          </Form.Item>

          <Form.Item name="reason" label="Return Reason" rules={[{ required: true }]}>
            <Select>
              <Option value="defective">Defective Product</Option>
              <Option value="wrong_item">Wrong Item</Option>
              <Option value="not_as_described">Not as Described</Option>
              <Option value="customer_request">Customer Request</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name="refundMethod" label="Refund Method" rules={[{ required: true }]}>
            <Select>
              <Option value="cash">Cash</Option>
              <Option value="bank_transfer">Bank Transfer</Option>
              <Option value="exchange">Exchange</Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Shipment Tracking Modal */}
      <Modal
        title="Shipment Tracking"
        open={trackingModalVisible}
        onCancel={() => setTrackingModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTrackingModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedShipment && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Tracking Number" span={2}>
                <Tag color="blue">{selectedShipment.trackingNumber}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Carrier">{selectedShipment.carrier}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedShipment.status)}>
                  {selectedShipment.status.replace('_', ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Recipient">
                {selectedShipment.recipientName}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedShipment.recipientPhone}</Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {selectedShipment.shippingAddress}
              </Descriptions.Item>
            </Descriptions>

            <Steps current={getShipmentStep(selectedShipment.status)}>
              <Step title="Pending" description="Order placed" />
              <Step title="Picked Up" description="Package picked up" />
              <Step title="In Transit" description="On the way" />
              <Step
                title={selectedShipment.status === 'failed' ? 'Failed' : 'Delivered'}
                description={
                  selectedShipment.status === 'failed' ? 'Delivery failed' : 'Package delivered'
                }
              />
            </Steps>

            {selectedShipment.history && selectedShipment.history.length > 0 && (
              <>
                <h4>Tracking History</h4>
                <Timeline>
                  {selectedShipment.history.map((item, index) => (
                    <Timeline.Item key={index}>
                      <p>
                        <strong>{item.status}</strong> - {item.location}
                      </p>
                      <p>{item.description}</p>
                      <p style={{ color: '#999' }}>
                        {dayjs(item.timestamp).format('DD/MM/YYYY HH:mm')}
                      </p>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ReturnsShippingPage;
