/**
 * Attendance List Page - Offline-First
 * Displays and manages employee attendance records
 * Integrated with offline storage for offline-first functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, message, DatePicker, Badge } from 'antd';
import {
  SyncOutlined,
  CloudOutlined,
  DisconnectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '@/components/common/StandardListPage';
import { formatDate } from '@/utils/responsive';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger/logger.service';
import { Attendance, SyncStatus } from '@/lib/offline/db';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

export default function AttendanceList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['hr', 'common']);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [attendances, setAttendances] = useState<Attendance[]>([]);
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
      logger.info('AttendanceList', 'Network connection restored');
      message.success(t('common:messages.networkRestored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('AttendanceList', 'Network connection lost');
      message.warning(t('common:messages.networkLost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Load attendances from offline storage
  const loadAttendances = async () => {
    setLoading(true);
    try {
      logger.debug('AttendanceList', 'Loading attendances from offline storage');
      const allAttendances = await offlineServices.attendances.getAll();
      
      // Apply filters
      let filtered = allAttendances;
      
      // Date filter
      if (selectedDate) {
        const dateStr = selectedDate.format('YYYY-MM-DD');
        filtered = filtered.filter(a => {
          const attendanceDate = dayjs(a.date).format('YYYY-MM-DD');
          return attendanceDate === dateStr;
        });
      }
      
      // Search filter (employee name or ID)
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.employeeId.toLowerCase().includes(searchLower) ||
            a.notes?.toLowerCase().includes(searchLower)
        );
      }

      setAttendances(filtered);
      logger.info('AttendanceList', `Loaded ${filtered.length} attendances`);
    } catch (error) {
      logger.error('AttendanceList', 'Failed to load attendances', error as Error);
      message.error(t('hr:messages.loadError'));
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
      logger.error('AttendanceList', 'Failed to get queue size', error as Error);
    }
  };

  // Auto-sync on mount if online
  useEffect(() => {
    const initializeData = async () => {
      await loadAttendances();
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
    loadAttendances();
  }, [search, selectedDate]);

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
      logger.info('AttendanceList', 'Starting manual sync');
      const result = await syncManager.sync(token);
      
      if (result.success) {
        message.success(
          t('common:messages.syncSuccess', {
            pulled: result.pulled,
            pushed: result.pushed,
          })
        );
        await loadAttendances();
        await updateQueueSize();
      } else {
        message.error(t('common:messages.syncError', { errors: result.errors.join(', ') }));
      }
    } catch (error) {
      logger.error('AttendanceList', 'Sync failed', error as Error);
      message.error(t('common:messages.syncError', { errors: (error as Error).message }));
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete
  const handleDelete = async (attendance: Attendance) => {
    try {
      logger.info('AttendanceList', `Deleting attendance: ${attendance.id}`);
      await offlineServices.attendances.delete(attendance.id);
      message.success(t('hr:messages.deleteSuccess'));
      await loadAttendances();
      await updateQueueSize();
    } catch (error) {
      logger.error('AttendanceList', 'Failed to delete attendance', error as Error);
      message.error(t('hr:messages.deleteError'));
    }
  };

  // Get paginated data
  const paginatedAttendances = attendances.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnsType<Attendance> = [
    {
      title: t('hr:attendance.employeeId'),
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 150,
    },
    {
      title: t('hr:attendance.date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: Date) => formatDate(date.toString()),
    },
    {
      title: t('hr:attendance.checkIn'),
      dataIndex: 'checkIn',
      key: 'checkIn',
      width: 100,
    },
    {
      title: t('hr:attendance.checkOut'),
      dataIndex: 'checkOut',
      key: 'checkOut',
      width: 100,
      render: (checkOut: string | null) => checkOut || '-',
    },
    {
      title: t('hr:attendance.hoursWorked'),
      dataIndex: 'hoursWorked',
      key: 'hoursWorked',
      width: 120,
      align: 'right' as const,
      render: (hours: number) => `${hours.toFixed(2)}h`,
    },
    {
      title: t('hr:attendance.status'),
      key: 'status',
      width: 100,
      render: (_: any, record: Attendance) => {
        const isComplete = !!record.checkOut;
        return (
          <Tag color={isComplete ? 'success' : 'warning'} icon={isComplete ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
            {isComplete ? 'Complete' : 'In Progress'}
          </Tag>
        );
      },
    },
    {
      title: t('hr:attendance.notes'),
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string | null) => notes || '-',
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
  ];

  const filterComponents = (
    <DatePicker
      value={selectedDate}
      onChange={setSelectedDate}
      format="YYYY-MM-DD"
      style={{ width: 200 }}
      placeholder={t('hr:filters.selectDate')}
    />
  );

  return (
    <StandardListPage
      title={t('hr:attendance.list')}
      createButtonText={t('hr:attendance.create')}
      onCreateClick={() => navigate('/hr/attendances/new')}
      searchPlaceholder={t('hr:attendance.searchPlaceholder')}
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
      dataSource={paginatedAttendances}
      loading={loading}
      onEdit={(record) => navigate(`/hr/attendances/${record.id}`)}
      onDelete={handleDelete}
      deleteConfirmTitle={t('hr:messages.deleteConfirm')}
      pagination={{
        current: page,
        pageSize,
        total: attendances.length,
        showTotal: (total) => `Total ${total} attendances`,
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
