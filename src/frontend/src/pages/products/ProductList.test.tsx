import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { ProductList } from './ProductList';
import { store } from '@/store';
import { vi } from 'vitest';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ConfigProvider>
            {component}
          </ConfigProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

describe('ProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product list page', () => {
    renderWithProviders(<ProductList />);
    
    expect(screen.getByText(/products/i)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithProviders(<ProductList />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays products when loaded', async () => {
    const mockProducts = [
      { id: '1', code: 'P001', name: 'Product 1', price: 100 },
      { id: '2', code: 'P002', name: 'Product 2', price: 200 },
    ];

    // Mock API response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockProducts }),
      })
    ) as any;

    renderWithProviders(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    renderWithProviders(<ProductList />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Product 1' } });

    await waitFor(() => {
      expect(searchInput).toHaveValue('Product 1');
    });
  });

  it('opens create modal when add button clicked', () => {
    renderWithProviders(<ProductList />);

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as any;

    renderWithProviders(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
