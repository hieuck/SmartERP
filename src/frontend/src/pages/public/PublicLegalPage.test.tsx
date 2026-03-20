import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@/test/test-utils';
import PublicLegalPage from './PublicLegalPage';

const { i18nState } = vi.hoisted(() => ({
  i18nState: {
    language: 'en',
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: i18nState.language,
      resolvedLanguage: i18nState.language,
    },
  }),
}));

vi.mock('@/components/common/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher" />,
}));

vi.mock('@/components/common/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle" />,
}));

describe('PublicLegalPage', () => {
  beforeEach(() => {
    i18nState.language = 'en';
  });

  it('renders the English terms experience with clear next actions', () => {
    render(<PublicLegalPage policy="terms" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeInTheDocument();
    expect(screen.getByText('Workspace access and fair use')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start free trial' })).toBeInTheDocument();
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders the Vietnamese privacy experience when the locale is vi', () => {
    i18nState.language = 'vi';

    render(<PublicLegalPage policy="privacy" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Chính sách bảo mật' })).toBeInTheDocument();
    expect(screen.getByText('Thông tin chúng tôi thu thập')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Điều khoản dịch vụ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo workspace' })).toBeInTheDocument();
  });
});
