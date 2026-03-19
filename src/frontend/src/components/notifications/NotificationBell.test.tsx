import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotificationBell from './NotificationBell';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  navigate,
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  loggerError,
} = vi.hoisted(() => ({
  navigate: vi.fn(),
  getUnreadCount: vi.fn(),
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    Dropdown: ({ children, dropdownRender, open, onOpenChange }: any) => (
      <div>
        <button onClick={() => onOpenChange?.(!open)}>toggle-dropdown</button>
        {children}
        {open ? dropdownRender?.() : null}
      </div>
    ),
  };
});

vi.mock('@/services/notification/notificationService', () => ({
  default: {
    getUnreadCount,
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

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUnreadCount.mockResolvedValue(2);
    getNotifications.mockResolvedValue({
      data: [
        {
          id: 'notif-1',
          title: 'Low stock',
          message: 'Please restock',
          type: 'lowStock',
          isRead: false,
          createdAt: '2026-03-19T10:00:00.000Z',
          metadata: { link: '/inventory/products/1' },
        },
      ],
      total: 1,
    });
    markAsRead.mockResolvedValue(undefined);
    markAllAsRead.mockResolvedValue(undefined);
    deleteNotification.mockResolvedValue(undefined);
  });

  it('loads unread count on mount and notifications when opened', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(getUnreadCount).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'toggle-dropdown' }));

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    expect(await screen.findByText('Low stock')).toBeInTheDocument();
  });

  it('marks all notifications as read from the dropdown', async () => {
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'toggle-dropdown' }));
    await screen.findByText('Low stock');
    fireEvent.click(screen.getByRole('button', { name: /mark all read/i }));

    await waitFor(() => {
      expect(markAllAsRead).toHaveBeenCalled();
    });
  });

  it('marks a notification as read and navigates when clicked', async () => {
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'toggle-dropdown' }));
    const notification = await screen.findByText('Low stock');
    fireEvent.click(notification);

    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith('notif-1');
      expect(navigate).toHaveBeenCalledWith('/inventory/products/1');
    });
  });
});
