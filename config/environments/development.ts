/**
 * Development Environment Configuration
 *
 * This configuration is used for local development.
 * Security: Lower security requirements, verbose logging
 * Performance: Optimized for fast feedback
 */

export const developmentConfig = {
  // Application
  app: {
    name: 'SmartERP',
    environment: 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    url: process.env.APP_URL || 'http://localhost:3000',
    debug: true,
  },

  // Database
  database: {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'smart_erp_dev',
    synchronize: true, // Auto-sync schema (dev only!)
    logging: true, // Enable query logging
    ssl: false,
    poolSize: 10,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: 300, // 5 minutes default TTL
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Longer for dev convenience
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Email (use Mailtrap or similar for dev)
  email: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
    from: process.env.SMTP_FROM || 'dev@smarterp.local',
  },

  // File Storage (local for dev)
  storage: {
    type: 'local' as const,
    path: process.env.STORAGE_PATH || './uploads',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    prettyPrint: true,
    colorize: true,
  },

  // Security
  security: {
    bcryptRounds: 4, // Lower for faster dev
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
    corsOrigin: process.env.CORS_ORIGIN || '*', // Allow all in dev
    rateLimiting: {
      enabled: false, // Disabled for dev convenience
      ttl: 60,
      max: 1000,
    },
    csrf: {
      enabled: false, // Disabled for easier API testing
    },
  },

  // Features
  features: {
    enable2FA: false,
    enableEmailVerification: false,
    enableAuditLog: true,
    enableMetrics: true,
  },

  // Monitoring
  monitoring: {
    enabled: false, // No external monitoring in dev
    sentryDsn: undefined,
  },

  // Payment Gateways (use sandbox)
  payment: {
    vnpay: {
      url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      tmnCode: process.env.VNPAY_TMN_CODE || '',
      hashSecret: process.env.VNPAY_HASH_SECRET || '',
      returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay/return',
    },
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE || '',
      accessKey: process.env.MOMO_ACCESS_KEY || '',
      secretKey: process.env.MOMO_SECRET_KEY || '',
      endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    },
  },

  // Shipping Providers (use test credentials)
  shipping: {
    ghn: {
      apiUrl: process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api',
      token: process.env.GHN_TOKEN || '',
      shopId: process.env.GHN_SHOP_ID || '',
    },
    ghtk: {
      apiUrl: process.env.GHTK_API_URL || 'https://services.giaohangtietkiem.vn/services',
      token: process.env.GHTK_TOKEN || '',
    },
  },
};

export type ConfigType = typeof developmentConfig;
