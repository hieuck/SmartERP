/**
 * Error Boundary Component
 * Catches unhandled errors in child components
 * Displays fallback UI and allows user to retry
 * Supports i18n and responsive design
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import React, { ReactNode } from 'react';
import { Result, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/hooks/useResponsive';
import { SPACING } from '@/constants/design-tokens';
import { getButtonSize } from '@/utils/responsive';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * HOC wrapper to provide hooks to class component
 */
function withHooks(Component: React.ComponentType<any>) {
  return function WrappedComponent(props: any) {
    const { t } = useTranslation('commonUi');
    const responsive = useResponsive();
    return <Component {...props} t={t} responsive={responsive} />;
  };
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps & { t: any; responsive: any },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { t: any; responsive: any }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Could send error to tracking service here
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { t, responsive } = this.props;
    const { isMobile } = responsive;

    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: isMobile ? SPACING.base : SPACING.xxl,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Result
            status="error"
            title={
              <span style={{ fontSize: isMobile ? 18 : 24 }}>
                {t('errorState.title')}
              </span>
            }
            subTitle={
              <div style={{ fontSize: isMobile ? 13 : 14 }}>
                <div>{t('errorState.subtitle')}</div>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div style={{ marginTop: SPACING.md, color: '#ff4d4f' }}>
                    <div style={{ fontWeight: 500, marginBottom: SPACING.xs }}>
                      {t('errorState.subtitleDev')}
                    </div>
                    <code
                      style={{
                        display: 'block',
                        padding: SPACING.sm,
                        background: '#f5f5f5',
                        borderRadius: 4,
                        fontSize: 12,
                        textAlign: 'left',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {this.state.error.message}
                    </code>
                  </div>
                )}
              </div>
            }
            extra={
              <Button
                type="primary"
                onClick={this.handleReset}
                size={getButtonSize(responsive)}
              >
                {t('actions.tryAgain')}
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withHooks(ErrorBoundaryClass);
ErrorBoundary.displayName = 'ErrorBoundary';
export default ErrorBoundary;
