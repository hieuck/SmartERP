import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry for backend error tracking
 *
 * Environment variables required:
 * - SENTRY_DSN: Sentry DSN from sentry.io
 * - NODE_ENV: Environment name (development, staging, production)
 * - APP_VERSION: Application version for release tracking
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const release = process.env.APP_VERSION || '1.0.0';

  if (!dsn) {
    if (environment === 'production') {
      console.warn('Sentry DSN not configured. Error tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release: `smart-erp-backend@${release}`,

    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Filter out non-error events in development
    beforeSend(event) {
      if (environment === 'development' && event.level !== 'error') {
        return null;
      }

      return event;
    },

    ignoreErrors: [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'Redis connection',
      'ValidationError',
      'BadRequestException',
    ],
  });
}

export function setSentryUser(user: { id: string; email: string; tenantId: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    tenant_id: user.tenantId,
  });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
}
