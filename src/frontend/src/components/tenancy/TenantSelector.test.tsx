import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantSelector } from './TenantSelector';

vi.mock('@ant-design/icons', () => ({
  ShopOutlined: () => <span>icon-shop</span>,
}));

vi.mock('antd', () => {
  const Option = ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-value={value}>{children}</div>;

  return {
    Avatar: ({ children, icon }: { children?: React.ReactNode; icon?: React.ReactNode }) => (
      <div>{children ?? icon}</div>
    ),
    Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Select: Object.assign(
      ({
        children,
        placeholder,
        onChange,
      }: {
        children: React.ReactNode;
        placeholder?: string;
        onChange?: (value: string) => void;
      }) => (
        <div>
          <button onClick={() => onChange?.('1')}>{placeholder}</button>
          <div>{children}</div>
        </div>
      ),
      {
        Option,
      },
    ),
    Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Typography: {
      Title: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    },
  };
});

describe('TenantSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the built-in tenant options with clean locale text', async () => {
    render(<TenantSelector onTenantChange={vi.fn()} />);

    expect(await screen.findByText('Công ty TNHH ABC')).toBeInTheDocument();
    expect(screen.getByText('Công ty XYZ')).toBeInTheDocument();
    expect(screen.getByText('VND • Asia/Ho_Chi_Minh')).toBeInTheDocument();
    expect(screen.getByText('USD • Asia/Ho_Chi_Minh')).toBeInTheDocument();
  });

  it('propagates tenant selection and persists it to localStorage', () => {
    const onTenantChange = vi.fn();
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem');

    render(<TenantSelector onTenantChange={onTenantChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Chọn tổ chức để làm việc' }));

    expect(onTenantChange).toHaveBeenCalledWith('1');
    expect(setItemSpy).toHaveBeenCalledWith('selectedTenant', '1');
  });
});
