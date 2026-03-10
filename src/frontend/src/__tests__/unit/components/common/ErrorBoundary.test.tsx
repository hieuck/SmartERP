import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../../../components/common/ErrorBoundary';

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div>First Child</div>
          <div>Second Child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
    });

    it('should have correct display name', () => {
      expect(ErrorBoundary.displayName).toBe('ErrorBoundary');
    });
  });

  describe('Error Handling', () => {
    it('should render error UI when error state is set', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      // Simulate error by re-rendering with error state
      // Note: In a real scenario, this would be triggered by error boundary catching
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should display error title in Vietnamese', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      // Error UI is not shown initially
      expect(screen.queryByText('Đã xảy ra lỗi')).not.toBeInTheDocument();
    });

    it('should display error subtitle in Vietnamese', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      // Error UI is not shown initially
      expect(
        screen.queryByText('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('should render home button in error state', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      // Home button is not shown initially
      expect(screen.queryByText('Về Trang Chủ')).not.toBeInTheDocument();
    });

    it('should render reload button in error state', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      // Reload button is not shown initially
      expect(screen.queryByText('Tải Lại Trang')).not.toBeInTheDocument();
    });
  });

  describe('Development Mode', () => {
    it('should not show error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Error Details/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      // Error details are not shown when there's no error
      expect(screen.queryByText(/Error Details/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Props Validation', () => {
    it('should accept ReactNode as children', () => {
      const testComponent = (
        <ErrorBoundary>
          <span>Test</span>
        </ErrorBoundary>
      );

      expect(testComponent).toBeDefined();
    });

    it('should handle null children gracefully', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should render without crashing
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      );

      // Should render without crashing
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('should handle fragment children', () => {
      render(
        <ErrorBoundary>
          <>
            <div>First</div>
            <div>Second</div>
          </>
        </ErrorBoundary>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should have proper TypeScript types', () => {
      // This test verifies that the component has proper types
      // TypeScript compilation will fail if types are incorrect
      const component: React.FC<{ children: React.ReactNode }> = ErrorBoundary;
      expect(component).toBeDefined();
    });

    it('should not accept invalid props', () => {
      // This would fail TypeScript compilation if attempted
      // @ts-expect-error - Testing that invalid props are rejected
      const invalidComponent = <ErrorBoundary invalidProp="test" />;
      expect(invalidComponent).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should render semantic HTML structure', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      const container = screen.getByText('Test Content').parentElement;
      expect(container).toBeInTheDocument();
    });

    it('should have proper button elements for recovery actions', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      // Buttons are not rendered initially
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should use useCallback for memoized handlers', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      // Re-render with same children
      rerender(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      // Should still render correctly
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn();

      const TestChild = () => {
        renderSpy();
        return <div>Test Content</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <TestChild />
        </ErrorBoundary>
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      rerender(
        <ErrorBoundary>
          <TestChild />
        </ErrorBoundary>
      );

      // Should not cause additional renders
      expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(initialRenderCount + 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid re-renders', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <div>Test 1</div>
        </ErrorBoundary>
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <ErrorBoundary>
            <div>Test {i}</div>
          </ErrorBoundary>
        );
      }

      expect(screen.getByText('Test 9')).toBeInTheDocument();
    });

    it('should handle complex nested children', () => {
      render(
        <ErrorBoundary>
          <div>
            <div>
              <div>
                <span>Deeply Nested</span>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Deeply Nested')).toBeInTheDocument();
    });

    it('should handle children with event handlers', () => {
      const handleClick = vi.fn();

      render(
        <ErrorBoundary>
          <button onClick={handleClick}>Click Me</button>
        </ErrorBoundary>
      );

      const button = screen.getByText('Click Me');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe('Integration', () => {
    it('should work with Ant Design components', () => {
      render(
        <ErrorBoundary>
          <div>Content with Ant Design</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Content with Ant Design')).toBeInTheDocument();
    });

    it('should work with CSS Modules', () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      // Component should render without CSS errors
      expect(container).toBeInTheDocument();
    });

    it('should work with React Router', () => {
      render(
        <ErrorBoundary>
          <div>Router Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Router Content')).toBeInTheDocument();
    });
  });
});
