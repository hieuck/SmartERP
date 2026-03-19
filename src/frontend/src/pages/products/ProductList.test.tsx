import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, message } from 'antd';
import { vi } from 'vitest';
import ProductList from './ProductList';
import { store } from '@/store';
import { SyncStatus } from '@/lib/offline/db';
import { offlineServices } from '@/services/offline-services';
import { syncManager } from '@/lib/offline/sync-manager';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({ isMobile: false }),
}));

vi.mock('@/services/offline-services', () => ({
  offlineServices: {
    products: {
      getAll: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/offline/sync-manager', () => ({
  syncManager: {
    getQueueSize: vi.fn(),
    isSyncing: vi.fn(),
    sync: vi.fn(),
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockGetAll = vi.mocked(offlineServices.products.getAll);
const mockGetQueueSize = vi.mocked(syncManager.getQueueSize);
const mockIsSyncing = vi.mocked(syncManager.isSyncing);

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ConfigProvider>{component}</ConfigProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

const baseProduct = {
  id: '1',
  tenantId: 'tenant-1',
  version: 1,
  syncStatus: SyncStatus.SYNCED,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'Product 1',
  sku: 'P001',
  price: 100,
  status: 'active',
};

describe('ProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockGetQueueSize.mockResolvedValue(0);
    mockIsSyncing.mockReturnValue(false);
    mockGetAll.mockResolvedValue([baseProduct]);
    localStorage.setItem('token', 'test-token');
  });

  it('renders the current page title and loaded products', async () => {
    renderWithProviders(<ProductList />);

    expect(screen.getByText('products:list.title')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  it('filters out soft-deleted products', async () => {
    mockGetAll.mockResolvedValue([
      baseProduct,
      {
        ...baseProduct,
        id: '2',
        name: 'Deleted product',
        sku: 'P002',
        deletedAt: new Date(),
      },
    ]);

    renderWithProviders(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
    expect(screen.queryByText('Deleted product')).not.toBeInTheDocument();
  });

  it('filters products by search term against offline data', async () => {
    mockGetAll.mockResolvedValue([
      baseProduct,
      {
        ...baseProduct,
        id: '2',
        name: 'Another Item',
        sku: 'P002',
      },
    ]);

    renderWithProviders(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Another Item')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('products:list.search'), {
      target: { value: 'another' },
    });

    await waitFor(() => {
      expect(screen.getByText('Another Item')).toBeInTheDocument();
    });
    expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
  });

  it('navigates to create product flow when create button is clicked', async () => {
    renderWithProviders(<ProductList />);

    fireEvent.click(screen.getByRole('button', { name: /products:form\.create/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/products/new');
  });

  it('navigates to category management from the extra action', async () => {
    renderWithProviders(<ProductList />);

    fireEvent.click(screen.getByRole('button', { name: 'products:categories.manage' }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/products/categories');
  });

  it('shows an error toast when offline storage loading fails', async () => {
    const messageErrorSpy = vi.spyOn(message, 'error').mockImplementation(() => {
      return undefined as never;
    });
    mockGetAll.mockRejectedValue(new Error('load failed'));

    renderWithProviders(<ProductList />);

    await waitFor(() => {
      expect(messageErrorSpy).toHaveBeenCalledWith('products:messages.loadError');
    });

    messageErrorSpy.mockRestore();
  });
});
