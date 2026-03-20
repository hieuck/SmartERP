import * as Sentry from '@sentry/react';
import { logger } from '../logger/logger.service';

/**
 * Initialize Sentry for error tracking
 * 
 * Environment variables required:
 * - VITE_SENTRY_DSN: Sentry DSN from sentry.io
 * - VITE_SENTRY_ENVIRONMENT: Environment name (development, staging, production)
 * - VITE_APP_VERSION: Application version for release tracking
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
  const release = import.meta.env.VITE_APP_VERSION || '1.0.0';

  // Only initialize if DSN is provided
  if (!dsn) {
    if (environment === 'production') {
      logger.warn('sentry', 'Sentry DSN not provided. Error tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release: `smart-erp-frontend@${release}`,
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring - Sample rate
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Session Replay - Sample rate
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    
    // Filter out non-error events in production
    beforeSend(event, hint) {
      // Don't send events in development unless it's an error
      if (environment === 'development' && event.level !== 'error') {
        return null;
      }
      
      // Filter out network errors (handled by offline-first)
      const error = hint.originalException;
      if (error instanceof Error && error.message.includes('Network')) {
        return null;
      }
      
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // Network errors (handled by offline-first)
      'NetworkError',
      'Failed to fetch',
      'Network request failed',
      // Offline-first expected errors
      'IndexedDB',
      'QuotaExceededError',
    ],
  });
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: { id: string; email: string; tenantId: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    tenant_id: user.tenantId,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
}
