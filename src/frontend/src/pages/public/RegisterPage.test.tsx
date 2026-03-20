import { App } from 'antd';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@/test/test-utils';
import RegisterPage from './RegisterPage';

const { registerMock } = vi.hoisted(() => ({
  registerMock: vi.fn(),
}));

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'auth:register.title': 'Create your SmartERP workspace',
    'auth:register.subtitle': 'Start with a guided setup for your team.',
    'auth:register.companyInfo': 'Company Information',
    'auth:register.accountInfo': 'Account Information',
    'auth:register.companyName': 'Company Name',
    'auth:register.workspaceUrl': 'Workspace URL',
    'auth:register.workspaceUrlHelp': 'SmartERP generates your workspace URL automatically from your company name.',
    'auth:register.fullName': 'Full Name',
    'auth:register.email': 'Email',
    'auth:register.phone': 'Phone Number',
    'auth:register.password': 'Password',
    'auth:register.confirmPassword': 'Confirm Password',
    'auth:register.agreeTerms': 'I agree to the',
    'auth:register.termsOfService': 'Terms of Service',
    'auth:register.and': 'and',
    'auth:register.privacyPolicy': 'Privacy Policy',
    'auth:register.registerButton': 'Create account',
    'auth:register.haveAccount': 'Already have an account?',
    'auth:register.signIn': 'Sign in',
    'auth:register.success': 'Registration successful',
    'auth:register.error': 'Registration failed',
    'auth:register.passwordMismatch': 'Passwords do not match',
    'auth:register.benefits.title': 'What you unlock',
    'auth:register.benefits.trial': '14-day guided trial',
    'auth:register.benefits.noCard': 'No credit card required',
    'auth:register.benefits.support': 'Priority setup support',
    'auth:register.benefits.training': 'Onboarding training included',
    'auth:register.benefits.cancel': 'Cancel whenever you need',
    'auth:validation.companyNameRequired': 'Company name is required',
    'auth:validation.fullNameRequired': 'Full name is required',
    'auth:validation.emailRequired': 'Email is required',
    'auth:validation.emailInvalid': 'Email is invalid',
    'auth:validation.passwordRequired': 'Password is required',
    'auth:validation.confirmPasswordRequired': 'Please confirm your password',
    'auth:validation.passwordMinLength': 'Password must be at least 8 characters',
    'auth:validation.agreeTermsRequired': 'Please accept the terms',
    'common:validation.required': 'Required',
    'common:validation.phone': 'Phone is invalid',
    'common:messages.loading': 'Loading...',
  };

  return {
    useTranslation: () => ({
      t: (key: string) => translations[key] ?? key,
    }),
  };
});

vi.mock('@/components/common/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher">language-switcher</div>,
}));

vi.mock('@/services/auth/authService', () => ({
  authService: {
    register: registerMock,
  },
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    registerMock.mockReset();
  });

  it('renders distinct company and account sections with the language switcher', () => {
    render(
      <App>
        <RegisterPage />
      </App>,
    );

    expect(screen.getByRole('heading', { name: 'Company Information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account Information' })).toBeInTheDocument();
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('shows the onboarding benefits that support the new registration flow', () => {
    render(
      <App>
        <RegisterPage />
      </App>,
    );

    expect(screen.getByText('What you unlock')).toBeInTheDocument();
    expect(screen.getByText('14-day guided trial')).toBeInTheDocument();
    expect(screen.getByText('No credit card required')).toBeInTheDocument();
    expect(screen.getByText('Priority setup support')).toBeInTheDocument();
    expect(screen.getByText('Onboarding training included')).toBeInTheDocument();
    expect(screen.getByText('Cancel whenever you need')).toBeInTheDocument();
  });

  it('marks password fields with new-password autocomplete for browser-friendly signup UX', () => {
    const { container } = render(
      <App>
        <RegisterPage />
      </App>,
    );

    const passwordInput = container.querySelector('#password');
    const confirmPasswordInput = container.querySelector('#confirmPassword');

    expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');
  });

  it('auto-generates a normalized workspace URL preview from the company name', async () => {
    render(
      <App>
        <RegisterPage />
      </App>,
    );

    fireEvent.change(screen.getByLabelText('Company Name'), {
      target: { value: 'Công ty Đặng Khoa' },
    });

    const workspaceInput = screen.getByLabelText('Workspace URL');
    await waitFor(() => expect(workspaceInput).toHaveValue('cong-ty-dang-khoa'));
    expect(workspaceInput).toHaveAttribute('readonly');
  });

  it('uses browser-friendly autocomplete values on key registration inputs', () => {
    render(
      <App>
        <RegisterPage />
      </App>,
    );

    expect(screen.getByLabelText('Company Name')).toHaveAttribute('autocomplete', 'organization');
    expect(screen.getByLabelText('Full Name')).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText('Phone Number')).toHaveAttribute('autocomplete', 'tel');
  });

  it('renders legal acknowledgements as working internal links', () => {
    render(
      <App>
        <RegisterPage />
      </App>,
    );

    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
  });
});
