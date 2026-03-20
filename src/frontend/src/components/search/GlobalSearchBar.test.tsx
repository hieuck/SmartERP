import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GlobalSearchBar from './GlobalSearchBar';

const { globalSearchMock, navigateMock } = vi.hoisted(() => ({
  globalSearchMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('@/services/utils/searchService', () => ({
  default: {
    globalSearch: globalSearchMock,
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('lodash', () => ({
  debounce: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'search.placeholder': 'Search products, customers, orders...',
        'search.noResults': 'No results found',
        'fields.order': 'Order',
        'types.product': 'Product',
        'types.customer': 'Customer',
        'types.supplier': 'Supplier',
        'types.sales': 'Sales',
        'types.purchase': 'Purchase',
      };

      return translations[key] ?? key;
    },
  }),
}));

vi.mock('@ant-design/icons', () => ({
  SearchOutlined: () => <span>search-icon</span>,
}));

vi.mock('antd', () => {
  const Search = ({
    placeholder,
    onSearch,
  }: {
    placeholder?: string;
    onSearch?: (value: string) => void;
  }) => (
    <div>
      <input
        aria-label={placeholder ?? 'search'}
        placeholder={placeholder}
        onChange={(event) => onSearch?.(event.target.value)}
      />
      <button onClick={() => onSearch?.('manual lookup')}>submit-search</button>
    </div>
  );

  return {
    AutoComplete: ({
      children,
      options = [],
      onSelect,
      onSearch,
      value,
      notFoundContent,
    }: {
      children: React.ReactNode;
      options?: Array<{ value: string; label: React.ReactNode; type: string; id: string }>;
      onSelect?: (value: string, option: { value: string; label: React.ReactNode; type: string; id: string }) => void;
      onSearch?: (value: string) => void;
      value?: string;
      notFoundContent?: React.ReactNode;
    }) => (
      <div>
        <div data-testid="autocomplete-value">{value}</div>
        <div>{children}</div>
        <button onClick={() => onSearch?.('pr')}>type-query</button>
        <div>{options.map((option) => <button key={option.value} onClick={() => onSelect?.(option.value, option)}>{option.label}</button>)}</div>
        <div>{notFoundContent}</div>
      </div>
    ),
    Empty: ({ description }: { description?: React.ReactNode }) => <div>{description}</div>,
    Input: {
      Search,
    },
    Spin: () => <div>loading</div>,
    Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  };
});

describe('GlobalSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders translated search options and navigates on select', async () => {
    globalSearchMock.mockResolvedValue({
      hits: {
        total: { value: 1 },
        hits: [
          {
            _id: 'product-1',
            _index: 'products',
            _source: { name: 'Laptop', sku: 'LP-01' },
          },
        ],
      },
    });

    render(<GlobalSearchBar />);

    fireEvent.click(screen.getByRole('button', { name: 'type-query' }));

    await waitFor(() => expect(globalSearchMock).toHaveBeenCalledWith('pr', 0, 10));
    expect(screen.getByText('Product')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Laptop/ }));
    expect(navigateMock).toHaveBeenCalledWith('/products/product-1');
  });

  it('shows translated empty state and submits full search route', async () => {
    globalSearchMock.mockResolvedValue({
      hits: {
        total: { value: 0 },
        hits: [],
      },
    });

    render(<GlobalSearchBar />);

    expect(screen.getByPlaceholderText('Search products, customers, orders...')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'type-query' }));

    await waitFor(() => expect(globalSearchMock).toHaveBeenCalledWith('pr', 0, 10));
    expect(screen.getByText('No results found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'submit-search' }));
    expect(navigateMock).toHaveBeenCalledWith('/search?q=manual%20lookup');
  });
});
