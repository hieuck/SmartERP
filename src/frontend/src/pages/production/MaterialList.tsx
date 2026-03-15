/**
 * Material List Page - Offline-First
 * Displays and manages production materials
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, message, Select, Badge, Alert } from 'antd';
import {
  WarningOutlined,
  InboxOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { formatCurrency } from '@/utils/responsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Material, SyncStatus } from '@/lib/offline/db';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

export default function MaterialList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('MaterialList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('MaterialList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load materials from offline storage
  const loadMaterials = async () => {
    setLoading(true);
    try {
      logger.debug('MaterialList', 'Loading materials from offline storage');
      let allMaterials = await offlineServices.materials.getAll();
      
      // Apply filters
      let filtered = allMaterials;
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.code.toLowerCase().includes(searchLower) ||
            m.name.toLowerCase().includes(searchLower)
        );
      }
      
      // Type filter
      if (type) {
        filtered = filtered.filter(m => m.type === type);
      }
      
      // Status filter
      if (status) {
        filtered = filtered.filter(m => m.status === status);
      }

      setMaterials(filtered);
      logger.info('MaterialList', `Loaded ${filtered.length} materials`);
    } catch (error) {
      logger.error('MaterialList', 'Failed to load materials', error as Error);
      message.error(t('production:messages.loadError'));
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
      logger.error('MaterialList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadMaterials();
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

  // Reload when filters change
  useEffect(() => {
    loadMaterials();
  }, [search, type, status]);

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
      logger.info('MaterialList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadMaterials();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('MaterialList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (material: Material) => {
    try {
      logger.info('MaterialList', `Deleting material: ${material.id}`);
      await offlineServices.materials.delete(material.id);
      message.success(t('production:messages.deleteSuccess'));
      await loadMaterials();
      await updateQueueSize();
    } catch (error) {
      logger.error('MaterialList', 'Failed to delete material', error as Error);
      message.error(t('production:messages.deleteError'));
    }
  };

  // Get low stock materials for alert
  const lowStockMaterials = materials.filter(
    m => m.minQuantity && m.stockQuantity <= m.minQuantity
  );

  const typeColors: Record<string, string> = {
    plaster: 'blue',
    mold: 'purple',
    paint: 'green',
    accessory: 'orange',
    packaging: 'cyan',
    raw_material: 'blue',
    component: 'purple',
    consumable: 'orange',
  };

  // Get paginated data
  const paginatedMaterials = materials.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Material> = [
    {
      title: t('production:materials.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: t('production:materials.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Material) => (
        <Space>
          {name}
          {record.minQuantity && record.stockQuantity <= record.minQuantity && <Badge status="error" />}
        </Space>
      ),
    },
    {
      title: t('production:materials.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (materialType: string) => (
        <Tag color={typeColors[materialType] || 'default'}>
          {materialType?.toUpperCase() || '-'}
        </Tag>
      ),
    },
    {
      title: t('production:materials.unit'),
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: t('production:materials.quantity'),
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 120,
      align: 'right' as const,
      render: (quantity: number, record: Material) => {
        const isLow = record.minQuantity && quantity <= record.minQuantity;
        return (
          <span
            style={{ color: isLow ? '#ff4d4f' : undefined, fontWeight: isLow ? 'bold' : undefined }}
          >
            {quantity?.toLocaleString() || 0}
          </span>
        );
      },
    },
    {
      title: t('production:materials.minQuantity'),
      dataIndex: 'minQuantity',
      key: 'minQuantity',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (value ? value.toLocaleString() : '-'),
    },
    {
      title: t('production:materials.purchasePrice'),
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      width: 130,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('production:materials.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (materialStatus: string) => (
        <Tag color={materialStatus === 'active' ? 'green' : 'red'}>
          {materialStatus?.toUpperCase() || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Sync',
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
      title: t('production:materials.transactions'),
      key: 'transactions',
      width: 120,
      render: (_: any, record: Material) => (
        <Button
          type="link"
          icon={<InboxOutlined />}
          onClick={() => navigate(`/production/materials/${record.id}/transactions`)}
        >
          {t('production:materials.viewTransactions')}
        </Button>
      ),
    },
  ];

  const filterComponents = (
    <Space wrap>
      <Select
        placeholder={t('production:filters.type')}
        style={{ width: 150 }}
        allowClear
        value={type}
        onChange={setType}
      >
        <Option value="raw_material">RAW MATERIAL</Option>
        <Option value="component">COMPONENT</Option>
        <Option value="consumable">CONSUMABLE</Option>
        <Option value="plaster">PLASTER</Option>
        <Option value="mold">MOLD</Option>
        <Option value="paint">PAINT</Option>
        <Option value="accessory">ACCESSORY</Option>
        <Option value="packaging">PACKAGING</Option>
      </Select>
      <Select
        placeholder={t('production:filters.status')}
        style={{ width: 150 }}
        allowClear
        value={status}
        onChange={setStatus}
      >
        <Option value="active">ACTIVE</Option>
        <Option value="inactive">INACTIVE</Option>
      </Select>
    </Space>
  );

  return (
    <div>
      {lowStockMaterials.length > 0 && (
        <Alert
          message={t('production:materials.lowStockAlert')}
          description={
            <div>
              <p>
                {lowStockMaterials.length} {t('production:materials.title')} below minimum:
              </p>
              <ul>
                {lowStockMaterials.slice(0, 5).map((material: Material) => (
                  <li key={material.id}>
                    <strong>{material.name}</strong>: {material.stockQuantity} {material.unit}
                    (Min: {material.minQuantity} {material.unit})
                  </li>
                ))}
              </ul>
              {lowStockMaterials.length > 5 && (
                <p>...and {lowStockMaterials.length - 5} more</p>
              )}
            </div>
          }
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <StandardListPage
        title={t('production:materials.list')}
        createButtonText={t('production:materials.create')}
        onCreateClick={() => navigate('/production/materials/new')}
        searchPlaceholder={t('production:materials.searchPlaceholder')}
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterComponents}
        extraActions={
          <Space>
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
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </Space>
        }
        columns={columns}
        dataSource={paginatedMaterials}
        loading={loading}
        onEdit={(record) => navigate(`/production/materials/${record.id}`)}
        onDelete={handleDelete}
        deleteConfirmTitle={t('production:messages.deleteConfirm')}
        pagination={{
          current: page,
          pageSize,
          total: materials.length,
          showTotal: (total) => `Total ${total} materials`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />
    </div>
  );
}
