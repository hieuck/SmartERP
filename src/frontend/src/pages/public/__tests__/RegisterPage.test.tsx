import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import RegisterPage from '../RegisterPage';

/**
 * Frontend Unit Tests for RegisterPage
 * Tests registration form rendering, validation, submission, and error handling
 * Follows AAA pattern (Arrange, Act, Assert)
 */
describe('RegisterPage', () => {
  const renderRegisterPage = () => {
    return render(
      <BrowserRouter>
        <ConfigProvider locale={viVN}>
          <RegisterPage />
        </ConfigProvider>
      </BrowserRouter>,
    );
  };

  describe('Form Rendering', () => {
    it('should render registration form with all required fields', () => {
      // Arrange & Act
      renderRegisterPage();

      // Assert
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subdomain/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      // Arrange & Act
      renderRegisterPage();

      // Assert
      expect(screen.getByRole('button', { name: /register|sign up|create account/i })).toBeInTheDocument();
    });

    it('should render login link', () => {
      // Arrange & Act
      renderRegisterPage();

      // Assert
      expect(screen.getByText(/already have an account|login|sign in/i)).toBeInTheDocument();
    });

    it('should render terms and conditions checkbox', () => {
      // Arrange & Act
      renderRegisterPage();

      // Assert
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText(/terms|conditions|agree/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty company name', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/company name.*required|please enter.*company/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty subdomain', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i);
      await user.type(companyInput, 'Test Company');
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/subdomain.*required|please enter.*subdomain/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid subdomain format', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const subdomainInput = screen.getByLabelText(/subdomain/i);
      await user.type(subdomainInput, 'Invalid Subdomain!');
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/subdomain.*format|only.*letters|alphanumeric/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty email', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i);
      const subdomainInput = screen.getByLabelText(/subdomain/i);
      await user.type(companyInput, 'Test Company');
      await user.type(subdomainInput, 'test-company');
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/email.*required|please enter.*email/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid.*email|email.*format/i)).toBeInTheDocument();
      });
    });

    it('should show error for weak password', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, '123');
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/password.*at least|minimum.*password|weak/i)).toBeInTheDocument();
      });
    });

    it('should show error for mismatched passwords', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmInput, 'DifferentPassword123!');
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/password.*match|confirm.*password|do not match/i)).toBeInTheDocument();
      });
    });

    it('should show error if terms not accepted', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i);
      const subdomainInput = screen.getByLabelText(/subdomain/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await user.type(companyInput, 'Test Company');
      await user.type(subdomainInput, 'test-company');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmInput, 'ValidPassword123!');

      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/terms|conditions|agree/i)).toBeInTheDocument();
      });
    });
  });

  describe('Successful Registration', () => {
    it('should submit form with valid data', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i);
      const subdomainInput = screen.getByLabelText(/subdomain/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const termsCheckbox = screen.getByRole('checkbox');

      await user.type(companyInput, 'Test Company');
      await user.type(subdomainInput, 'test-company');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmInput, 'ValidPassword123!');
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should disable submit button during loading', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i);
      const subdomainInput = screen.getByLabelText(/subdomain/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const termsCheckbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });

      await user.type(companyInput, 'Test Company');
      await user.type(subdomainInput, 'test-company');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmInput, 'ValidPassword123!');
      await user.click(termsCheckbox);
      await user.click(submitButton);

      // Assert
      expect(submitButton).toBeDisabled();
    });

    it('should show loading spinner during submission', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i);
      const subdomainInput = screen.getByLabelText(/subdomain/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const termsCheckbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });

      await user.type(companyInput, 'Test Company');
      await user.type(subdomainInput, 'test-company');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmInput, 'ValidPassword123!');
      await user.click(termsCheckbox);
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        const spinner = screen.queryByRole('img', { hidden: true });
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error for duplicate email', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i);
      const subdomainInput = screen.getByLabelText(/subdomain/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const termsCheckbox = screen.getByRole('checkbox');

      await user.type(companyInput, 'Test Company');
      await user.type(subdomainInput, 'test-company');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmInput, 'ValidPassword123!');
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/email.*already.*exists|email.*taken|already registered/i)).toBeInTheDocument();
      });
    });

    it('should display error for duplicate subdomain', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i);
      const subdomainInput = screen.getByLabelText(/subdomain/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const termsCheckbox = screen.getByRole('checkbox');

      await user.type(companyInput, 'Test Company');
      await user.type(subdomainInput, 'existing-subdomain');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmInput, 'ValidPassword123!');
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/subdomain.*already.*taken|subdomain.*exists|already in use/i)).toBeInTheDocument();
      });
    });

    it('should display network error message', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i);
      const subdomainInput = screen.getByLabelText(/subdomain/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const termsCheckbox = screen.getByRole('checkbox');

      await user.type(companyInput, 'Test Company');
      await user.type(subdomainInput, 'test-company');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmInput, 'ValidPassword123!');
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
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
      renderRegisterPage();

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid');
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
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
      renderRegisterPage();

      // Act
      const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
      const toggleButtons = screen.getAllByRole('button', { name: /show|hide|toggle.*password/i });

      // Assert - Initially hidden
      expect(passwordInput.type).toBe('password');

      // Act - Toggle visibility
      await user.click(toggleButtons[0]);

      // Assert - Now visible
      await waitFor(() => {
        expect(passwordInput.type).toBe('text');
      });
    });

    it('should populate form fields correctly', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i) as HTMLInputElement;
      const subdomainInput = screen.getByLabelText(/subdomain/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      await user.type(companyInput, 'Test Company');
      await user.type(subdomainInput, 'test-company');
      await user.type(emailInput, 'test@example.com');

      // Assert
      expect(companyInput.value).toBe('Test Company');
      expect(subdomainInput.value).toBe('test-company');
      expect(emailInput.value).toBe('test@example.com');
    });
  });

  describe('Navigation', () => {
    it('should navigate to login page when clicking login link', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const loginLink = screen.getByText(/already have an account|login|sign in/i);
      await user.click(loginLink);

      // Assert
      expect(window.location.pathname).toContain('/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form inputs', () => {
      // Arrange & Act
      renderRegisterPage();

      // Assert
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subdomain/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should have proper ARIA labels on buttons', () => {
      // Arrange & Act
      renderRegisterPage();

      // Assert
      const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i });
      expect(submitButton).toHaveAccessibleName();
    });

    it('should support keyboard navigation', async () => {
      // Arrange
      const user = userEvent.setup();
      renderRegisterPage();

      // Act
      const companyInput = screen.getByLabelText(/company name/i);
      await user.tab();

      // Assert
      expect(companyInput).toHaveFocus();
    });
  });
});
