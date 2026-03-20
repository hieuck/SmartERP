import ReactGA from 'react-ga4';
import { logger } from '../logger/logger.service';

/**
 * Initialize Google Analytics 4
 * 
 * Environment variables required:
 * - VITE_GA4_MEASUREMENT_ID: GA4 Measurement ID from Google Analytics
 */
export function initGA4() {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';

  // Only initialize if measurement ID is provided
  if (!measurementId) {
    if (environment === 'production') {
      logger.warn('analytics', 'GA4 Measurement ID not provided. Analytics disabled.');
    }
    return;
  }

  // Don't track in development
  if (environment === 'development') {
    return;
  }

  ReactGA.initialize(measurementId, {
    gaOptions: {
      siteSpeedSampleRate: 100,
    },
  });

  logger.info('analytics', 'GA4 initialized');
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || document.title,
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number,
) {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
}

/**
 * Track user login
 */
export function trackLogin(method: string) {
  ReactGA.event({
    category: 'User',
    action: 'Login',
    label: method,
  });
}

/**
 * Track user logout
 */
export function trackLogout() {
  ReactGA.event({
    category: 'User',
    action: 'Logout',
  });
}

/**
 * Track user registration
 */
export function trackRegistration(method: string) {
  ReactGA.event({
    category: 'User',
    action: 'Registration',
    label: method,
  });
}

/**
 * Track offline mode
 */
export function trackOfflineMode(isOffline: boolean) {
  ReactGA.event({
    category: 'Offline',
    action: isOffline ? 'Went Offline' : 'Went Online',
  });
}

/**
 * Track sync event
 */
export function trackSync(entity: string, count: number) {
  ReactGA.event({
    category: 'Sync',
    action: 'Sync Completed',
    label: entity,
    value: count,
  });
}

/**
 * Track CRUD operations
 */
export function trackCRUD(
  entity: string,
  operation: 'Create' | 'Read' | 'Update' | 'Delete',
) {
  ReactGA.event({
    category: 'CRUD',
    action: operation,
    label: entity,
  });
}

/**
 * Track search
 */
export function trackSearch(query: string, resultsCount: number) {
  ReactGA.event({
    category: 'Search',
    action: 'Search Query',
    label: query,
    value: resultsCount,
  });
}

/**
 * Track export
 */
export function trackExport(entity: string, format: string) {
  ReactGA.event({
    category: 'Export',
    action: 'Export Data',
    label: `${entity} - ${format}`,
  });
}

/**
 * Track import
 */
export function trackImport(entity: string, count: number) {
  ReactGA.event({
    category: 'Import',
    action: 'Import Data',
    label: entity,
    value: count,
  });
}

/**
 * Track error
 */
export function trackError(error: string, fatal: boolean = false) {
  ReactGA.event({
    category: 'Error',
    action: fatal ? 'Fatal Error' : 'Error',
    label: error,
  });
}

/**
 * Set user ID for tracking
 */
export function setUserId(userId: string) {
  ReactGA.set({ userId });
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>) {
  ReactGA.set(properties);
}
