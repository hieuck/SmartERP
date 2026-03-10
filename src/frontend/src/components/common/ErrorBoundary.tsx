import { ReactNode, useState, useCallback } from 'react';
import { Result, Button } from 'antd';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree
 * Displays a fallback UI instead of crashing the whole app
 *
 * Note: This is a functional component wrapper. For true error boundary functionality,
 * React Error Boundary library or class component is still required for catching render errors.
 * This component handles error state management and recovery UI.
 *
 * @example
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export const ErrorBoundary = ({ children }: ErrorBoundaryProps): ReactNode => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
  });

  const handleReset = useCallback(() => {
    setErrorState({ hasError: false, error: null });
    window.location.href = '/';
  }, []);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  const handleSetError = useCallback((error: Error) => {
    console.error('ErrorBoundary caught an error:', error);
    setErrorState({ hasError: true, error });
  }, []);

  if (errorState.hasError) {
    return (
      <div className={styles.container}>
        <Result
          status="error"
          title="Đã xảy ra lỗi"
          subTitle="Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."
          extra={[
            <Button type="primary" key="home" onClick={handleReset}>
              Về Trang Chủ
            </Button>,
            <Button key="reload" onClick={handleReload}>
              Tải Lại Trang
            </Button>,
          ]}
        >
          {process.env.NODE_ENV === 'development' && errorState.error && (
            <div className={styles.errorDetails}>
              <h4>Error Details (Development Only):</h4>
              <pre className={styles.errorStack}>{errorState.error.toString()}</pre>
            </div>
          )}
        </Result>
      </div>
    );
  }

  return children;
};

ErrorBoundary.displayName = 'ErrorBoundary';

export default ErrorBoundary;
