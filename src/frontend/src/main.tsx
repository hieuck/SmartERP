import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { store } from './store';
import { registerServiceWorker } from './lib/offline/register-sw';
import { initSentry } from './lib/monitoring/sentry';
import { initGA4 } from './lib/monitoring/analytics';
import ErrorBoundary from './components/error/ErrorBoundary';
import './i18n/config'; // Initialize i18n
import './index.css';

// Initialize monitoring
initSentry();
initGA4();

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
    <ErrorBoundary>
      <HelmetProvider>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </Provider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

// Register service worker for PWA support
if (import.meta.env.PROD) {
  registerServiceWorker();
}
