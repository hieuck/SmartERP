/**
 * Staging Environment Configuration
 *
 * This configuration mirrors production but with relaxed security for testing.
 * Security: Medium security, detailed logging
 * Performance: Production-like performance
 */

import { ConfigType } from './development';

export const stagingConfig: ConfigType = {
  // Application
  app: {
    name: 'SmartERP',
    environment: 'staging',
    port: parseInt(process.env.PORT || '3000', 10),
    url: process.env.APP_URL || 'https://staging.smarterp.com',
    debug: false,
  },

  // Database
  database: {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'staging-db.smarterp.internal',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE || 'smart_erp_staging',
    synchronize: false, // Never auto-sync in staging/prod
    logging: ['error', 'warn', 'migration'],
    ssl: {
      rejectUnauthorized: true,
    },
    poolSize: 20,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'staging-redis.smarterp.internal',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD!,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: 600, // 10 minutes
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
    from: process.env.SMTP_FROM || 'staging@smarterp.com',
  },

  // File Storage (S3 or similar)
  storage: {
    type: 'cloud' as const,
    bucket: process.env.AWS_S3_BUCKET || 'smarterp-staging',
    region: process.env.AWS_REGION || 'ap-southeast-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: false,
    colorize: false,
  },

  // Security
  security: {
    bcryptRounds: 10,
    sessionSecret: process.env.SESSION_SECRET!,
    corsOrigin: process.env.CORS_ORIGIN || 'https://staging.smarterp.com',
    rateLimiting: {
      enabled: true,
      ttl: 60,
      max: 100,
    },
    csrf: {
      enabled: true,
    },
  },

  // Features
  features: {
    enable2FA: true,
    enableEmailVerification: true,
    enableAuditLog: true,
    enableMetrics: true,
  },

  // Monitoring
  monitoring: {
    enabled: true,
    sentryDsn: process.env.SENTRY_DSN,
  },

  // Payment Gateways (sandbox)
  payment: {
    vnpay: {
      url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      tmnCode: process.env.VNPAY_TMN_CODE!,
      hashSecret: process.env.VNPAY_HASH_SECRET!,
      returnUrl:
        process.env.VNPAY_RETURN_URL || 'https://staging.smarterp.com/payment/vnpay/return',
    },
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE!,
      accessKey: process.env.MOMO_ACCESS_KEY!,
      secretKey: process.env.MOMO_SECRET_KEY!,
      endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    },
  },

  // Shipping Providers (test)
  shipping: {
    ghn: {
      apiUrl: process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api',
      token: process.env.GHN_TOKEN!,
      shopId: process.env.GHN_SHOP_ID!,
    },
    ghtk: {
      apiUrl: process.env.GHTK_API_URL || 'https://services.giaohangtietkiem.vn/services',
      token: process.env.GHTK_TOKEN!,
    },
  },
};
