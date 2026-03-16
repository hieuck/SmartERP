import { App as AntApp, ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { useLocale } from './hooks/useLocale';
import { AppRoutes } from './routes';
import { theme } from './theme';

/**
 * Main App component
 * Provides global configuration and routing
 */
function App() {
  const { antdLocale } = useLocale();

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

export default App;
