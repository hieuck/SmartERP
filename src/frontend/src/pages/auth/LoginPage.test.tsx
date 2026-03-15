import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import LoginPage from './LoginPage';
import { authService } from '@/services/auth/authService';
import authReducer from '@/store/slices/authSlice';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('@/services/auth/authService');
vi.mock('@/hooks/useRateLimit', () => ({
  useRateLimit: () => ({
    isLimited: false,
    remainingTime: 0,
    recordAttempt: vi.fn(),
  }),
}));
vi.mock('@/components/common/LanguageSwitcher', () => ({
  __esModule: true,
  default: () => <div>Language Switcher</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: initialState,
  });
};

const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{component}</BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    renderWithProviders(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email.*required/i)).toBeInTheDocument();
      expect(screen.getByText(/password.*required/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email', async () => {
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email.*invalid/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '12345' } });

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password.*6/i)).toBeInTheDocument();
    });
  });

  it('should login successfully', async () => {
    const mockLoginResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 'tenant-1',
        role: 'user',
      },
      token: 'test-token',
      refreshToken: 'refresh-token',
    };

    (authService.login as any).mockResolvedValue(mockLoginResponse);

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('should show error message on login failure', async () => {
    const mockError = {
      response: {
        status: 401,
        data: {
          message: 'Invalid credentials',
        },
      },
    };

    (authService.login as any).mockRejectedValue(mockError);

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should sanitize email input', async () => {
    const mockLoginResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 'tenant-1',
        role: 'user',
      },
      token: 'test-token',
    };

    (authService.login as any).mockResolvedValue(mockLoginResponse);

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: '  TEST@EXAMPLE.COM  ' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should remember email when checkbox is checked', async () => {
    const mockLoginResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 'tenant-1',
        role: 'user',
      },
      token: 'test-token',
    };

    (authService.login as any).mockResolvedValue(mockLoginResponse);

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberCheckbox = screen.getByRole('checkbox', { name: /remember/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(rememberCheckbox);

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('rememberedEmail')).toBe('test@example.com');
    });
  });

  it('should load remembered email on mount', () => {
    localStorage.setItem('rememberedEmail', 'remembered@example.com');

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('remembered@example.com');
  });

  it('should disable form during login', async () => {
    (authService.login as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  it('should redirect to dashboard if already authenticated', () => {
    const store = createTestStore({
      auth: {
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'token',
      },
    });

    renderWithProviders(<LoginPage />, store);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('should show demo credentials', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText(/admin@test.com/i)).toBeInTheDocument();
    expect(screen.getByText(/admin123/i)).toBeInTheDocument();
  });
});
