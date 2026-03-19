import { App as AntApp, ConfigProvider, Spin } from 'antd';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { tenantContext } from './lib/context/tenant-context.service';
import { useLocale } from './hooks/useLocale';
import { logger } from './lib/logger/logger.service';
import { AppRoutes } from './routes';
import { setCredentials } from './store/slices/authSlice';

const PUBLIC_ENTRY_PATHS = new Set(['/', '/login', '/register']);

let authInitializationPromise: Promise<void> | null = null;
let authInitializationCompleted = false;

function isPublicEntryPath(pathname: string): boolean {
  return PUBLIC_ENTRY_PATHS.has(pathname);
}

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

      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await axios.post(`${apiUrl}/auth/refresh`, {}, { withCredentials: true });

      const payload = response.data?.data || response.data;
      const { accessToken: newAccessToken, user } = payload;

      if (newAccessToken && user) {
        dispatch(setCredentials({ user, accessToken: newAccessToken }));
        tenantContext.initialize(newAccessToken);
        logger.info('App', 'Session restored successfully');
      } else {
        logger.info('App', 'Refresh succeeded without a usable session payload');
      }
    } catch {
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

    const runInitialization = async () => {
      await initializeAuthState(dispatch);
      if (isMountedRef.current) {
        setIsInitializing(false);
      }
    };

    if (shouldBlockForAuthInit) {
      void runInitialization();
    } else {
      setIsInitializing(false);
      void initializeAuthState(dispatch);
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
