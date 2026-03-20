import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from 'antd';
import InvoiceList from './InvoiceList';

const {
  getAllInvoicesMock,
  getQueueSizeMock,
  isSyncingMock,
  messageMock,
  navigateMock,
  responsiveState,
} = vi.hoisted(() => ({
  getAllInvoicesMock: vi.fn(),
  getQueueSizeMock: vi.fn(),
  isSyncingMock: vi.fn(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
  navigateMock: vi.fn(),
  responsiveState: { isMobile: false },
}));

vi.mock('@ant-design/icons', () => ({
  CloudOutlined: () => <span>icon-cloud</span>,
  DisconnectOutlined: () => <span>icon-disconnect</span>,
  FileTextOutlined: () => <span>icon-file</span>,
  SyncOutlined: ({ spin }: { spin?: boolean }) => <span>{spin ? 'icon-sync-spin' : 'icon-sync'}</span>,
}));

vi.mock('antd', () => {
  const Select = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  Select.Option = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;

  return {
    App: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
      useApp: () => ({ message: messageMock }),
    }),
    Badge: ({
      children,
      text,
    }: {
      children?: React.ReactNode;
      text?: React.ReactNode;
    }) => (
      <div>
        {text}
        {children}
      </div>
    ),
    Button: ({
      children,
      onClick,
      disabled,
      icon,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      icon?: React.ReactNode;
    }) => (
      <button onClick={onClick} disabled={disabled}>
        {icon}
        {children}
      </button>
    ),
    DatePicker: {
      RangePicker: () => <div>range-picker</div>,
    },
    Select,
    Space: ({
      children,
      orientation,
      ...rest
    }: {
      children?: React.ReactNode;
      orientation?: 'horizontal' | 'vertical';
      [key: string]: unknown;
    }) => (
      <div data-orientation={orientation ?? 'horizontal'} {...rest}>
        {children}
      </div>
    ),
    Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  };
});

vi.mock('@/components/common/StandardListPage', () => ({
  default: ({
    title,
    extraActions,
    filters,
  }: {
    title?: React.ReactNode;
    extraActions?: React.ReactNode;
    filters?: React.ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <div>{filters}</div>
      <div>{extraActions}</div>
    </div>
  ),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => responsiveState,
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/offline/db', () => ({
  SyncStatus: {
    SYNCED: 'synced',
    PENDING: 'pending',
    CONFLICT: 'conflict',
  },
}));

vi.mock('@/lib/offline/sync-manager', () => ({
  syncManager: {
    getQueueSize: getQueueSizeMock,
    isSyncing: isSyncingMock,
    sync: vi.fn(),
  },
}));

vi.mock('@/services/offline-services', () => ({
  offlineServices: {
    invoices: {
      getAll: getAllInvoicesMock,
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/utils/responsive', () => ({
  formatCurrency: (value: number) => `currency-${value}`,
  formatDate: (value: string) => `date-${value}`,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => {
      if (values?.total) {
        return `${key}:${values.total}`;
      }
      return key;
    },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('InvoiceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    responsiveState.isMobile = false;
    getAllInvoicesMock.mockResolvedValue([
      {
        id: 'invoice-1',
        invoiceNumber: 'INV-001',
        customerName: 'Acme Co',
        issueDate: '2024-01-15',
        dueDate: '2024-01-30',
        totalAmount: 1200,
        paidAmount: 0,
        status: 'draft',
        syncStatus: 'synced',
      },
    ]);
    getQueueSizeMock.mockResolvedValue(0);
    isSyncingMock.mockReturnValue(false);
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  it('renders localized sync actions and uses vertical orientation on mobile', async () => {
    responsiveState.isMobile = true;

    render(
      <App>
        <InvoiceList />
      </App>,
    );

    await waitFor(() => expect(getAllInvoicesMock).toHaveBeenCalled());

    expect(screen.getByTestId('invoice-sync-actions')).toHaveAttribute('data-orientation', 'vertical');
    expect(screen.getByText('invoices:sync.online')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invoices:sync.syncNow/i })).toBeInTheDocument();
  });

  it('routes network-status feedback through Ant App message context', async () => {
    render(
      <App>
        <InvoiceList />
      </App>,
    );

    await waitFor(() => expect(getAllInvoicesMock).toHaveBeenCalled());

    fireEvent(window, new Event('online'));
    fireEvent(window, new Event('offline'));

    expect(messageMock.success).toHaveBeenCalledWith('common:messages.networkRestored');
    expect(messageMock.warning).toHaveBeenCalledWith('common:messages.networkLost');
  });
});
