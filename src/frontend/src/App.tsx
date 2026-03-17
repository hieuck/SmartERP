import { App as AntApp, ConfigProvider, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLocale } from './hooks/useLocale';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { AppRoutes } from './routes';
import { setCredentials } from './store/slices/authSlice';
import { authService } from './services/auth/authService';
import { logger } from './lib/logger/logger.service';

/**
 * App content component (wrapped by ThemeProvider)
 */
function AppContent() {
  const { antdLocale } = useLocale();
  const { theme } = useThemeContext();
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * Initialize auth state on mount
   * Attempts to restore session from refresh token (httpOnly cookie)
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to get current user from refresh token cookie
        const response = await authService.getMe();
        
        if (response.success && response.data) {
          // Session is valid - restore auth state
          dispatch(setCredentials({
            user: response.data.user,
            accessToken: response.data.token,
          }));
          logger.info('App', 'Session restored successfully');
        }
      } catch (error) {
        // No valid session - user needs to login
        logger.info('App', 'No valid session found');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  // Show loading spinner while checking session
  if (isInitializing) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  return (
    <ConfigProvider theme={theme} locale={antdLocale}>
      <AntApp>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

/**
 * Main App component
 * Provides global configuration and routing
 * Handles session restoration on mount
 */
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
