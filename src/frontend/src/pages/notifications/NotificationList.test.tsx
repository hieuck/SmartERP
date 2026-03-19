import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotificationList from './NotificationList';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  navigate,
  notificationsGetAll,
  notificationsUpdate,
  notificationsDelete,
  getQueueSize,
  sync,
  isSyncing,
  loggerDebug,
  loggerInfo,
  loggerWarn,
  loggerError,
} = vi.hoisted(() => ({
  navigate: vi.fn(),
  notificationsGetAll: vi.fn(),
  notificationsUpdate: vi.fn(),
  notificationsDelete: vi.fn(),
  getQueueSize: vi.fn(),
  sync: vi.fn(),
  isSyncing: vi.fn(),
  loggerDebug: vi.fn(),
  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/components/common/StandardListPage', () => ({
  default: ({
    title,
    dataSource = [],
    onDelete,
    createButtonText,
    onCreateClick,
    extraActions,
  }: {
    title: React.ReactNode;
    dataSource?: Array<{ id: string; title: string }>;
    onDelete?: (record: { id: string; title: string }) => void;
    createButtonText?: string;
    onCreateClick?: () => void;
    extraActions?: React.ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <button onClick={onCreateClick}>{createButtonText}</button>
      <div>{extraActions}</div>
      <div data-testid="notification-count">{dataSource.length}</div>
      {dataSource.map((record) => (
        <div key={record.id}>
          <span>{record.title}</span>
          <button onClick={() => onDelete?.(record)}>delete-{record.id}</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/services/offline-services', () => ({
  offlineServices: {
    notifications: {
      getAll: notificationsGetAll,
      update: notificationsUpdate,
      delete: notificationsDelete,
    },
  },
}));

vi.mock('@/lib/offline/sync-manager', () => ({
  syncManager: {
    getQueueSize,
    sync,
    isSyncing,
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
    debug: loggerDebug,
    info: loggerInfo,
    warn: loggerWarn,
    error: loggerError,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params?.total ? `${key}:${params.total}` : key,
  }),
}));

vi.mock('@/utils/responsive', () => ({
  formatDate: (value: string) => value,
}));

describe('NotificationList', () => {
  const notifications = [
    {
      id: 'notif-1',
      title: 'Older notice',
      message: 'Old message',
      type: 'info',
      status: 'read',
      createdAt: new Date('2026-03-18T10:00:00.000Z'),
      syncStatus: 'SYNCED',
    },
    {
      id: 'notif-2',
      title: 'Newer warning',
      message: 'Latest message',
      type: 'warning',
      status: 'unread',
      createdAt: new Date('2026-03-19T10:00:00.000Z'),
      syncStatus: 'PENDING',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    notificationsGetAll.mockResolvedValue(notifications);
    notificationsUpdate.mockResolvedValue(undefined);
    notificationsDelete.mockResolvedValue(undefined);
    getQueueSize.mockResolvedValue(2);
    sync.mockResolvedValue({ success: true, pulled: 1, pushed: 1, errors: [] });
    isSyncing.mockReturnValue(false);
    localStorage.clear();
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  it('loads notifications from offline storage and shows the newest first', async () => {
    render(<NotificationList />);

    await waitFor(() => {
      expect(notificationsGetAll).toHaveBeenCalled();
      expect(getQueueSize).toHaveBeenCalled();
    });

    const titles = await screen.findAllByText(/Older notice|Newer warning/);
    expect(titles[0]).toHaveTextContent('Newer warning');
    expect(titles[1]).toHaveTextContent('Older notice');
    expect(screen.getByTestId('notification-count')).toHaveTextContent('2');
  });

  it('navigates to the create flow from the list page', async () => {
    render(<NotificationList />);

    await screen.findByText('Newer warning');
    fireEvent.click(screen.getByRole('button', { name: 'notifications:notification.create' }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/notifications/new');
    });
  });

  it('deletes a notification through the list action', async () => {
    render(<NotificationList />);

    await screen.findByText('Newer warning');
    fireEvent.click(screen.getByRole('button', { name: 'delete-notif-2' }));

    await waitFor(() => {
      expect(notificationsDelete).toHaveBeenCalledWith('notif-2');
    });
  });
});
