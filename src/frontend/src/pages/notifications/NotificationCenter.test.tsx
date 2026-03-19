import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationCenter from './NotificationCenter';
import { NotificationPriority, NotificationType } from '@/services/notification/notificationService';

const {
  getAllMock,
  getUnreadCountMock,
  markAsReadMock,
  markAllAsReadMock,
  deleteMock,
  messageSuccessMock,
  messageErrorMock,
  loggerErrorMock,
} = vi.hoisted(() => ({
  getAllMock: vi.fn(),
  getUnreadCountMock: vi.fn(),
  markAsReadMock: vi.fn(),
  markAllAsReadMock: vi.fn(),
  deleteMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageErrorMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock('@/services/notification/notificationService', () => ({
  NotificationType: {
    INFO: 'INFO',
    SUCCESS: 'SUCCESS',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
  },
  NotificationPriority: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
  },
  default: {
    getAll: getAllMock,
    getUnreadCount: getUnreadCountMock,
    markAsRead: markAsReadMock,
    markAllAsRead: markAllAsReadMock,
    delete: deleteMock,
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
    error: loggerErrorMock,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('dayjs', () => {
  const dayjsMock = ((value: string) => ({
    fromNow: () => `fromNow:${value}`,
  })) as unknown as typeof import('dayjs').default;
  (dayjsMock as unknown as { extend: (plugin: unknown) => void; locale: (locale: string) => void }).extend = vi.fn();
  (dayjsMock as unknown as { extend: (plugin: unknown) => void; locale: (locale: string) => void }).locale = vi.fn();
  return {
    default: dayjsMock,
  };
});

vi.mock('dayjs/plugin/relativeTime', () => ({
  default: {},
}));

vi.mock('antd', () => ({
  Badge: ({
    count,
    text,
  }: {
    count?: number;
    text?: React.ReactNode;
  }) => <span>{text ?? `badge:${count}`}</span>,
  Button: Object.assign(
    ({
      children,
      onClick,
      icon,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      icon?: React.ReactNode;
    }) => <button onClick={onClick}>{children ?? icon ?? 'button'}</button>,
    {
      Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    },
  ),
  Card: ({
    title,
    extra,
    children,
  }: {
    title?: React.ReactNode;
    extra?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <div>{extra}</div>
      <div>{children}</div>
    </div>
  ),
  Dropdown: ({
    children,
    menu,
  }: {
    children: React.ReactNode;
    menu?: { items?: Array<{ key: string; label?: React.ReactNode; onClick?: () => void }> };
  }) => (
    <div>
      {children}
      {menu?.items?.map((item) => (
        <button key={item.key} onClick={item.onClick}>
          {item.label}
        </button>
      ))}
    </div>
  ),
  Empty: ({ description }: { description?: React.ReactNode }) => <div>{description}</div>,
  List: Object.assign(
    ({
      dataSource = [],
      renderItem,
    }: {
      dataSource?: unknown[];
      renderItem: (item: unknown, index: number) => React.ReactNode;
    }) => <div>{dataSource.map((item, index) => <div key={index}>{renderItem(item, index)}</div>)}</div>,
    {
      Item: Object.assign(
        ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode[] }) => (
          <div>
            <div>{children}</div>
            <div>{actions}</div>
          </div>
        ),
        {
          Meta: ({
            title,
            description,
            avatar,
          }: {
            title?: React.ReactNode;
            description?: React.ReactNode;
            avatar?: React.ReactNode;
          }) => (
            <div>
              <div>{avatar}</div>
              <div>{title}</div>
              <div>{description}</div>
            </div>
          ),
        },
      ),
    },
  ),
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Spin: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tag: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  message: {
    success: messageSuccessMock,
    error: messageErrorMock,
  },
  theme: {
    useToken: () => ({
      token: {
        colorPrimaryBg: '#f0f5ff',
      },
    }),
  },
}));

describe('NotificationCenter', () => {
  const notifications = [
    {
      id: 'notif-1',
      userId: 'user-1',
      type: NotificationType.INFO,
      priority: NotificationPriority.HIGH,
      title: 'Unread notification',
      message: 'Please review me',
      isRead: false,
      createdAt: '2026-03-19T00:00:00.000Z',
      link: '/notifications/notif-1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getAllMock.mockResolvedValue({ data: notifications });
    getUnreadCountMock.mockResolvedValue(3);
    markAsReadMock.mockResolvedValue(undefined);
    markAllAsReadMock.mockResolvedValue(undefined);
    deleteMock.mockResolvedValue(undefined);
  });

  it('loads notifications and unread count on mount', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(getAllMock).toHaveBeenCalledWith({ page: 1, limit: 50, isRead: undefined });
      expect(getUnreadCountMock).toHaveBeenCalled();
    });

    expect(await screen.findByText('Unread notification')).toBeInTheDocument();
    expect(screen.getByText('notifications.center.title')).toBeInTheDocument();
    expect(screen.getByText('badge:3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'notifications.center.markAllRead' })).toBeInTheDocument();
  });

  it('switches to unread filter and reloads the list', async () => {
    render(<NotificationCenter />);

    await screen.findByText('Unread notification');
    fireEvent.click(screen.getByRole('button', { name: 'notifications.center.unread (3)' }));

    await waitFor(() => {
      expect(getAllMock).toHaveBeenLastCalledWith({ page: 1, limit: 50, isRead: false });
    });
  });

  it('marks notifications as read and deletes them through dropdown actions', async () => {
    render(<NotificationCenter />);

    await screen.findByText('Unread notification');

    fireEvent.click(screen.getByRole('button', { name: 'notifications.center.markAsRead' }));
    fireEvent.click(screen.getByRole('button', { name: 'notifications.center.delete' }));

    await waitFor(() => {
      expect(markAsReadMock).toHaveBeenCalledWith('notif-1');
      expect(deleteMock).toHaveBeenCalledWith('notif-1');
    });

    expect(messageSuccessMock).toHaveBeenCalledWith('notifications.messages.markedAsRead');
    expect(messageSuccessMock).toHaveBeenCalledWith('notifications.messages.deleteSuccess');
  });
});
