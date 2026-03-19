import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

const { setThemeModeMock, useThemeContextMock } = vi.hoisted(() => ({
  setThemeModeMock: vi.fn(),
  useThemeContextMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useThemeContext: useThemeContextMock,
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

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useThemeContextMock.mockReturnValue({
      themeMode: 'dark',
      setThemeMode: setThemeModeMock,
      theme: {
        token: {
          marginXS: 4,
          paddingXS: 6,
          paddingSM: 8,
          borderRadiusSM: 6,
          colorText: '#111',
          colorBgTextHover: 'rgb(5, 6, 7)',
          fontSize: 16,
        },
      },
    });
  });

  it('switches theme modes and applies hover styling', () => {
    render(<ThemeToggle className="theme-toggle" />);

    fireEvent.click(screen.getByRole('button', { name: 'theme.light' }));
    fireEvent.click(screen.getByRole('button', { name: 'theme.dark' }));
    fireEvent.click(screen.getByRole('button', { name: 'theme.auto' }));

    const trigger = document.querySelector('.theme-toggle') as HTMLElement;

    fireEvent.mouseEnter(trigger);
    expect(trigger.style.backgroundColor).toBe('rgb(5, 6, 7)');

    fireEvent.mouseLeave(trigger);
    expect(trigger.style.backgroundColor).toBe('transparent');

    expect(setThemeModeMock).toHaveBeenNthCalledWith(1, 'light');
    expect(setThemeModeMock).toHaveBeenNthCalledWith(2, 'dark');
    expect(setThemeModeMock).toHaveBeenNthCalledWith(3, 'auto');
  });
});
