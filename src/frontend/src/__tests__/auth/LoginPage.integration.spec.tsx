import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { Provider } from 'react-redux';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import LoginPage from '../../pages/auth/LoginPage';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import * as authService from '../../services/auth/authService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

const renderLoginPage = (store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ConfigProvider locale={viVN}>
            <LoginPage />
          </ConfigProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

describe('LoginPage - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Successful Login Flow', () => {
    it('should complete full login flow with valid credentials', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
        },
        token: 'access-token-123',
        refreshToken: 'refresh-token-123',
      };

      jest.spyOn(authService, 'authService').mockImplementation(() => ({
        login: jest.fn().mockResolvedValue(mockLoginResponse),
      }));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /đăng nhập/i });

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'admin123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/đăng nhập thành công/i)).toBeInTheDocument();
      });
    });

    it('should store tokens in localStorage after successful login', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
        },
        token: 'access-token-123',
        refreshToken: 'refresh-token-123',
      };

      jest.spyOn(authService, 'authService').mockImplementation(() => ({
        login: jest.fn().mockResolvedValue(mockLoginResponse),
      }));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /đăng nhập/i });

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'admin123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(localStorage.getItem('authToken')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message for invalid credentials', async () => {
      const user = userEvent.setup();
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      };

      jest.spyOn(authService, 'authService').mockImplementation(() => ({
        login: jest.fn().mockRejectedValue(mockError),
      }));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /đăng nhập/i });

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/email hoặc mật khẩu không chính xác/i)).toBeInTheDocument();
      });
    });

    it('should display error for rate limiting (429)', async () => {
      const user = userEvent.setup();
      const mockError = {
        response: {
          status: 429,
          data: { message: 'Too many attempts' },
        },
      };

      jest.spyOn(authService, 'authService').mockImplementation(() => ({
        login: jest.fn().mockRejectedValue(mockError),
      }));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /đăng nhập/i });

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'admin123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/quá nhiều lần đăng nhập thất bại/i)).toBeInTheDocument();
      });
    });

    it('should display error for network failure', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Network Error');

      jest.spyOn(authService, 'authService').mockImplementation(() => ({
        login: jest.fn().mockRejectedValue(mockError),
      }));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /đăng nhập/i });

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'admin123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/lỗi kết nối/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty email', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const loginButton = screen.getByRole('button', { name: /đăng nhập/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/vui lòng nhập email/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      const loginButton = screen.getByRole('button', { name: /đăng nhập/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/email không hợp lệ/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for empty password', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'admin@test.com');

      const loginButton = screen.getByRole('button', { name: /đăng nhập/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/vui lòng nhập mật khẩu/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for short password', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, '12345');

      const loginButton = screen.getByRole('button', { name: /đăng nhập/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/mật khẩu phải có ít nhất 6 ký tự/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should disable inputs during login', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
        },
        token: 'access-token-123',
        refreshToken: 'refresh-token-123',
      };

      jest.spyOn(authService, 'authService').mockImplementation(() => ({
        login: jest.fn().mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(mockLoginResponse), 1000))
        ),
      }));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const loginButton = screen.getByRole('button', { name: /đăng nhập/i }) as HTMLButtonElement;

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'admin123');
      await user.click(loginButton);

      expect(emailInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
      expect(loginButton.disabled).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('should have link to register page', () => {
      renderLoginPage();

      const registerLink = screen.getByRole('link', { name: /đăng ký ngay/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should have link to forgot password page', () => {
      renderLoginPage();

      const forgotLink = screen.getByRole('link', { name: /quên mật khẩu/i });
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-label', 'Email address');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-label', 'Password');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /đăng nhập/i });

      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();
    });
  });
});
