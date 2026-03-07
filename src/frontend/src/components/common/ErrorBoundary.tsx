import { Component, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree
 * Displays a fallback UI instead of crashing the whole app
 *
 * @example
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#f0f2f5',
          }}
        >
          <Result
            status="error"
            title="Đã xảy ra lỗi"
            subTitle="Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."
            extra={[
              <Button type="primary" key="home" onClick={this.handleReset}>
                Về Trang Chủ
              </Button>,
              <Button key="reload" onClick={() => window.location.reload()}>
                Tải Lại Trang
              </Button>,
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  background: '#fff',
                  borderRadius: 8,
                  textAlign: 'left',
                }}
              >
                <h4>Error Details (Development Only):</h4>
                <pre style={{ fontSize: 12, color: '#ff4d4f' }}>{this.state.error.toString()}</pre>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}
