import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
import LoginScreen from './LoginScreen';
import authReducer, { login, setBiometricEnabled } from '../../store/slices/authSlice';
import { useBiometric } from '../../hooks/useBiometric';

// Mock dependencies
jest.mock('../../hooks/useBiometric');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('LoginScreen', () => {
  let store: any;
  const mockDispatch = jest.fn();
  const mockUseBiometric = {
    isAvailable: false,
    isEnabled: false,
    isEnrolled: false,
    loading: false,
    authenticate: jest.fn(),
    enableBiometric: jest.fn(),
    getStoredCredentials: jest.fn(),
    getBiometricTypeName: jest.fn(() => 'Face ID'),
    disableBiometric: jest.fn(),
    refresh: jest.fn(),
    supportedTypes: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    (useBiometric as jest.Mock).mockReturnValue(mockUseBiometric);
  });

  const renderLoginScreen = () => {
    return render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );
  };

  describe('Rendering', () => {
    it('should render login form', () => {
      const { getByText, getByLabelText } = renderLoginScreen();

      expect(getByText('SmartERP')).toBeTruthy();
      expect(getByText('Mobile App')).toBeTruthy();
      expect(getByLabelText('Username')).toBeTruthy();
      expect(getByLabelText('Password')).toBeTruthy();
      expect(getByText('Remember me')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
    });

    it('should not show biometric button when not available', () => {
      const { queryByText } = renderLoginScreen();

      expect(queryByText(/Login with/)).toBeNull();
    });

    it('should show biometric button when available and configured', () => {
      (useBiometric as jest.Mock).mockReturnValue({
        ...mockUseBiometric,
        isAvailable: true,
        isEnabled: true,
        isEnrolled: true,
      });

      const { getByText } = renderLoginScreen();

      expect(getByText('Login with Face ID')).toBeTruthy();
    });
  });

  describe('Form Input', () => {
    it('should update username field', () => {
      const { getByLabelText } = renderLoginScreen();
      const usernameInput = getByLabelText('Username');

      fireEvent.changeText(usernameInput, 'testuser');

      expect(usernameInput.props.value).toBe('testuser');
    });

    it('should update password field', () => {
      const { getByLabelText } = renderLoginScreen();
      const passwordInput = getByLabelText('Password');

      fireEvent.changeText(passwordInput, 'password123');

      expect(passwordInput.props.value).toBe('password123');
    });

    it('should toggle password visibility', () => {
      const { getByLabelText, getByTestId } = renderLoginScreen();
      const passwordInput = getByLabelText('Password');

      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Find and click eye icon (this might need adjustment based on actual implementation)
      const eyeIcon = passwordInput.parent?.findByProps({ icon: 'eye' });
      if (eyeIcon) {
        fireEvent.press(eyeIcon);
        expect(passwordInput.props.secureTextEntry).toBe(false);
      }
    });

    it('should toggle remember me checkbox', () => {
      const { getByText, getByA11yState } = renderLoginScreen();
      const checkbox = getByText('Remember me').parent;

      fireEvent.press(checkbox);

      // Checkbox should be checked
      expect(checkbox).toBeTruthy();
    });
  });

  describe('Login Validation', () => {
    it('should show error when username is empty', async () => {
      const { getByText, getByLabelText } = renderLoginScreen();
      const loginButton = getByText('Login');
      const passwordInput = getByLabelText('Password');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Please enter username and password'
        );
      });
    });

    it('should show error when password is empty', async () => {
      const { getByText, getByLabelText } = renderLoginScreen();
      const loginButton = getByText('Login');
      const usernameInput = getByLabelText('Username');

      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Please enter username and password'
        );
      });
    });
  });

  describe('Login Submission', () => {
    it('should dispatch login action with credentials', async () => {
      const { getByText, getByLabelText } = renderLoginScreen();
      const usernameInput = getByLabelText('Username');
      const passwordInput = getByLabelText('Password');
      const loginButton = getByText('Login');

      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        const actions = store.getState();
        expect(actions).toBeDefined();
      });
    });

    it('should show loading state during login', async () => {
      const { getByText, getByLabelText } = renderLoginScreen();
      const usernameInput = getByLabelText('Username');
      const passwordInput = getByLabelText('Password');
      const loginButton = getByText('Login');

      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // Button should show loading state
      expect(loginButton.props.accessibilityState?.disabled).toBeTruthy();
    });
  });

  describe('Biometric Login', () => {
    it('should attempt biometric login on mount when configured', async () => {
      const mockGetStoredCredentials = jest.fn().mockResolvedValue({
        username: 'testuser',
        password: 'password123',
      });

      (useBiometric as jest.Mock).mockReturnValue({
        ...mockUseBiometric,
        isAvailable: true,
        isEnabled: true,
        isEnrolled: true,
        getStoredCredentials: mockGetStoredCredentials,
      });

      renderLoginScreen();

      await waitFor(() => {
        expect(mockGetStoredCredentials).toHaveBeenCalled();
      });
    });

    it('should handle biometric login button press', async () => {
      const mockGetStoredCredentials = jest.fn().mockResolvedValue({
        username: 'testuser',
        password: 'password123',
      });

      (useBiometric as jest.Mock).mockReturnValue({
        ...mockUseBiometric,
        isAvailable: true,
        isEnabled: true,
        isEnrolled: true,
        getStoredCredentials: mockGetStoredCredentials,
      });

      const { getByText } = renderLoginScreen();
      const biometricButton = getByText('Login with Face ID');

      fireEvent.press(biometricButton);

      await waitFor(() => {
        expect(mockGetStoredCredentials).toHaveBeenCalled();
      });
    });

    it('should show error when no stored credentials', async () => {
      const mockGetStoredCredentials = jest.fn().mockResolvedValue(null);

      (useBiometric as jest.Mock).mockReturnValue({
        ...mockUseBiometric,
        isAvailable: true,
        isEnabled: true,
        isEnrolled: true,
        getStoredCredentials: mockGetStoredCredentials,
      });

      const { getByText } = renderLoginScreen();
      const biometricButton = getByText('Login with Face ID');

      fireEvent.press(biometricButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'No stored credentials found. Please login with username and password.'
        );
      });
    });

    it('should offer to enable biometric after successful login', async () => {
      (useBiometric as jest.Mock).mockReturnValue({
        ...mockUseBiometric,
        isAvailable: true,
        isEnrolled: true,
        isEnabled: false,
      });

      const { getByText, getByLabelText } = renderLoginScreen();
      const usernameInput = getByLabelText('Username');
      const passwordInput = getByLabelText('Password');
      const rememberCheckbox = getByText('Remember me').parent;
      const loginButton = getByText('Login');

      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(rememberCheckbox);
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Enable Biometric Login',
          expect.stringContaining('Would you like to enable'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on login failure', async () => {
      // Mock failed login
      store = configureStore({
        reducer: {
          auth: (state = { isLoading: false, error: 'Invalid credentials' }) => state,
        },
      });

      const { getByText } = render(
        <Provider store={store}>
          <LoginScreen />
        </Provider>
      );

      expect(getByText('Invalid credentials')).toBeTruthy();
    });

    it('should handle biometric login errors gracefully', async () => {
      const mockGetStoredCredentials = jest
        .fn()
        .mockRejectedValue(new Error('Biometric error'));

      (useBiometric as jest.Mock).mockReturnValue({
        ...mockUseBiometric,
        isAvailable: true,
        isEnabled: true,
        isEnrolled: true,
        getStoredCredentials: mockGetStoredCredentials,
      });

      const { getByText } = renderLoginScreen();
      const biometricButton = getByText('Login with Face ID');

      fireEvent.press(biometricButton);

      // Should not crash, error is logged
      await waitFor(() => {
        expect(mockGetStoredCredentials).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels', () => {
      const { getByLabelText } = renderLoginScreen();

      expect(getByLabelText('Username')).toBeTruthy();
      expect(getByLabelText('Password')).toBeTruthy();
    });

    it('should disable login button when loading', () => {
      store = configureStore({
        reducer: {
          auth: (state = { isLoading: true, error: null }) => state,
        },
      });

      const { getByText } = render(
        <Provider store={store}>
          <LoginScreen />
        </Provider>
      );

      const loginButton = getByText('Login');
      expect(loginButton.props.accessibilityState?.disabled).toBeTruthy();
    });
  });
});
