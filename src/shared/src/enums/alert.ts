/**
 * Alert Enums
 * 
 * Alert levels for notifications and logging
 */

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertType {
  SYSTEM = 'system',
  SECURITY = 'security',
  BUSINESS = 'business',
  PERFORMANCE = 'performance',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
}
