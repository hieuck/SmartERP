import { beforeEach, describe, expect, it, vi } from 'vitest';
import performanceMonitor from './performanceMonitor';

const { loggerMock } = vi.hoisted(() => ({
  loggerMock: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: loggerMock,
}));

describe('performanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'performance', {
      configurable: true,
      value: {
        timing: {
          navigationStart: 100,
          loadEventEnd: 2100,
          domContentLoadedEventEnd: 900,
          domInteractive: 700,
        },
        getEntriesByType: vi.fn((type: string) => {
          if (type === 'paint') {
            return [{ name: 'first-contentful-paint', startTime: 450 }];
          }

          if (type === 'largest-contentful-paint') {
            return [{ startTime: 1200 }];
          }

          if (type === 'resource') {
            return [
              { name: '/assets/app.js', duration: 40, transferSize: 1500 },
              { name: '/assets/app.css', duration: 10, transferSize: 500 },
              { name: '/assets/logo.png', duration: 12, transferSize: 250 },
            ];
          }

          return [];
        }),
      },
    });
  });

  it('returns page load metrics from the Performance API', () => {
    expect(performanceMonitor.getPageLoadMetrics()).toEqual({
      pageLoadTime: 2000,
      domContentLoaded: 800,
      timeToInteractive: 600,
      firstContentfulPaint: 450,
      largestContentfulPaint: 1200,
    });
  });

  it('aggregates bundle size information by resource type', () => {
    expect(performanceMonitor.getBundleInfo()).toEqual({
      totalSize: 2250,
      jsSize: 1500,
      cssSize: 500,
      imageSize: 250,
    });
  });

  it('logs healthy performance metrics in non-production mode', () => {
    process.env.NODE_ENV = 'test';

    performanceMonitor.logMetrics();

    expect(loggerMock.debug).toHaveBeenCalledWith(
      'PerformanceMonitor',
      'Performance Metrics',
      expect.objectContaining({
        pageLoadTime: '2000ms',
        firstContentfulPaint: '450ms',
      }),
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      'PerformanceMonitor',
      'Page load time meets requirements',
      { pageLoadTime: 2000 },
    );
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('reports requirement violations when metrics exceed thresholds', () => {
    Object.defineProperty(window, 'performance', {
      configurable: true,
      value: {
        timing: {
          navigationStart: 100,
          loadEventEnd: 4200,
          domContentLoadedEventEnd: 900,
          domInteractive: 700,
        },
        getEntriesByType: vi.fn((type: string) => {
          if (type === 'paint') {
            return [{ name: 'first-contentful-paint', startTime: 2100 }];
          }

          if (type === 'largest-contentful-paint') {
            return [{ startTime: 2600 }];
          }

          return [];
        }),
      },
    });

    expect(performanceMonitor.checkRequirements()).toEqual({
      passed: false,
      issues: [
        'Page load time (4100ms) exceeds 3 seconds',
        'First Contentful Paint (2100ms) is slow',
        'Largest Contentful Paint (2600ms) is slow',
      ],
    });
  });
});
