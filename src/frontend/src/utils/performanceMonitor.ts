/**
 * Performance Monitoring Utility
 * Monitors and reports performance metrics
 * Requirements: 22.10, 24.4
 */

import { logger } from '@/lib/logger/logger.service';

const context = 'PerformanceMonitor';

export interface PerformanceEntryWithStartTime extends PerformanceEntry {
  startTime: number;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}

class PerformanceMonitor {
  /**
   * Get page load performance metrics
   */
  getPageLoadMetrics(): PerformanceMetrics | null {
    if (!window.performance || !window.performance.timing) {
      return null;
    }

    const timing = window.performance.timing;

    return {
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      timeToInteractive: timing.domInteractive - timing.navigationStart,
      firstContentfulPaint: this.getFirstContentfulPaint(),
      largestContentfulPaint: this.getLargestContentfulPaint(),
    };
  }

  /**
   * Get First Contentful Paint (FCP)
   */
  private getFirstContentfulPaint(): number {
    const paintEntries = window.performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  /**
   * Get Largest Contentful Paint (LCP)
   */
  private getLargestContentfulPaint(): number {
    const lcpEntries = window.performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lastEntry = lcpEntries[lcpEntries.length - 1] as PerformanceEntryWithStartTime;
      return lastEntry.startTime;
    }
    return 0;
  }

  /**
   * Log performance metrics (development only)
   */
  logMetrics(): void {
    if (process.env.NODE_ENV !== 'production') {
      const metrics = this.getPageLoadMetrics();

      if (metrics) {
        logger.debug(context, 'Performance Metrics', {
          pageLoadTime: `${metrics.pageLoadTime}ms`,
          domContentLoaded: `${metrics.domContentLoaded}ms`,
          timeToInteractive: `${metrics.timeToInteractive}ms`,
          firstContentfulPaint: `${metrics.firstContentfulPaint}ms`,
          largestContentfulPaint: `${metrics.largestContentfulPaint}ms`,
        });

        // Check against requirements
        if (metrics.pageLoadTime > 3000) {
          logger.warn(context, 'Page load time exceeds 3 seconds (Requirement 22.10)', {
            pageLoadTime: metrics.pageLoadTime,
          });
        } else {
          logger.info(context, 'Page load time meets requirements', {
            pageLoadTime: metrics.pageLoadTime,
          });
        }
      }
    }
  }

  /**
   * Monitor resource loading
   */
  getResourceMetrics(): Array<{ name: string; duration: number; size: number }> {
    const resources = window.performance.getEntriesByType(
      'resource',
    ) as PerformanceResourceTiming[];

    return resources.map((resource) => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
    }));
  }

  /**
   * Get bundle size information
   */
  getBundleInfo(): { totalSize: number; jsSize: number; cssSize: number; imageSize: number } {
    const resources = this.getResourceMetrics();

    const jsSize = resources
      .filter((r) => r.name.endsWith('.js'))
      .reduce((sum, r) => sum + r.size, 0);

    const cssSize = resources
      .filter((r) => r.name.endsWith('.css'))
      .reduce((sum, r) => sum + r.size, 0);

    const imageSize = resources
      .filter((r) => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(r.name))
      .reduce((sum, r) => sum + r.size, 0);

    return {
      totalSize: jsSize + cssSize + imageSize,
      jsSize,
      cssSize,
      imageSize,
    };
  }

  /**
   * Check if performance meets requirements
   */
  checkRequirements(): { passed: boolean; issues: string[] } {
    const metrics = this.getPageLoadMetrics();
    const issues: string[] = [];

    if (!metrics) {
      return { passed: false, issues: ['Performance API not available'] };
    }

    // Requirement 22.10: Pages should load within 3 seconds
    if (metrics.pageLoadTime > 3000) {
      issues.push(`Page load time (${metrics.pageLoadTime}ms) exceeds 3 seconds`);
    }

    // Good practice: FCP should be under 1.8s
    if (metrics.firstContentfulPaint > 1800) {
      issues.push(`First Contentful Paint (${metrics.firstContentfulPaint}ms) is slow`);
    }

    // Good practice: LCP should be under 2.5s
    if (metrics.largestContentfulPaint > 2500) {
      issues.push(`Largest Contentful Paint (${metrics.largestContentfulPaint}ms) is slow`);
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }
}

export default new PerformanceMonitor();
