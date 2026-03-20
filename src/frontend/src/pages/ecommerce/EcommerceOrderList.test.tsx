import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EcommerceOrderList from './EcommerceOrderList';

const { axiosGetMock, setSearchValue } = vi.hoisted(() => ({
  axiosGetMock: vi.fn(),
  setSearchValue: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === 'string'
        ? String(options.defaultValue)
        : typeof options?.total === 'number'
          ? `${key}:${options.total}`
          : key,
  }),
}));

vi.mock('axios', () => ({
  default: {
    get: axiosGetMock,
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryFn }: { queryFn: () => Promise<unknown> }) => {
    void queryFn();
    return {
      data: {
        data: [
          {
            id: 'o-1',
            orderNumber: 'DH-001',
            customerId: 'CUS-01',
            totalAmount: 1200000,
            status: 'confirmed',
            paymentStatus: 'paid',
            createdAt: '2026-03-20T00:00:00.000Z',
          },
          {
            id: 'o-2',
            orderNumber: 'DH-002',
            customerId: 'CUS-02',
            totalAmount: 800000,
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: '2026-03-19T00:00:00.000Z',
          },
        ],
      },
      isLoading: false,
    };
  },
}));

vi.mock('antd', () => ({
  Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/common/StandardListPage', () => ({
  default: ({
    title,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    columns,
    dataSource,
  }: {
    title: string;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    columns: Array<{
      key?: string;
      dataIndex?: string;
      render?: (value: unknown, record: Record<string, unknown>) => React.ReactNode;
    }>;
    dataSource: Array<Record<string, unknown>>;
  }) => (
    <div>
      <h1>{title}</h1>
      <input
        aria-label="search"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(event) => {
          setSearchValue(event.target.value);
          onSearchChange?.(event.target.value);
        }}
      />
      {dataSource.map((record) => (
        <div key={String(record.id)}>
          {columns.map((column, index) => (
            <div key={`${record.id}-${column.key ?? column.dataIndex ?? index}`}>
              {column.render
                ? column.render(
                    column.dataIndex ? record[column.dataIndex] : undefined,
                    record,
                  )
                : String(column.dataIndex ? record[column.dataIndex] ?? '' : '')}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

describe('EcommerceOrderList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosGetMock.mockResolvedValue({ data: { data: [] } });
  });

  it('renders localized order list shell and rows', async () => {
    render(<EcommerceOrderList />);

    await waitFor(() => {
      expect(axiosGetMock).toHaveBeenCalledWith('/api/orders');
    });

    expect(screen.getByText('orders.title')).toBeInTheDocument();
    expect(screen.getByText('DH-001')).toBeInTheDocument();
    expect(screen.getByText('confirmed')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  it('propagates search changes to the list shell', () => {
    render(<EcommerceOrderList />);

    fireEvent.change(screen.getByLabelText('search'), {
      target: { value: 'DH-002' },
    });

    expect(setSearchValue).toHaveBeenCalledWith('DH-002');
  });
});
