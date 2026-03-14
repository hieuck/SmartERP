import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { HelmetProvider } from 'react-helmet-async';
import viVN from 'antd/locale/vi_VN';
import App from './App';
import { store } from './store';
import { register as registerServiceWorker } from './utils/serviceWorkerRegistration';
import { theme } from './theme';
import './i18n/config'; // Initialize i18n
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider locale={viVN} theme={theme}>
            <App />
          </ConfigProvider>
        </QueryClientProvider>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>,
);

// Register service worker for PWA support (Requirements: 22.10, 24.4)
if (import.meta.env.PROD) {
  registerServiceWorker();
}
