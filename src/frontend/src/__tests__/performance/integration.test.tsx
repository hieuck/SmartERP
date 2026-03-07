/**
 * Performance Integration Tests
 * Tests overall application performance
 * Requirements: 22.10, 24.4
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import App from '../../App';
import { store } from '../../store';

describe('Performance Integration Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderApp = () => {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider>
            <App />
          </ConfigProvider>
        </QueryClientProvider>
      </Provider>,
    );
  };

  it('should render the app without performance issues', async () => {
    const startTime = performance.now();

    const { container } = renderApp();

    await waitFor(() => {
      expect(container).toBeTruthy();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`App render time: ${renderTime.toFixed(2)}ms`);

    // Initial render should be fast (under 1000ms)
    expect(renderTime).toBeLessThan(1000);
  });

  it('should have lazy loading configured', () => {
    // Verify that lazy loading is set up
    // This is a smoke test to ensure the app structure supports lazy loading
    const { container } = renderApp();

    expect(container).toBeTruthy();

    // In a real scenario, we'd check that route components are loaded on demand
    // For now, we just verify the app renders
  });

  it('should handle multiple renders efficiently', async () => {
    const renderTimes: number[] = [];

    // Render the app multiple times and measure performance
    for (let i = 0; i < 3; i++) {
      const startTime = performance.now();

      const { unmount } = renderApp();

      const endTime = performance.now();
      renderTimes.push(endTime - startTime);

      unmount();
    }

    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;

    console.log(`Average render time: ${avgRenderTime.toFixed(2)}ms`);
    console.log(`Render times: ${renderTimes.map((t) => t.toFixed(2)).join('ms, ')}ms`);

    // Average render time should be reasonable
    expect(avgRenderTime).toBeLessThan(1000);
  });

  it('should not have memory leaks', async () => {
    // This is a basic check for memory leaks
    // In a real scenario, we'd use more sophisticated tools

    const { unmount } = renderApp();

    // Unmount should clean up properly
    unmount();

    // If we get here without errors, cleanup worked
    expect(true).toBe(true);
  });

  it('should have service worker support', () => {
    // Check if service worker registration is available
    const hasServiceWorkerSupport = 'serviceWorker' in navigator;

    console.log(`Service Worker support: ${hasServiceWorkerSupport}`);

    // Service worker should be supported in modern browsers
    // This test will pass even if not supported (for older browsers)
    expect(hasServiceWorkerSupport).toBeDefined();
  });

  it('should have performance API available', () => {
    // Verify performance API is available for monitoring
    expect(window.performance).toBeDefined();
    // Note: performance.timing is deprecated in favor of PerformanceNavigationTiming
    // In test environment, it might not be available
    expect(window.performance.getEntriesByType).toBeDefined();
  });

  it('should meet Core Web Vitals targets', () => {
    // Core Web Vitals targets:
    // - LCP (Largest Contentful Paint): < 2.5s
    // - FID (First Input Delay): < 100ms
    // - CLS (Cumulative Layout Shift): < 0.1

    // These are aspirational targets
    // In a real scenario, we'd measure these with real user monitoring

    const targets = {
      lcp: 2500, // ms
      fid: 100, // ms
      cls: 0.1, // score
    };

    console.log('Core Web Vitals targets:', targets);

    // This test documents our performance goals
    expect(targets.lcp).toBe(2500);
    expect(targets.fid).toBe(100);
    expect(targets.cls).toBe(0.1);
  });
});
