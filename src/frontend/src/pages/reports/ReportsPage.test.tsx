import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReportsPage from './ReportsPage';

const { exportExcelMock, exportPdfMock, messageErrorMock, messageSuccessMock } = vi.hoisted(() => ({
  exportExcelMock: vi.fn(),
  exportPdfMock: vi.fn(),
  messageErrorMock: vi.fn(),
  messageSuccessMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('dayjs', () => ({
  default: Object.assign(
    (value?: string) => ({
      endOf: () => ({ format: () => '2026-03-31' }),
      format: () => value ?? '2026-03-20',
      startOf: () => ({ format: () => '2026-03-01' }),
    }),
    {
      endOf: () => ({ format: () => '2026-03-31' }),
      startOf: () => ({ format: () => '2026-03-01' }),
    },
  ),
}));

vi.mock('@/hooks/useReports', () => ({
  useCashFlowReport: () => ({ data: null, error: null, isLoading: false }),
  useCustomerReport: () => ({ data: null, error: null, isLoading: false }),
  useDailySalesReport: () => ({ data: null, error: null, isLoading: false }),
  useExportReportExcel: () => exportExcelMock,
  useExportReportPDF: () => exportPdfMock,
  useFinancialReport: () => ({ data: null, error: null, isLoading: false }),
  useInventoryMovementsReport: () => ({ data: null, error: null, isLoading: false }),
  useInventoryReport: () => ({ data: null, error: null, isLoading: false }),
  useLowStockReport: () => ({ data: null, error: null, isLoading: false }),
  useProductPerformanceReport: () => ({ data: null, error: null, isLoading: false }),
  useProfitLossReport: () => ({ data: null, error: null, isLoading: false }),
  useSalesReport: () => ({
    data: {
      averageOrderValue: 75,
      totalOrders: 2,
      totalRevenue: 150,
    },
    error: null,
    isLoading: false,
  }),
  useTopCustomersReport: () => ({ data: null, error: null, isLoading: false }),
}));

vi.mock('@ant-design/icons', () => ({
  BarChartOutlined: () => <span>icon-chart</span>,
  FileExcelOutlined: () => <span>icon-excel</span>,
  FilePdfOutlined: () => <span>icon-pdf</span>,
}));

vi.mock('antd', () => {
  const App = Object.assign(
    ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    {
      useApp: () => ({
        message: {
          error: messageErrorMock,
          success: messageSuccessMock,
        },
      }),
    },
  );

  const Button = ({
    children,
    icon,
    onClick,
  }: {
    children?: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children ?? icon}</button>;

  const Tabs = ({
    activeKey,
    items,
    onChange,
  }: {
    activeKey?: string;
    items?: Array<{ children?: React.ReactNode; key: string; label: React.ReactNode }>;
    onChange?: (key: string) => void;
  }) => {
    const activeItem = items?.find((item) => item.key === activeKey) ?? items?.[0];

    return (
      <div>
        {items?.map((item) => (
          <button key={item.key} onClick={() => onChange?.(item.key)}>
            {item.label}
          </button>
        ))}
        <div>{activeItem?.children}</div>
      </div>
    );
  };

  return {
    App,
    Button,
    Card: ({ children, title }: { children?: React.ReactNode; title?: React.ReactNode }) => (
      <section>
        {title ? <h2>{title}</h2> : null}
        {children}
      </section>
    ),
    Col: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    DatePicker: {
      RangePicker: () => <div>range-picker</div>,
    },
    Row: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Statistic: ({
      suffix,
      title,
      value,
    }: {
      suffix?: React.ReactNode;
      title?: React.ReactNode;
      value?: React.ReactNode;
    }) => (
      <div>
        <span>{title}</span>
        <span>{value}</span>
        <span>{suffix}</span>
      </div>
    ),
    Tabs,
    Typography: {
      Title: ({ children }: { children?: React.ReactNode }) => <h1>{children}</h1>,
    },
  };
});

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exportPdfMock.mockResolvedValue({ success: true });
    exportExcelMock.mockResolvedValue({ success: true });
  });

  it('shows sales report statistics after loading the sales report', () => {
    render(<ReportsPage />);

    fireEvent.click(screen.getAllByText('reports:actions.viewReport')[0]);

    expect(screen.getByText('reports:sales.totalRevenue')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(messageSuccessMock).toHaveBeenCalledWith('reports:messages.loadSuccess');
  });

  it('exports the active sales report as PDF with success feedback', async () => {
    render(<ReportsPage />);

    fireEvent.click(screen.getAllByText('reports:actions.exportPDF')[0]);

    await waitFor(() => {
      expect(exportPdfMock).toHaveBeenCalledWith('sales', {
        endDate: '2026-03-31',
        startDate: '2026-03-01',
      });
      expect(messageSuccessMock).toHaveBeenCalledWith('reports:messages.exportPDFSuccess');
    });
  });

  it('switches tabs using the modern Tabs items API', () => {
    render(<ReportsPage />);

    fireEvent.click(screen.getByText('reports:tabs.financial'));

    expect(screen.getByText('reports:financial.report')).toBeInTheDocument();
  });
});
