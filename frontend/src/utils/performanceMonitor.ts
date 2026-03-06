/**
 * Performance Monitoring Utility
 * Monitors and reports performance metrics
 * Requirements: 22.10, 24.4
 */

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
    const navigation = window.performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming;

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
      const lastEntry = lcpEntries[lcpEntries.length - 1] as any;
      return lastEntry.startTime;
    }
    return 0;
  }

  /**
   * Log performance metrics to console
   */
  logMetrics(): void {
    const metrics = this.getPageLoadMetrics();

    if (metrics) {
      console.group('Performance Metrics');
      console.log(`Page Load Time: ${metrics.pageLoadTime}ms`);
      console.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      console.log(`Time to Interactive: ${metrics.timeToInteractive}ms`);
      console.log(`First Contentful Paint: ${metrics.firstContentfulPaint}ms`);
      console.log(`Largest Contentful Paint: ${metrics.largestContentfulPaint}ms`);
      console.groupEnd();

      // Check against requirements
      if (metrics.pageLoadTime > 3000) {
        console.warn('⚠️ Page load time exceeds 3 seconds (Requirement 22.10)');
      } else {
        console.log('✅ Page load time meets requirements');
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
