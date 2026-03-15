import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Space, Card, Tag, Popconfirm, message, Typography, Badge } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  AppstoreOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Product, SyncStatus } from '@/lib/offline/db';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

export default function ProductList() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['products', 'common']);
  const { isMobile, isTablet } = useResponsive();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('ProductList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('ProductList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load products from offline storage
  const loadProducts = async () => {
    setLoading(true);
    try {
      logger.debug('ProductList', 'Loading products from offline storage');
      const allProducts = await offlineServices.products.getAll();
      
      // Filter by search term
      let filtered = allProducts;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = allProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.sku.toLowerCase().includes(searchLower) ||
            p.description?.toLowerCase().includes(searchLower)
        );
      }

      setProducts(filtered);
      logger.info('ProductList', `Loaded ${filtered.length} products`);
    } catch (error) {
      logger.error('ProductList', 'Failed to load products', error as Error);
      message.error(t('products:messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Update queue size
  const updateQueueSize = async () => {
    try {
      const size = await syncManager.getQueueSize();
      setQueueSize(size);
    } catch (error) {
      logger.error('ProductList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadProducts();
      await updateQueueSize();

      // Auto-sync if online and has token
      if (isOnline) {
        const token = localStorage.getItem('token');
        if (token && !syncManager.isSyncing()) {
          handleSync();
        }
      }
    };

    initializeData();
  }, []);

  // Reload products when search changes
  useEffect(() => {
    loadProducts();
  }, [search]);

  // Handle sync
  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error(t('common:messages.loginRequired'));
      return;
    }

    if (!isOnline) {
      message.warning(t('common:messages.offlineMode'));
      return;
    }

    setSyncing(true);
    try {
      logger.info('ProductList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadProducts();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('ProductList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (product: Product) => {
    try {
      logger.info('ProductList', `Deleting product: ${product.id}`);
      await offlineServices.products.delete(product.id);
      message.success(t('common:messages.deleteSuccess'));
      await loadProducts();
      await updateQueueSize();
    } catch (error) {
      logger.error('ProductList', 'Failed to delete product', error as Error);
      message.error(t('products:messages.deleteError'));
    }
  };

  // Format currency based on locale
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: i18n.language === 'vi' ? 'VND' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get paginated data
  const paginatedProducts = products.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Product> = [
    {
      title: t('products:form.sku'),
      dataIndex: 'sku',
      key: 'sku',
      width: isMobile ? 100 : 120,
    },
    {
      title: t('products:form.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('products:form.price'),
      dataIndex: 'price',
      key: 'price',
      width: isMobile ? 100 : 120,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('products:form.cost'),
      dataIndex: 'cost',
      key: 'cost',
      width: isMobile ? 100 : 120,
      render: (value: number) => (value ? formatCurrency(value) : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 80 : 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase() || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Sync',
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      width: isMobile ? 80 : 100,
      render: (syncStatus: SyncStatus) => {
        const colors = {
          [SyncStatus.SYNCED]: 'success',
          [SyncStatus.PENDING]: 'warning',
          [SyncStatus.CONFLICT]: 'error',
        };
        const labels = {
          [SyncStatus.SYNCED]: 'Synced',
          [SyncStatus.PENDING]: 'Pending',
          [SyncStatus.CONFLICT]: 'Conflict',
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || 'Unknown'}
          </Tag>
        );
      },
    },
    {
      title: t('common:labels.actions'),
      key: 'action',
      width: isMobile ? 100 : 120,
      fixed: isMobile ? undefined : 'right',
      render: (_: any, record: Product) => (
        <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
          <Button
            type="link"
            size={isMobile ? 'small' : 'middle'}
            icon={<EditOutlined />}
            onClick={() => navigate(`/dashboard/products/${record.id}`)}
          >
            {!isMobile && t('common:buttons.edit')}
          </Button>
          <Popconfirm
            title={t('products:messages.deleteConfirm')}
            description={t('products:messages.deleteDescription')}
            onConfirm={() => handleDelete(record)}
            okText={t('common:buttons.delete')}
            cancelText={t('common:buttons.cancel')}
          >
            <Button
              type="link"
              danger
              size={isMobile ? 'small' : 'middle'}
              icon={<DeleteOutlined />}
            >
              {!isMobile && t('common:buttons.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : isTablet ? 16 : 24 }}>
      <Card size={isMobile ? 'small' : 'default'}>
        <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 'small' : 'large'}>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 12 : 0,
            }}
          >
            <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              <AppstoreOutlined /> {t('products:list.title')}
            </Title>
            <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
              {/* Network Status Badge */}
              <Badge
                status={isOnline ? 'success' : 'error'}
                text={
                  <Space size="small">
                    {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                    {isOnline ? 'Online' : 'Offline'}
                  </Space>
                }
              />
              
              {/* Sync Queue Indicator */}
              {queueSize > 0 && (
                <Badge count={queueSize} showZero={false}>
                  <Tag color="warning">Pending Sync</Tag>
                </Badge>
              )}

              {/* Sync Button */}
              <Button
                icon={<SyncOutlined spin={syncing} />}
                onClick={handleSync}
                loading={syncing}
                disabled={!isOnline}
                style={{ width: isMobile ? '100%' : 'auto' }}
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>

              <Button
                style={{ width: isMobile ? '100%' : 'auto' }}
                onClick={() => navigate('/dashboard/products/categories')}
              >
                {t('products:categories.manage')}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ width: isMobile ? '100%' : 'auto' }}
                onClick={() => navigate('/dashboard/products/new')}
              >
                {t('products:form.create')}
              </Button>
            </Space>
          </div>

          <Input
            placeholder={t('products:list.search')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: isMobile ? '100%' : 300 }}
            allowClear
            size={isMobile ? 'middle' : 'large'}
          />

          <Table
            columns={columns}
            dataSource={paginatedProducts}
            loading={loading}
            rowKey="id"
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              current: page,
              pageSize,
              total: products.length,
              showSizeChanger: !isMobile,
              showTotal: (total) => t('products:list.total', { total }),
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
              simple: isMobile,
            }}
            scroll={{ x: isMobile ? 800 : 1000 }}
          />
        </Space>
      </Card>
    </div>
  );
}
