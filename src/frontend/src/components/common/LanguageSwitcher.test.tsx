import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LanguageSwitcher from './LanguageSwitcher';

const { changeLanguageMock, useThemeMock } = vi.hoisted(() => ({
  changeLanguageMock: vi.fn(),
  useThemeMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'vi',
      changeLanguage: changeLanguageMock,
    },
  }),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: useThemeMock,
}));

vi.mock('antd', () => ({
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
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useThemeMock.mockReturnValue({
      theme: {
        token: {
          marginXS: 4,
          paddingXS: 6,
          paddingSM: 8,
          borderRadiusSM: 6,
          colorText: '#111',
          colorBgTextHover: 'rgb(1, 2, 3)',
          fontSize: 16,
        },
      },
    });
  });

  it('changes language from dropdown actions and reacts to hover styles', () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'language.en' }));
    fireEvent.click(screen.getByRole('button', { name: 'language.vi' }));

    const trigger = screen.getByRole('button', { name: 'language.en' }).parentElement?.firstElementChild as HTMLElement;

    fireEvent.mouseEnter(trigger);
    expect(trigger.style.backgroundColor).toBe('rgb(1, 2, 3)');

    fireEvent.mouseLeave(trigger);
    expect(trigger.style.backgroundColor).toBe('transparent');

    expect(changeLanguageMock).toHaveBeenCalledWith('en');
    expect(changeLanguageMock).toHaveBeenCalledWith('vi');
  });
});
