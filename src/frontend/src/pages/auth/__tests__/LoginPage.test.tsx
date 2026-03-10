import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import LoginPage from '../LoginPage';

/**
 * Frontend Unit Tests for LoginPage
 * Tests form rendering, validation, submission, and error handling
 * Follows AAA pattern (Arrange, Act, Assert)
 */
describe('LoginPage', () => {
  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <ConfigProvider locale={viVN}>
          <LoginPage />
        </ConfigProvider>
      </BrowserRouter>,
    );
  };

  describe('Form Rendering', () => {
    it('should render login form with email and password fields', () => {
      // Arrange & Act
      renderLoginPage();

      // Assert
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      // Arrange & Act
      renderLoginPage();

      // Assert
      expect(screen.getByRole('button', { name: /login|sign in/i })).toBeInTheDocument();
    });

    it('should render register link', () => {
      // Arrange & Act
      renderLoginPage();

      // Assert
      expect(screen.getByText(/don't have an account|register|sign up/i)).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      // Arrange & Act
      renderLoginPage();

      // Assert
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/email.*required|please enter.*email/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid.*email|email.*format/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty password', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/password.*required|please enter.*password/i)).toBeInTheDocument();
      });
    });

    it('should show error for short password', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/password.*at least|minimum.*password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Successful Login', () => {
    it('should submit form with valid credentials', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should disable submit button during loading', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.click(submitButton);

      // Assert
      expect(submitButton).toBeDisabled();
    });

    it('should show loading spinner during submission', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        const spinner = screen.queryByRole('img', { hidden: true });
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message for invalid credentials', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123!');
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid.*credentials|incorrect|failed/i)).toBeInTheDocument();
      });
    });

    it('should display error message for user not found', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(emailInput, 'nonexistent@example.com');
      await user.type(passwordInput, 'Password123!');
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/user.*not found|no account|not registered/i)).toBeInTheDocument();
      });
    });

    it('should display network error message', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/network|connection|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Input Interactions', () => {
    it('should clear error message when user starts typing', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid');
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      await user.click(submitButton);

      // Assert - Error shown
      await waitFor(() => {
        expect(screen.getByText(/invalid.*email|email.*format/i)).toBeInTheDocument();
      });

      // Act - Clear and type valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      // Assert - Error cleared
      await waitFor(() => {
        expect(screen.queryByText(/invalid.*email|email.*format/i)).not.toBeInTheDocument();
      });
    });

    it('should allow user to toggle password visibility', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: /show|hide|toggle.*password/i });

      // Assert - Initially hidden
      expect(passwordInput.type).toBe('password');

      // Act - Toggle visibility
      await user.click(toggleButton);

      // Assert - Now visible
      await waitFor(() => {
        expect(passwordInput.type).toBe('text');
      });
    });

    it('should populate form fields correctly', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPassword123!');

      // Assert
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('TestPassword123!');
    });
  });

  describe('Navigation', () => {
    it('should navigate to register page when clicking register link', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const registerLink = screen.getByText(/don't have an account|register|sign up/i);
      await user.click(registerLink);

      // Assert
      expect(window.location.pathname).toContain('/register');
    });

    it('should navigate to forgot password page when clicking forgot password link', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const forgotLink = screen.getByText(/forgot password/i);
      await user.click(forgotLink);

      // Assert
      expect(window.location.pathname).toContain('/forgot-password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form inputs', () => {
      // Arrange & Act
      renderLoginPage();

      // Assert
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have proper ARIA labels on buttons', () => {
      // Arrange & Act
      renderLoginPage();

      // Assert
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      expect(submitButton).toHaveAccessibleName();
    });

    it('should support keyboard navigation', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.tab();

      // Assert
      expect(emailInput).toHaveFocus();
    });
  });
});
