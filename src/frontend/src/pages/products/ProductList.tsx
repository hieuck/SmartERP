import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, message, Badge } from 'antd';
import {
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
import StandardListPage from '@/components/common/StandardListPage';
import type { ColumnsType } from 'antd/es/table';

export default function ProductList() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['products', 'common']);
  const { isMobile } = useResponsive();
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
      width: 120,
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
      width: 120,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('products:form.cost'),
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      render: (value: number) => (value ? formatCurrency(value) : '-'),
    },
    {
      title: t('products:fields.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? t('products:status.active').toUpperCase() : t('products:status.inactive').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: t('products:sync.status'),
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      width: 100,
      render: (syncStatus: SyncStatus) => {
        const colors = {
          [SyncStatus.SYNCED]: 'success',
          [SyncStatus.PENDING]: 'warning',
          [SyncStatus.CONFLICT]: 'error',
        };
        const labels = {
          [SyncStatus.SYNCED]: t('products:sync.synced'),
          [SyncStatus.PENDING]: t('products:sync.pending'),
          [SyncStatus.CONFLICT]: t('products:sync.conflict'),
        };
        return (
          <Tag color={colors[syncStatus] || 'default'}>
            {labels[syncStatus] || 'Unknown'}
          </Tag>
        );
      },
    },
  ];

  return (
    <StandardListPage
      title={
        <Space>
          <AppstoreOutlined />
          {t('products:list.title')}
        </Space>
      }
      createButtonText={t('products:form.create')}
      onCreateClick={() => navigate('/dashboard/products/new')}
      extraActions={
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
          <Badge
            status={isOnline ? 'success' : 'error'}
            text={
              <Space size="small">
                {isOnline ? <CloudOutlined /> : <DisconnectOutlined />}
                {t(isOnline ? 'products:sync.online' : 'products:sync.offline')}
              </Space>
            }
          />
          
          {queueSize > 0 && (
            <Badge count={queueSize} showZero={false}>
              <Tag color="warning">{t('products:sync.pendingSync')}</Tag>
            </Badge>
          )}

          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={!isOnline}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {syncing ? t('products:sync.syncing') : t('products:sync.syncNow')}
          </Button>

          <Button
            style={{ width: isMobile ? '100%' : 'auto' }}
            onClick={() => navigate('/dashboard/products/categories')}
          >
            {t('products:categories.manage')}
          </Button>
        </Space>
      }
      searchPlaceholder={t('products:list.search')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={paginatedProducts}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1000 }}
      pagination={{
        current: page,
        pageSize,
        total: products.length,
        showSizeChanger: true,
        showTotal: (total) => t('products:list.total', { total }),
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
      onEdit={(record) => navigate(`/dashboard/products/${record.id}`)}
      onDelete={handleDelete}
      deleteConfirmTitle={t('products:messages.deleteConfirm')}
      onMobileItemClick={(record) => navigate(`/dashboard/products/${record.id}`)}
    />
  );
}
