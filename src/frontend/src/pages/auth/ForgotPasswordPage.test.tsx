import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@/test/test-utils';
import ForgotPasswordPage from './ForgotPasswordPage';

const { forgotPasswordMock } = vi.hoisted(() => ({
  forgotPasswordMock: vi.fn(),
}));

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'auth:forgotPassword.title': 'Reset your password',
    'auth:forgotPassword.subtitle': "Enter your work email and we'll send password reset instructions.",
    'auth:forgotPassword.submitButton': 'Send reset instructions',
    'auth:forgotPassword.successTitle': 'Check your inbox',
    'auth:forgotPassword.successDescription': 'If the email exists, a password reset link is on its way.',
    'auth:forgotPassword.errorTitle': 'Unable to send reset instructions',
    'auth:forgotPassword.error': 'Password reset request failed',
    'auth:forgotPassword.backToLogin': 'Back to login',
    'auth:login.email': 'Email',
    'auth:validation.emailRequired': 'Please enter your email',
    'auth:validation.emailInvalid': 'Invalid email address',
    'common:messages.loading': 'Loading...',
  };

  return {
    useTranslation: () => ({
      t: (key: string) => translations[key] ?? key,
    }),
  };
});

vi.mock('@/components/common/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher" />,
}));

vi.mock('@/services/auth/authService', () => ({
  authService: {
    forgotPassword: forgotPasswordMock,
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset();
  });

  it('renders the forgot password form', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset instructions' })).toBeInTheDocument();
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });

  it('shows a success result after requesting a reset link', async () => {
    forgotPasswordMock.mockResolvedValue({
      message: 'If the email exists, a password reset link is on its way.',
    });

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset instructions' }));

    await waitFor(() => expect(screen.getByText('Check your inbox')).toBeInTheDocument());
  });

  it('shows inline error feedback when the request fails', async () => {
    forgotPasswordMock.mockRejectedValue(new Error('Too many requests'));

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset instructions' }));

    await waitFor(() => expect(screen.getByText('Too many requests')).toBeInTheDocument());
  });
});
