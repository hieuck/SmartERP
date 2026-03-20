import { App as AntApp, ConfigProvider, Spin } from 'antd';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import {
  clearSessionRefreshHint,
  hasSessionRefreshHint,
  isPublicEntryPath,
  shouldAttemptSessionRefresh,
} from './lib/auth/sessionRefresh';
import { tenantContext } from './lib/context/tenant-context.service';
import { useLocale } from './hooks/useLocale';
import { logger } from './lib/logger/logger.service';
import { AppRoutes } from './routes';
import { API_BASE_URL } from './services/api/baseUrl';
import { setCredentials } from './store/slices/authSlice';

let authInitializationPromise: Promise<void> | null = null;
let authInitializationCompleted = false;

async function initializeAuthState(dispatch: ReturnType<typeof useDispatch>): Promise<void> {
  if (authInitializationCompleted) {
    return;
  }

  if (authInitializationPromise) {
    return authInitializationPromise;
  }

  authInitializationPromise = (async () => {
    try {
      // E2E test injection: check sessionStorage for pre-injected credentials
      const e2eToken = sessionStorage.getItem('e2e_access_token');
      const e2eUser = sessionStorage.getItem('e2e_user');
      if (e2eToken && e2eUser) {
        dispatch(setCredentials({ user: JSON.parse(e2eUser), accessToken: e2eToken }));
        tenantContext.initialize(e2eToken);
        logger.info('App', 'E2E session restored');
        return;
      }

      if (!hasSessionRefreshHint()) {
        logger.info('App', 'Skipping session restore without session hint');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });

      const payload = response.data?.data || response.data;
      const { accessToken: newAccessToken, user } = payload;

      if (newAccessToken && user) {
        dispatch(setCredentials({ user, accessToken: newAccessToken }));
        tenantContext.initialize(newAccessToken);
        logger.info('App', 'Session restored successfully');
      } else {
        clearSessionRefreshHint();
        logger.info('App', 'Refresh succeeded without a usable session payload');
      }
    } catch {
      clearSessionRefreshHint();
      logger.info('App', 'No valid session found');
    } finally {
      authInitializationCompleted = true;
      authInitializationPromise = null;
    }
  })();

  return authInitializationPromise;
}

/**
 * App content component (wrapped by ThemeProvider)
 */
function AppContent() {
  const { antdLocale } = useLocale();
  const { theme } = useThemeContext();
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(() => !isPublicEntryPath(window.location.pathname));
  const isMountedRef = useRef(true);

  /**
   * Initialize auth state on mount.
   * Uses refresh token cookie directly via raw axios to avoid triggering
   * the axios interceptor redirect loop when no access token exists yet.
   */
  useEffect(() => {
    isMountedRef.current = true;
    const shouldBlockForAuthInit = !isPublicEntryPath(window.location.pathname);
    const shouldAttemptRefresh = shouldAttemptSessionRefresh(window.location.pathname);

    const runInitialization = async () => {
      await initializeAuthState(dispatch);
      if (isMountedRef.current) {
        setIsInitializing(false);
      }
    };

    if (shouldBlockForAuthInit && shouldAttemptRefresh) {
      void runInitialization();
    } else if (shouldAttemptRefresh) {
      setIsInitializing(false);
      void initializeAuthState(dispatch);
    } else {
      setIsInitializing(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [dispatch]);

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
        <Spin size="large" description="Loading..." />
      </div>
    );
  }

  return (
    <ConfigProvider theme={theme} locale={antdLocale}>
      <AntApp>
        <BrowserRouter
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
        >
          <AppRoutes />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
