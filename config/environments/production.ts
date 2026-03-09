/**
 * Production Environment Configuration
 *
 * This configuration is used for production deployment.
 * Security: Maximum security, minimal logging
 * Performance: Optimized for production workload
 */

import { ConfigType } from './development';

export const productionConfig: ConfigType = {
  // Application
  app: {
    name: 'SmartERP',
    environment: 'production',
    port: parseInt(process.env.PORT || '3000', 10),
    url: process.env.APP_URL!,
    debug: false,
  },

  // Database
  database: {
    type: 'postgres' as const,
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
    synchronize: false, // NEVER auto-sync in production
    logging: ['error'], // Only log errors
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.DB_SSL_CA,
    },
    poolSize: parseInt(process.env.DB_POOL_SIZE || '50', 10),
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD!,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: 3600, // 1 hour
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m', // Short-lived for security
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Email
  email: {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
    from: process.env.SMTP_FROM!,
  },

  // File Storage (S3 or similar)
  storage: {
    type: 'cloud' as const,
    bucket: process.env.AWS_S3_BUCKET!,
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'warn', // Minimal logging
    prettyPrint: false,
    colorize: false,
  },

  // Security
  security: {
    bcryptRounds: 12, // Higher for production
    sessionSecret: process.env.SESSION_SECRET!,
    corsOrigin: process.env.CORS_ORIGIN!,
    rateLimiting: {
      enabled: true,
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
    csrf: {
      enabled: true,
    },
  },

  // Features
  features: {
    enable2FA: process.env.ENABLE_2FA === 'true',
    enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    enableAuditLog: process.env.ENABLE_AUDIT_LOG !== 'false', // Default true
    enableMetrics: process.env.ENABLE_METRICS !== 'false', // Default true
  },

  // Monitoring
  monitoring: {
    enabled: true,
    sentryDsn: process.env.SENTRY_DSN!,
  },

  // Payment Gateways (production)
  payment: {
    vnpay: {
      url: process.env.VNPAY_URL!,
      tmnCode: process.env.VNPAY_TMN_CODE!,
      hashSecret: process.env.VNPAY_HASH_SECRET!,
      returnUrl: process.env.VNPAY_RETURN_URL!,
    },
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE!,
      accessKey: process.env.MOMO_ACCESS_KEY!,
      secretKey: process.env.MOMO_SECRET_KEY!,
      endpoint: process.env.MOMO_ENDPOINT!,
    },
  },

  // Shipping Providers (production)
  shipping: {
    ghn: {
      apiUrl: process.env.GHN_API_URL!,
      token: process.env.GHN_TOKEN!,
      shopId: process.env.GHN_SHOP_ID!,
    },
    ghtk: {
      apiUrl: process.env.GHTK_API_URL!,
      token: process.env.GHTK_TOKEN!,
    },
  },
};
