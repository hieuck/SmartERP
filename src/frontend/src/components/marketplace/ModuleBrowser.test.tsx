import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from 'antd';
import { ModuleBrowser } from './ModuleBrowser';

const { messageSuccessMock, modalConfirmMock } = vi.hoisted(() => ({
  messageSuccessMock: vi.fn(),
  modalConfirmMock: vi.fn(),
}));

vi.mock('@ant-design/icons', () => ({
  CheckCircleOutlined: () => <span>icon-check</span>,
  DownloadOutlined: () => <span>icon-download</span>,
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    App: Object.assign(
      ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      {
        useApp: () => ({
          message: { success: messageSuccessMock },
          modal: { confirm: modalConfirmMock },
        }),
      },
    ),
    Row: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Col: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Card: ({ title, extra, actions, children }: { title: React.ReactNode; extra?: React.ReactNode; actions?: React.ReactNode[]; children: React.ReactNode }) => (
      <section>
        <h2>{title}</h2>
        {extra}
        <div>{children}</div>
        <div>{actions}</div>
      </section>
    ),
    Button: ({ children, onClick, icon, type }: { children?: React.ReactNode; onClick?: () => void; icon?: React.ReactNode; type?: string }) => (
      <button data-type={type} onClick={onClick}>
        {icon}
        {children}
      </button>
    ),
    Tag: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Rate: ({ value }: { value: number }) => <span>rating-{value}</span>,
  };
});

describe('ModuleBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderBrowser = () => render(<App><ModuleBrowser /></App>);

  it('renders seeded marketplace modules with clean Vietnamese copy', () => {
    renderBrowser();

    expect(screen.getByText('CRM Advanced')).toBeInTheDocument();
    expect(screen.getByText('Quản lý khách hàng nâng cao với tính năng email marketing')).toBeInTheDocument();
    expect(screen.getByText('Accounting Plus')).toBeInTheDocument();
    expect(screen.getByText(/v2\.0\.1/)).toBeInTheDocument();
  });

  it('confirms installation and marks the module as installed', () => {
    modalConfirmMock.mockImplementation(({ onOk }: { onOk?: () => void }) => onOk?.());
    renderBrowser();

    fireEvent.click(screen.getAllByRole('button', { name: /Cài đặt|Đã cài đặt/ })[0]);

    expect(modalConfirmMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Xác nhận cài đặt' }));
    expect(messageSuccessMock).toHaveBeenCalledWith('Đã cài đặt module thành công');
    expect(screen.getAllByRole('button', { name: /Đã cài đặt/ }).length).toBeGreaterThan(0);
  });

  it('confirms uninstall for an installed module', () => {
    modalConfirmMock.mockImplementation(({ onOk }: { onOk?: () => void }) => onOk?.());
    renderBrowser();

    fireEvent.click(screen.getByRole('button', { name: /Đã cài đặt/ }));

    expect(modalConfirmMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Xác nhận gỡ bỏ' }));
    expect(messageSuccessMock).toHaveBeenCalledWith('Đã gỡ bỏ module');
  });
});
