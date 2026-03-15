import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';

/**
 * Initialize Sentry for backend error tracking
 * 
 * Environment variables required:
 * - SENTRY_DSN: Sentry DSN from sentry.io
 * - SENTRY_ENVIRONMENT: Environment name (development, staging, production)
 * - APP_VERSION: Application version for release tracking
 */
export function initSentry(configService: ConfigService) {
  const dsn = configService.get<string>('SENTRY_DSN');
  const environment = configService.get<string>('NODE_ENV') || 'development';
  const release = configService.get<string>('APP_VERSION') || '1.0.0';

  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('Sentry DSN not provided. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release: `smart-erp-backend@${release}`,
    
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Filter out non-error events in production
    beforeSend(event, hint) {
      // Don't send events in development unless it's an error
      if (environment === 'development' && event.level !== 'error') {
        return null;
      }
      
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Database connection errors (handled by health checks)
      'ECONNREFUSED',
      'ETIMEDOUT',
      // Redis connection errors (handled by health checks)
      'Redis connection',
      // Expected validation errors
      'ValidationError',
      'BadRequestException',
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
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
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
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
}
