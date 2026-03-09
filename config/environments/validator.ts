/**
 * Configuration Validator
 *
 * Validates configuration before application starts.
 * Ensures all required fields are present and valid.
 */

import { ConfigType } from './development';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate configuration based on environment
 */
export function validateConfig(config: ConfigType, environment: string): ValidationResult {
  const errors: string[] = [];

  // Common validations for all environments
  validateCommon(config, errors);

  // Environment-specific validations
  if (environment === 'production') {
    validateProduction(config, errors);
  } else if (environment === 'staging') {
    validateStaging(config, errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Common validations for all environments
 */
function validateCommon(config: ConfigType, errors: string[]): void {
  // App
  if (!config.app.name) {
    errors.push('app.name is required');
  }
  if (!config.app.port || config.app.port < 1 || config.app.port > 65535) {
    errors.push('app.port must be between 1 and 65535');
  }

  // Database
  if (!config.database.host) {
    errors.push('database.host is required');
  }
  if (!config.database.username) {
    errors.push('database.username is required');
  }
  if (!config.database.password) {
    errors.push('database.password is required');
  }
  if (!config.database.database) {
    errors.push('database.database is required');
  }

  // Redis
  if (!config.redis.host) {
    errors.push('redis.host is required');
  }

  // JWT
  if (!config.jwt.secret) {
    errors.push('jwt.secret is required');
  }
  if (config.jwt.secret.length < 32) {
    errors.push('jwt.secret must be at least 32 characters long');
  }
  if (!config.jwt.refreshSecret) {
    errors.push('jwt.refreshSecret is required');
  }

  // Email
  if (!config.email.host) {
    errors.push('email.host is required');
  }
  if (!config.email.from) {
    errors.push('email.from is required');
  }

  // Security
  if (!config.security.sessionSecret) {
    errors.push('security.sessionSecret is required');
  }
  if (config.security.sessionSecret.length < 32) {
    errors.push('security.sessionSecret must be at least 32 characters long');
  }
}

/**
 * Production-specific validations
 */
function validateProduction(config: ConfigType, errors: string[]): void {
  // App
  if (!config.app.url || !config.app.url.startsWith('https://')) {
    errors.push('app.url must be a valid HTTPS URL in production');
  }

  // Database
  if (!config.database.ssl) {
    errors.push('database.ssl must be enabled in production');
  }
  if (config.database.synchronize) {
    errors.push('database.synchronize must be false in production');
  }

  // Redis
  if (!config.redis.password) {
    errors.push('redis.password is required in production');
  }

  // JWT
  if (config.jwt.secret === 'dev-secret-key-change-in-production') {
    errors.push('jwt.secret must be changed from default value in production');
  }
  if (config.jwt.refreshSecret === 'dev-refresh-secret') {
    errors.push('jwt.refreshSecret must be changed from default value in production');
  }

  // Security
  if (config.security.sessionSecret === 'dev-session-secret') {
    errors.push('security.sessionSecret must be changed from default value in production');
  }
  if (config.security.corsOrigin === '*') {
    errors.push('security.corsOrigin must not be "*" in production');
  }
  if (!config.security.rateLimiting.enabled) {
    errors.push('security.rateLimiting must be enabled in production');
  }
  if (!config.security.csrf.enabled) {
    errors.push('security.csrf must be enabled in production');
  }
  if (config.security.bcryptRounds < 10) {
    errors.push('security.bcryptRounds must be at least 10 in production');
  }

  // Storage
  if (config.storage.type === 'local') {
    errors.push('storage.type should be "cloud" in production for scalability');
  }

  // Monitoring
  if (!config.monitoring.enabled) {
    errors.push('monitoring.enabled should be true in production');
  }
  if (!config.monitoring.sentryDsn) {
    errors.push('monitoring.sentryDsn is required in production');
  }

  // Features
  if (!config.features.enable2FA) {
    errors.push('features.enable2FA should be enabled in production for security');
  }
  if (!config.features.enableEmailVerification) {
    errors.push('features.enableEmailVerification should be enabled in production');
  }

  // Payment Gateways
  if (config.payment.vnpay.url.includes('sandbox')) {
    errors.push('payment.vnpay.url should not use sandbox in production');
  }
  if (config.payment.momo.endpoint.includes('test')) {
    errors.push('payment.momo.endpoint should not use test endpoint in production');
  }

  // Shipping
  if (config.shipping.ghn.apiUrl.includes('dev')) {
    errors.push('shipping.ghn.apiUrl should not use dev endpoint in production');
  }
}

/**
 * Staging-specific validations
 */
function validateStaging(config: ConfigType, errors: string[]): void {
  // Database
  if (config.database.synchronize) {
    errors.push('database.synchronize must be false in staging');
  }

  // Security
  if (!config.security.rateLimiting.enabled) {
    errors.push('security.rateLimiting should be enabled in staging');
  }
  if (!config.security.csrf.enabled) {
    errors.push('security.csrf should be enabled in staging');
  }
}

/**
 * Validate environment variables are set
 */
export function validateEnvironmentVariables(environment: string): ValidationResult {
  const errors: string[] = [];

  if (environment === 'production') {
    const requiredVars = [
      'APP_URL',
      'DB_HOST',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_DATABASE',
      'REDIS_HOST',
      'REDIS_PASSWORD',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SESSION_SECRET',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASSWORD',
      'SMTP_FROM',
      'AWS_S3_BUCKET',
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'CORS_ORIGIN',
      'SENTRY_DSN',
    ];

    requiredVars.forEach((varName) => {
      if (!process.env[varName]) {
        errors.push(`Environment variable ${varName} is required in production`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
