import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import LoginPage from '../../pages/auth/LoginPage';
import * as authService from '../../services/auth/authService';
import { store } from '../../store';

vi.mock('../../services/auth/authService');
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider locale={viVN}>
            <LoginPage />
          </ConfigProvider>
        </QueryClientProvider>
      </Provider>
    </BrowserRouter>,
  );
};

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;
    queryClient.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render login form with all required fields', () => {
      renderLoginPage();
      expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login button' })).toBeInTheDocument();
    });

    it('should render remember me checkbox', () => {
      renderLoginPage();
      expect(screen.getByText('Ghi nhớ đăng nhập')).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      renderLoginPage();
      expect(screen.getByText('Quên mật khẩu?')).toBeInTheDocument();
    });

    it('should render register link', () => {
      renderLoginPage();
      expect(screen.getByText('Đăng ký ngay')).toBeInTheDocument();
    });

    it('should render demo credentials', () => {
      renderLoginPage();
      expect(screen.getByText(/admin@test\.com/)).toBeInTheDocument();
      expect(screen.getByText(/admin123/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show email required error', async () => {
      const user = userEvent.setup({ delay: null });
      renderLoginPage();

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Login button' }));
      });

      await waitFor(
        () => {
          expect(screen.getByText('Vui lòng nhập email!')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should show password required error', async () => {
      const user = userEvent.setup({ delay: null });
      renderLoginPage();

      await act(async () => {
        await user.type(screen.getByLabelText('Email address'), 'test@example.com');
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Login button' }));
      });

      await waitFor(
        () => {
          expect(screen.getByText('Vui lòng nhập mật khẩu!')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should show invalid email error', async () => {
      const user = userEvent.setup({ delay: null });
      renderLoginPage();

      await act(async () => {
        await user.type(screen.getByLabelText('Email address'), 'invalid-email');
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Login button' }));
      });

      await waitFor(
        () => {
          expect(screen.getByText('Email không hợp lệ!')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should show password minimum length error', async () => {
      const user = userEvent.setup({ delay: null });
      renderLoginPage();

      await act(async () => {
        await user.type(screen.getByLabelText('Email address'), 'test@example.com');
      });

      await act(async () => {
        await user.type(screen.getByLabelText('Password'), '12345');
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Login button' }));
      });

      await waitFor(
        () => {
          expect(screen.getByText('Mật khẩu phải có ít nhất 6 ký tự')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Loading States', () => {
    it('should show loading state during login', async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(authService.authService.login).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  user: {
                    id: '1',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    tenantId: 'tenant-1',
                    role: 'user',
                  },
                  token: 'test-token',
                }),
              100,
            ),
          ),
      );

      renderLoginPage();

      await act(async () => {
        await user.type(screen.getByLabelText('Email address'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Login button' }));
      });

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: 'Login button' })).toHaveTextContent(
            'Đang xử lý',
          );
        },
        { timeout: 1000 },
      );
    });

    it('should disable form inputs during loading', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.authService.login).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  user: {
                    id: '1',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    tenantId: 'tenant-1',
                    role: 'user',
                  },
                  token: 'test-token',
                }),
              100,
            ),
          ),
      );

      renderLoginPage();

      await act(async () => {
        await user.type(screen.getByLabelText('Email address'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Login button' }));
      });

      await waitFor(
        () => {
          expect(screen.getByLabelText('Email address')).toBeDisabled();
          expect(screen.getByLabelText('Password')).toBeDisabled();
        },
        { timeout: 3000 },
      );
    });

    it('should disable submit button during loading', async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(authService.authService.login).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  user: {
                    id: '1',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    tenantId: 'tenant-1',
                    role: 'user',
                  },
                  token: 'test-token',
                }),
              100,
            ),
          ),
      );

      renderLoginPage();

      await act(async () => {
        await user.type(screen.getByLabelText('Email address'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Login button' }));
      });

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: 'Login button' })).toBeDisabled();
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should track failed login attempts', async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(authService.authService.login).mockRejectedValue({
        response: { status: 401 },
      });

      renderLoginPage();

      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await user.clear(screen.getByLabelText('Email address'));
          await user.clear(screen.getByLabelText('Password'));
          await user.type(screen.getByLabelText('Email address'), 'test@example.com');
          await user.type(screen.getByLabelText('Password'), 'wrongpassword');
          await user.click(screen.getByRole('button', { name: 'Login button' }));
        });

        await waitFor(
          () => {
            expect(screen.getByText('Email hoặc mật khẩu không chính xác')).toBeInTheDocument();
          },
          { timeout: 1000 },
        );
      }

      await waitFor(
        () => {
          expect(screen.getByText(/Quá nhiều lần thử/i)).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should show rate limit warning after max attempts', async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(authService.authService.login).mockRejectedValue({
        response: { status: 401 },
      });

      renderLoginPage();

      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await user.clear(screen.getByLabelText('Email address'));
          await user.clear(screen.getByLabelText('Password'));
          await user.type(screen.getByLabelText('Email address'), 'test@example.com');
          await user.type(screen.getByLabelText('Password'), 'wrongpassword');
          await user.click(screen.getByRole('button', { name: 'Login button' }));
        });

        await waitFor(
          () => {
            expect(authService.authService.login).toHaveBeenCalled();
          },
          { timeout: 1000 },
        );
      }

      await waitFor(
        () => {
          expect(screen.getByText(/Vui lòng thử lại sau/i)).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should disable form during rate limit', async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(authService.authService.login).mockRejectedValue({
        response: { status: 401 },
      });

      renderLoginPage();

      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await user.clear(screen.getByLabelText('Email address'));
          await user.clear(screen.getByLabelText('Password'));
          await user.type(screen.getByLabelText('Email address'), 'test@example.com');
          await user.type(screen.getByLabelText('Password'), 'wrongpassword');
          await user.click(screen.getByRole('button', { name: 'Login button' }));
        });

        await waitFor(
          () => {
            expect(authService.authService.login).toHaveBeenCalled();
          },
          { timeout: 1000 },
        );
      }

      await waitFor(
        () => {
          expect(screen.getByLabelText('Password')).toBeDisabled();
          expect(screen.getByRole('button', { name: 'Login button' })).toBeDisabled();
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Additional Features', () => {
    it('should save email when remember me is checked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(authService.authService.login).mockResolvedValueOnce({
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          tenantId: 'tenant-1',
          role: 'user',
        },
        token: 'test-token',
      });

      renderLoginPage();

      await act(async () => {
        // Find checkbox by its label text
        const checkboxLabel = screen.getByText('Ghi nhớ đăng nhập');
        const checkbox = checkboxLabel
          .closest('label')
          ?.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (checkbox) {
          await user.click(checkbox);
        }

        await user.type(screen.getByLabelText('Email address'), 'test@example.com');
        await user.type(screen.getByLabelText('Password'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Login button' }));
      });

      await waitFor(
        () => {
          expect(vi.mocked(global.localStorage.setItem)).toHaveBeenCalledWith(
            'rememberedEmail',
            'test@example.com',
          );
        },
        { timeout: 1000 },
      );
    });

    it('should load remembered email on mount', () => {
      vi.mocked(global.localStorage.getItem).mockReturnValueOnce('remembered@example.com');
      renderLoginPage();

      expect(vi.mocked(global.localStorage.getItem)).toHaveBeenCalledWith('rememberedEmail');
      expect(screen.getByLabelText('Email address')).toHaveValue('remembered@example.com');
    });

    it('should show password strength indicator', async () => {
      const user = userEvent.setup({ delay: null });
      renderLoginPage();

      const passwordInput = screen.getByLabelText('Password');

      await act(async () => {
        await user.type(passwordInput, 'StrongPass123!');
      });

      await waitFor(
        () => {
          expect(screen.getByText(/Độ mạnh:/i)).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should clear error message on new attempt', async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(authService.authService.login).mockRejectedValueOnce({
        response: { status: 401 },
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');

      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'wrongpassword');
        await user.click(screen.getByRole('button', { name: 'Login button' }));
      });

      await waitFor(
        () => {
          expect(screen.getByText('Email hoặc mật khẩu không chính xác')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      vi.mocked(authService.authService.login).mockResolvedValueOnce({
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          tenantId: 'tenant-1',
          role: 'user',
        },
        token: 'test-token',
      });

      const passwordInputAfterError = screen.getByLabelText('Password');

      await act(async () => {
        await user.clear(passwordInputAfterError);
        await user.type(passwordInputAfterError, 'correctpassword');
        await user.click(screen.getByRole('button', { name: 'Login button' }));
      });

      await waitFor(
        () => {
          expect(screen.queryByText('Email hoặc mật khẩu không chính xác')).not.toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should have proper accessibility labels', () => {
      renderLoginPage();
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: 'Login button' });

      expect(emailInput).toHaveAttribute('aria-label', 'Email address');
      expect(passwordInput).toHaveAttribute('aria-label', 'Password');
      expect(loginButton).toHaveAttribute('aria-label', 'Login button');
    });
  });
});
