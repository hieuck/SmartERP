import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@/test/test-utils';
import ResetPasswordPage from './ResetPasswordPage';

const { resetPasswordMock } = vi.hoisted(() => ({
  resetPasswordMock: vi.fn(),
}));

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'auth:resetPassword.title': 'Create a new password',
    'auth:resetPassword.subtitle': 'Choose a strong password for your SmartERP workspace.',
    'auth:resetPassword.submitButton': 'Update password',
    'auth:resetPassword.successTitle': 'Password updated',
    'auth:resetPassword.successDescription':
      'Your password has been changed successfully. You can sign in again now.',
    'auth:resetPassword.errorTitle': 'Unable to reset password',
    'auth:resetPassword.error': 'Password reset failed',
    'auth:resetPassword.invalidTokenTitle': 'Reset link is missing or invalid',
    'auth:resetPassword.invalidTokenDescription':
      'Request a new reset email and open the latest secure link from your inbox.',
    'auth:resetPassword.requestNewLink': 'Request a new link',
    'auth:resetPassword.backToLogin': 'Back to login',
    'auth:register.password': 'Password',
    'auth:register.confirmPassword': 'Confirm Password',
    'auth:register.passwordMismatch': 'Passwords do not match',
    'auth:validation.passwordRequired': 'Please enter your password',
    'auth:validation.confirmPasswordRequired': 'Please confirm your password',
    'auth:validation.passwordMinLength': 'Password must be at least 8 characters',
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
    resetPassword: resetPasswordMock,
  },
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    resetPasswordMock.mockReset();
    window.history.replaceState({}, '', '/reset-password');
  });

  it('shows a warning result when the token is missing', () => {
    render(<ResetPasswordPage />);

    expect(screen.getByText('Reset link is missing or invalid')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request a new link' })).toBeInTheDocument();
  });

  it('renders the reset password form when a token is present', () => {
    window.history.replaceState({}, '', '/reset-password?token=reset-token');

    render(<ResetPasswordPage />);

    expect(screen.getByRole('heading', { name: 'Create a new password' })).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('shows a success result after resetting the password', async () => {
    window.history.replaceState({}, '', '/reset-password?token=reset-token');
    resetPasswordMock.mockResolvedValue({
      message: 'Password reset successful',
    });

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'NewPassword1' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'NewPassword1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => expect(screen.getByText('Password updated')).toBeInTheDocument());
  });
});
