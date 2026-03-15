/**
 * Mold List Page - Offline-First
 * Displays and manages production molds
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, message, Select, Badge } from 'antd';
import {
  ToolOutlined,
  WarningOutlined,
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { formatDate } from '@/utils/responsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Mold, SyncStatus } from '@/lib/offline/db';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

export default function MoldList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['production', 'common']);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();
  const [molds, setMolds] = useState<Mold[]>([]);
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
      logger.info('MoldList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('MoldList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load molds from offline storage
  const loadMolds = async () => {
    setLoading(true);
    try {
      logger.debug('MoldList', 'Loading molds from offline storage');
      let allMolds = await offlineServices.molds.getAll();
      
      // Apply filters
      let filtered = allMolds;
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.code.toLowerCase().includes(searchLower) ||
            m.name.toLowerCase().includes(searchLower)
        );
      }
      
      // Status filter
      if (status) {
        filtered = filtered.filter(m => m.status === status);
      }

      setMolds(filtered);
      logger.info('MoldList', `Loaded ${filtered.length} molds`);
    } catch (error) {
      logger.error('MoldList', 'Failed to load molds', error as Error);
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
      logger.error('MoldList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadMolds();
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
    loadMolds();
  }, [search, status]);

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
      logger.info('MoldList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadMolds();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('MoldList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (mold: Mold) => {
    try {
      logger.info('MoldList', `Deleting mold: ${mold.id}`);
      await offlineServices.molds.delete(mold.id);
      message.success(t('production:messages.deleteSuccess'));
      await loadMolds();
      await updateQueueSize();
    } catch (error) {
      logger.error('MoldList', 'Failed to delete mold', error as Error);
      message.error(t('production:messages.deleteError'));
    }
  };

  const statusColors: Record<string, string> = {
    available: 'green',
    in_use: 'blue',
    maintenance: 'orange',
    broken: 'red',
    active: 'green',
    inactive: 'red',
    retired: 'default',
  };

  const needsMaintenance = (mold: Mold) => {
    if (!mold.nextMaintenanceDate) return false;
    return dayjs(mold.nextMaintenanceDate).isBefore(dayjs().add(7, 'day'));
  };

  const maintenanceNeeded = molds.filter(needsMaintenance).length;

  // Get paginated data
  const paginatedMolds = molds.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Mold> = [
    {
      title: t('production:molds.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: t('production:molds.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Mold) => (
        <Space>
          {name}
          {needsMaintenance(record) && <Badge status="warning" />}
        </Space>
      ),
    },
    {
      title: t('production:molds.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => category || '-',
    },
    {
      title: t('production:molds.material'),
      dataIndex: 'material',
      key: 'material',
      width: 120,
      render: (material: string) => material || '-',
    },
    {
      title: t('production:molds.usageCount'),
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 130,
      align: 'right' as const,
      render: (value: number, record: Mold) => {
        const isNearMax = record.maxUsageCount && value >= record.maxUsageCount * 0.9;
        return (
          <span style={{ color: isNearMax ? '#faad14' : undefined }}>
            {value?.toLocaleString() || 0}
            {record.maxUsageCount && ` / ${record.maxUsageCount.toLocaleString()}`}
          </span>
        );
      },
    },
    {
      title: t('production:molds.condition'),
      dataIndex: 'condition',
      key: 'condition',
      width: 120,
      render: (condition: string) => {
        const colors: Record<string, string> = {
          excellent: 'green',
          good: 'blue',
          fair: 'orange',
          poor: 'red',
        };
        return (
          <Tag color={colors[condition] || 'default'}>
            {condition?.toUpperCase() || 'GOOD'}
          </Tag>
        );
      },
    },
    {
      title: t('production:molds.nextMaintenance'),
      dataIndex: 'nextMaintenanceDate',
      key: 'nextMaintenanceDate',
      width: 150,
      render: (date: Date, record: Mold) => {
        if (!date) return '-';
        const isNear = needsMaintenance(record);
        return (
          <span
            style={{
              color: isNear ? '#faad14' : undefined,
              fontWeight: isNear ? 'bold' : undefined,
            }}
          >
            {formatDate(date.toString())}
            {isNear && <WarningOutlined style={{ marginLeft: 8 }} />}
          </span>
        );
      },
    },
    {
      title: t('production:molds.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (moldStatus: string) => (
        <Tag color={statusColors[moldStatus] || 'default'}>
          {moldStatus?.toUpperCase() || 'ACTIVE'}
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
      title: t('production:molds.maintenance'),
      key: 'maintenance',
      width: 120,
      render: (_: any, record: Mold) => (
        <Button
          type="link"
          icon={<ToolOutlined />}
          onClick={() => navigate(`/production/molds/${record.id}/maintenance`)}
        >
          {t('production:molds.maintenance')}
        </Button>
      ),
    },
  ];

  const filterComponents = (
    <Select
      placeholder={t('production:filters.status')}
      style={{ width: 150 }}
      allowClear
      value={status}
      onChange={setStatus}
    >
      <Option value="active">ACTIVE</Option>
      <Option value="inactive">INACTIVE</Option>
      <Option value="maintenance">MAINTENANCE</Option>
      <Option value="retired">RETIRED</Option>
      <Option value="available">AVAILABLE</Option>
      <Option value="in_use">IN USE</Option>
      <Option value="broken">BROKEN</Option>
    </Select>
  );

  return (
    <StandardListPage
      title={
        <Space>
          <span>{t('production:molds.list')}</span>
          {maintenanceNeeded > 0 && (
            <Tag color="warning" icon={<WarningOutlined />}>
              {maintenanceNeeded} {t('production:molds.maintenance')}
            </Tag>
          )}
        </Space>
      }
      createButtonText={t('production:molds.create')}
      onCreateClick={() => navigate('/production/molds/new')}
      searchPlaceholder={t('production:molds.searchPlaceholder')}
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
      dataSource={paginatedMolds}
      loading={loading}
      onEdit={(record) => navigate(`/production/molds/${record.id}`)}
      onDelete={handleDelete}
      deleteConfirmTitle={t('production:messages.deleteConfirm')}
      pagination={{
        current: page,
        pageSize,
        total: molds.length,
        showTotal: (total) => `Total ${total} molds`,
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
