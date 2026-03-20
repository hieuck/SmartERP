import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductCatalogList from './ProductCatalogList';

const {
  axiosGetMock,
  axiosPatchMock,
  invalidateQueriesMock,
  messageSuccessMock,
  navigateMock,
  mutatePublishMock,
  mutateUnpublishMock,
} = vi.hoisted(() => ({
  axiosGetMock: vi.fn(),
  axiosPatchMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  navigateMock: vi.fn(),
  mutatePublishMock: vi.fn(),
  mutateUnpublishMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.total === 'number' ? `${key}:${options.total}` : key,
  }),
}));

vi.mock('axios', () => ({
  default: {
    get: axiosGetMock,
    patch: axiosPatchMock,
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: invalidateQueriesMock,
  }),
  useQuery: ({ queryFn }: { queryFn: () => Promise<unknown> }) => {
    void queryFn();
    return {
      data: {
        data: [
          {
            id: 'p-1',
            sku: 'SKU-001',
            name: 'Laptop Pro',
            price: 25000000,
            stockQuantity: 12,
            isPublished: true,
          },
          {
            id: 'p-2',
            sku: 'SKU-002',
            name: 'Camera Mini',
            price: 8000000,
            stockQuantity: 4,
            isPublished: false,
          },
        ],
      },
      isLoading: false,
    };
  },
  useMutation: ({ mutationFn, onSuccess }: { mutationFn: (id: string) => Promise<unknown>; onSuccess?: () => void }) => {
    const mutate = vi.fn(async (id: string) => {
      await mutationFn(id);
      onSuccess?.();
    });

    if (String(mutationFn).includes('/publish')) {
      mutatePublishMock.mockImplementation(mutate);
      return { mutate: mutatePublishMock };
    }

    mutateUnpublishMock.mockImplementation(mutate);
    return { mutate: mutateUnpublishMock };
  },
}));

vi.mock('antd', () => ({
  App: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    useApp: () => ({
      message: {
        success: messageSuccessMock,
      },
    }),
  }),
  Button: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/common/StandardListPage', () => ({
  default: ({
    title,
    createButtonText,
    onCreateClick,
    columns,
    dataSource,
  }: {
    title: string;
    createButtonText?: string;
    onCreateClick?: () => void;
    columns: Array<{
      key?: string;
      dataIndex?: string;
      render?: (value: unknown, record: Record<string, unknown>) => React.ReactNode;
    }>;
    dataSource: Array<Record<string, unknown>>;
  }) => (
    <div>
      <h1>{title}</h1>
      {createButtonText ? <button onClick={onCreateClick}>{createButtonText}</button> : null}
      {dataSource.map((record) => (
        <div key={String(record.id)}>
          {columns.map((column, index) => (
            <div key={`${record.id}-${column.key ?? column.dataIndex ?? index}`}>
              {column.render
                ? column.dataIndex
                  ? column.render(record[column.dataIndex], record)
                  : column.render(undefined, record)
                : String(column.dataIndex ? record[column.dataIndex] ?? '' : '')}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

describe('ProductCatalogList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosGetMock.mockResolvedValue({ data: { data: [] } });
    axiosPatchMock.mockResolvedValue({ data: { success: true } });
  });

  it('renders localized list shell and create action', async () => {
    render(<ProductCatalogList />);

    await waitFor(() => {
      expect(axiosGetMock).toHaveBeenCalledWith('/api/ecommerce/products', {
        params: { search: '' },
      });
    });

    expect(screen.getByText('catalog.title')).toBeInTheDocument();
    fireEvent.click(screen.getByText('catalog.createButton'));
    expect(navigateMock).toHaveBeenCalledWith('/dashboard/ecommerce/products/new');
  });

  it('publishes an unpublished product and shows success feedback', async () => {
    render(<ProductCatalogList />);

    fireEvent.click(screen.getByText('catalog.actions.publish'));

    await waitFor(() => {
      expect(axiosPatchMock).toHaveBeenCalledWith('/api/ecommerce/products/p-2/publish');
      expect(messageSuccessMock).toHaveBeenCalledWith('catalog.messages.publishSuccess');
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ['ecommerce-products'],
      });
    });
  });

  it('unpublishes a published product and shows success feedback', async () => {
    render(<ProductCatalogList />);

    fireEvent.click(screen.getByText('catalog.actions.unpublish'));

    await waitFor(() => {
      expect(axiosPatchMock).toHaveBeenCalledWith('/api/ecommerce/products/p-1/unpublish');
      expect(messageSuccessMock).toHaveBeenCalledWith('catalog.messages.unpublishSuccess');
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ['ecommerce-products'],
      });
    });
  });
});
