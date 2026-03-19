import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotificationPreferencesPage from './NotificationPreferencesPage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getPreferences,
  testEmail,
  updatePreferences,
  loggerError,
} = vi.hoisted(() => ({
  getPreferences: vi.fn(),
  testEmail: vi.fn(),
  updatePreferences: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/services/notification/notificationService', () => ({
  default: {
    getPreferences,
    testEmail,
    updatePreferences,
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
    error: loggerError,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('NotificationPreferencesPage', () => {
  const preferences = {
    userId: 'user-1',
    inAppEnabled: true,
    emailEnabled: true,
    types: {
      lowStock: true,
      newOrder: true,
      orderStatusChange: false,
      overdueDebt: true,
      deliveryDate: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getPreferences.mockResolvedValue(preferences);
    testEmail.mockResolvedValue({ connected: true, message: 'SMTP ready' });
    updatePreferences.mockResolvedValue(preferences);
  });

  it('loads preferences and email connection state on mount', async () => {
    render(<App><NotificationPreferencesPage /></App>);

    await waitFor(() => {
      expect(getPreferences).toHaveBeenCalled();
      expect(testEmail).toHaveBeenCalled();
    });

    expect(await screen.findByText('notifications.preferences.title')).toBeInTheDocument();
    expect(
      screen.queryByText('notifications.preferences.emailServiceNotConfigured'),
    ).not.toBeInTheDocument();
  });

  it('shows warning when email service is not connected', async () => {
    testEmail.mockResolvedValue({ connected: false, message: 'SMTP unavailable' });

    render(<App><NotificationPreferencesPage /></App>);

    expect(
      await screen.findByText('notifications.preferences.emailServiceNotConfigured'),
    ).toBeInTheDocument();
  });

  it('saves the loaded preferences', async () => {
    render(<App><NotificationPreferencesPage /></App>);

    await screen.findByText('notifications.preferences.title');
    fireEvent.click(screen.getByRole('button', { name: /notifications\.preferences\.savePreferences/i }));

    await waitFor(() => {
      expect(updatePreferences).toHaveBeenCalledWith({
        inAppEnabled: true,
        emailEnabled: true,
        types: preferences.types,
      });
    });
  });
});

