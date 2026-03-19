import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Modal,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  SyncOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  OrderStatus,
} from '@/services/order/orderService';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import type { SalesOrder } from '@/lib/offline/db';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'default',
  [OrderStatus.PENDING]: 'blue',
  [OrderStatus.CONFIRMED]: 'cyan',
  [OrderStatus.PROCESSING]: 'orange',
  [OrderStatus.SHIPPED]: 'purple',
  [OrderStatus.DELIVERED]: 'green',
  [OrderStatus.CANCELLED]: 'red',
};

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'Nháp',
  [OrderStatus.PENDING]: 'Chờ xử lý',
  [OrderStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.SHIPPED]: 'Đã gửi hàng',
  [OrderStatus.DELIVERED]: 'Đã giao hàng',
  [OrderStatus.CANCELLED]: 'Đã hủy',
};

interface OrderItem {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueSize, setSyncQueueSize] = useState(0);

  // Load order from IndexedDB
  const loadOrder = async () => {
    try {
      setLoading(true);
      if (!id) return;
      
      const data = await offlineServices.salesOrders.getById(id);
      setOrder(data || null);
      logger.info('OrderDetail', 'Loaded order from IndexedDB', { id });
    } catch (error) {
      logger.error('OrderDetail', 'Failed to load order', error as Error);
      message.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync on mount when online
  useEffect(() => {
    const initSync = async () => {
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await syncManager.sync(token);
            logger.info('OrderDetail', 'Auto-sync completed');
          } catch (error) {
            logger.error('OrderDetail', 'Auto-sync failed', error as Error);
          }
        }
      }
    };

    initSync();
    loadOrder();
  }, [id]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync queue size
  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await syncManager.getQueueSize();
      setSyncQueueSize(size);
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000);

    return () => clearInterval(interval);
  }, []);

  // Manual sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('Vui lòng đăng nhập');
      return;
    }

    try {
      setSyncing(true);
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(`Đồng bộ thành công: ${result.pulled} pulled, ${result.pushed} pushed`);
        await loadOrder();
      } else {
        message.error(`Đồng bộ thất bại: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('OrderDetail', 'Sync failed', error as Error);
      message.error('Đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const handleConfirm = async () => {
    if (!order) return;

    Modal.confirm({
      title: 'Xác nhận đơn hàng',
      content: 'Bạn có chắc chắn muốn xác nhận đơn hàng này?',
      onOk: async () => {
        try {
          await offlineServices.salesOrders.update(order.id, {
            ...order,
            status: OrderStatus.CONFIRMED,
          });
          message.success('Xác nhận đơn hàng thành công');
          await loadOrder();
        } catch (error) {
          logger.error('OrderDetail', 'Failed to confirm order', error as Error);
          message.error('Không thể xác nhận đơn hàng');
        }
      },
    });
  };

  const handleCancel = async () => {
    if (!order) return;

    Modal.confirm({
      title: 'Hủy đơn hàng',
      content: 'Bạn có chắc chắn muốn hủy đơn hàng này?',
      onOk: async () => {
        try {
          await offlineServices.salesOrders.update(order.id, {
            ...order,
            status: OrderStatus.CANCELLED,
          });
          message.success('Hủy đơn hàng thành công');
          await loadOrder();
        } catch (error) {
          logger.error('OrderDetail', 'Failed to cancel order', error as Error);
          message.error('Không thể hủy đơn hàng');
        }
      },
    });
  };

  // Parse items from order.items into a stable UI shape
  const orderItems: OrderItem[] = Array.isArray(order?.items)
    ? order.items.map((item, index) => {
        const record = item as Partial<OrderItem>;
        const quantity = Number(record.quantity) || 0;
        const unitPrice = Number(record.unitPrice) || 0;

        return {
          id: typeof record.id === 'string' ? record.id : `item-${index}`,
          productId: typeof record.productId === 'string' ? record.productId : '',
          productName: typeof record.productName === 'string' ? record.productName : undefined,
          sku: typeof record.sku === 'string' ? record.sku : undefined,
          quantity,
          unitPrice,
          total: Number(record.total) || quantity * unitPrice,
        };
      })
    : [];

  const columns: ColumnsType<OrderItem> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'product',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Text>Không tìm thấy đơn hàng</Text>
        </Card>
      </div>
    );
  }

  const canEdit = order.status === OrderStatus.DRAFT || order.status === OrderStatus.PENDING;
  const canConfirm = order.status === OrderStatus.PENDING;
  const canCancel =
    order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED;

  return (
    <div style={{ padding: '24px' }}>
            <Space orientation="vertical" style={{ width: '100%' }} size="large">
        {/* Network Status & Sync */}
        <Card size="small">
          <Space>
            <Badge status={isOnline ? 'success' : 'error'} />
            <Text>{isOnline ? <WifiOutlined /> : <DisconnectOutlined />}</Text>
            <Text>{isOnline ? 'Online' : 'Offline'}</Text>
            {syncQueueSize > 0 && (
              <>
                <Text>|</Text>
                <Text type="warning">{syncQueueSize} thay đổi chưa đồng bộ</Text>
              </>
            )}
            <Button
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
              disabled={!isOnline}
              size="small"
            >
              Đồng bộ
            </Button>
          </Space>
        </Card>

        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Title level={3}>Chi tiết đơn hàng: {order.orderNumber}</Title>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/dashboard/orders/sales')}
              >
                Quay lại
              </Button>
              {canEdit && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/dashboard/orders/sales/${id}/edit`)}
                >
                  Chỉnh sửa
                </Button>
              )}
              {canConfirm && (
                <Button type="primary" icon={<CheckOutlined />} onClick={handleConfirm}>
                  Xác nhận
                </Button>
              )}
              {canCancel && (
                <Button danger icon={<CloseOutlined />} onClick={handleCancel}>
                  Hủy đơn
                </Button>
              )}
            </Space>
          </div>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã đơn hàng">{order.orderNumber}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColors[order.status as OrderStatus]}>
                {statusLabels[order.status as OrderStatus]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{order.customerId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Ngày đặt">
              {dayjs(order.createdAt).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <Text strong style={{ fontSize: 16 }}>
                {order.totalAmount.toLocaleString('vi-VN')} ₫
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái đồng bộ">
              <Tag color={order.syncStatus === 'synced' ? 'green' : 'orange'}>
                {order.syncStatus === 'synced' ? 'Đã đồng bộ' : 'Chưa đồng bộ'}
              </Tag>
            </Descriptions.Item>
            {order.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {order.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card title="Chi tiết sản phẩm">
          <Table
            columns={columns}
            dataSource={orderItems}
            rowKey="id"
            pagination={false}
            summary={(pageData) => {
              const total = pageData.reduce((sum, item) => sum + item.total, 0);
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <Text strong>Tổng cộng:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ fontSize: 16 }}>
                        {total.toLocaleString('vi-VN')} ₫
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Card>

        <Card>
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => navigate(`/dashboard/payments/new?orderId=${id}`)}
          >
            Thanh toán
          </Button>
        </Card>
      </Space>
    </div>
  );
};

export default OrderDetail;
