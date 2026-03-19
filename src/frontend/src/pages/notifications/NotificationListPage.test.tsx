import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotificationListPage from './NotificationListPage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  navigate,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  loggerError,
} = vi.hoisted(() => ({
  navigate: vi.fn(),
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/services/notification/notificationService', () => ({
  default: {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
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

describe('NotificationListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getNotifications.mockResolvedValue({
      data: [
        {
          id: 'notif-1',
          title: 'Low stock',
          message: 'Product is low',
          type: 'lowStock',
          isRead: false,
          createdAt: '2026-03-19T10:00:00.000Z',
          metadata: { link: '/dashboard/products/1' },
        },
      ],
      total: 1,
    });
  });

  it('loads notifications on mount and when switching to unread tab', async () => {
    render(<NotificationListPage />);

    await waitFor(() => {
      expect(getNotifications).toHaveBeenNthCalledWith(1, {
        page: 1,
        limit: 20,
        isRead: undefined,
      });
    });

    fireEvent.click(screen.getByText('notifications:center.unread'));

    await waitFor(() => {
      expect(getNotifications).toHaveBeenNthCalledWith(2, {
        page: 1,
        limit: 20,
        isRead: false,
      });
    });
  });

  it('marks all notifications as read', async () => {
    markAllAsRead.mockResolvedValue(undefined);

    render(<NotificationListPage />);

    await screen.findByText('Low stock');
    fireEvent.click(screen.getByRole('button', { name: /notifications:center\.markAllRead/i }));

    await waitFor(() => {
      expect(markAllAsRead).toHaveBeenCalled();
    });
  });

  it('marks a notification as read and navigates to its link when clicked', async () => {
    markAsRead.mockResolvedValue(undefined);

    render(<NotificationListPage />);

    const item = await screen.findByText('Low stock');
    fireEvent.click(item);

    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith('notif-1');
      expect(navigate).toHaveBeenCalledWith('/dashboard/products/1');
    });
  });
});
