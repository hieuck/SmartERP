import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';

const {
  getOverviewMock,
  getSalesChartMock,
  getTopProductsMock,
  getTopCustomersMock,
  getRevenueByCategoryMock,
  messageErrorMock,
} = vi.hoisted(() => ({
  getOverviewMock: vi.fn(),
  getSalesChartMock: vi.fn(),
  getTopProductsMock: vi.fn(),
  getTopCustomersMock: vi.fn(),
  getRevenueByCategoryMock: vi.fn(),
  messageErrorMock: vi.fn(),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
  }),
}));

vi.mock('@/services/dashboard/dashboardService', () => ({
  dashboardService: {
    getOverview: getOverviewMock,
    getSalesChart: getSalesChartMock,
    getTopProducts: getTopProductsMock,
    getTopCustomers: getTopCustomersMock,
    getRevenueByCategory: getRevenueByCategoryMock,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('antd', () => ({
  App: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    useApp: () => ({
      message: {
        error: messageErrorMock,
      },
    }),
  }),
  Card: ({ children, title }: { children?: React.ReactNode; title?: React.ReactNode }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  ),
  Col: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Row: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Spin: () => <div>loading</div>,
  Statistic: ({ title, value }: { title?: React.ReactNode; value?: React.ReactNode }) => (
    <div>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
  Table: () => <div>table</div>,
}));

vi.mock('@ant-design/icons', () => {
  const Icon = () => null;

  return {
    CreditCardOutlined: Icon,
    DollarOutlined: Icon,
    FallOutlined: Icon,
    InboxOutlined: Icon,
    RiseOutlined: Icon,
    ShoppingCartOutlined: Icon,
    UserOutlined: Icon,
    WarningOutlined: Icon,
  };
});

vi.mock('recharts', () => {
  const MockChart = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;

  return {
    ResponsiveContainer: MockChart,
    LineChart: MockChart,
    Line: MockChart,
    BarChart: MockChart,
    Bar: MockChart,
    PieChart: MockChart,
    Pie: MockChart,
    Cell: MockChart,
    CartesianGrid: MockChart,
    XAxis: MockChart,
    YAxis: MockChart,
    Tooltip: MockChart,
    Legend: MockChart,
  };
});

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOverviewMock.mockResolvedValue({
      revenue: { today: 0, thisWeek: 0, thisMonth: 0, growth: 0 },
      orders: { total: 0, pending: 0, completed: 0, cancelled: 0 },
      inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
      customers: { total: 0, active: 0, new: 0 },
      payments: { pending: 0, completed: 0, totalAmount: 0 },
    });
    getSalesChartMock.mockResolvedValue([]);
    getTopProductsMock.mockResolvedValue([]);
    getTopCustomersMock.mockResolvedValue([]);
    getRevenueByCategoryMock.mockResolvedValue([]);
  });

  it('renders dashboard title after loading data', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('dashboard:title')).toBeInTheDocument();
    expect(getSalesChartMock).toHaveBeenCalledWith(30);
    expect(getTopProductsMock).toHaveBeenCalledWith(10);
    expect(getTopCustomersMock).toHaveBeenCalledWith(10);
  });

  it('shows contextual error feedback when loading fails', async () => {
    getOverviewMock.mockRejectedValueOnce(new Error('Backend unavailable'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(messageErrorMock).toHaveBeenCalledWith('Backend unavailable');
    });
  });
});
