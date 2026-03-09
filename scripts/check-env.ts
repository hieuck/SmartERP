#!/usr/bin/env ts-node
/**
 * Environment Variables Checker
 *
 * Checks if all required environment variables are set.
 * Usage: npm run config:check-env
 */

import * as fs from 'fs';
import * as path from 'path';

interface EnvCheck {
  variable: string;
  required: boolean;
  environments: string[];
  description: string;
}

const envChecks: EnvCheck[] = [
  // Application
  { variable: 'NODE_ENV', required: true, environments: ['all'], description: 'Environment name' },
  { variable: 'PORT', required: false, environments: ['all'], description: 'Server port' },
  {
    variable: 'APP_URL',
    required: true,
    environments: ['production', 'staging'],
    description: 'Public URL',
  },

  // Database
  { variable: 'DB_HOST', required: true, environments: ['all'], description: 'Database host' },
  { variable: 'DB_PORT', required: false, environments: ['all'], description: 'Database port' },
  {
    variable: 'DB_USERNAME',
    required: true,
    environments: ['all'],
    description: 'Database username',
  },
  {
    variable: 'DB_PASSWORD',
    required: true,
    environments: ['all'],
    description: 'Database password',
  },
  { variable: 'DB_DATABASE', required: true, environments: ['all'], description: 'Database name' },
  {
    variable: 'DB_POOL_SIZE',
    required: false,
    environments: ['production'],
    description: 'Connection pool size',
  },

  // Redis
  { variable: 'REDIS_HOST', required: true, environments: ['all'], description: 'Redis host' },
  { variable: 'REDIS_PORT', required: false, environments: ['all'], description: 'Redis port' },
  {
    variable: 'REDIS_PASSWORD',
    required: true,
    environments: ['production', 'staging'],
    description: 'Redis password',
  },
  {
    variable: 'REDIS_DB',
    required: false,
    environments: ['all'],
    description: 'Redis database number',
  },

  // JWT
  { variable: 'JWT_SECRET', required: true, environments: ['all'], description: 'JWT secret key' },
  {
    variable: 'JWT_EXPIRES_IN',
    required: false,
    environments: ['all'],
    description: 'JWT expiration time',
  },
  {
    variable: 'JWT_REFRESH_SECRET',
    required: true,
    environments: ['all'],
    description: 'JWT refresh secret',
  },
  {
    variable: 'JWT_REFRESH_EXPIRES_IN',
    required: false,
    environments: ['all'],
    description: 'Refresh token expiration',
  },

  // Session
  {
    variable: 'SESSION_SECRET',
    required: true,
    environments: ['all'],
    description: 'Session secret key',
  },

  // Email
  { variable: 'SMTP_HOST', required: true, environments: ['all'], description: 'SMTP host' },
  { variable: 'SMTP_PORT', required: false, environments: ['all'], description: 'SMTP port' },
  {
    variable: 'SMTP_USER',
    required: true,
    environments: ['production', 'staging'],
    description: 'SMTP username',
  },
  {
    variable: 'SMTP_PASSWORD',
    required: true,
    environments: ['production', 'staging'],
    description: 'SMTP password',
  },
  {
    variable: 'SMTP_FROM',
    required: true,
    environments: ['production', 'staging'],
    description: 'From email address',
  },

  // Storage
  {
    variable: 'AWS_S3_BUCKET',
    required: true,
    environments: ['production', 'staging'],
    description: 'S3 bucket name',
  },
  {
    variable: 'AWS_REGION',
    required: true,
    environments: ['production', 'staging'],
    description: 'AWS region',
  },
  {
    variable: 'AWS_ACCESS_KEY_ID',
    required: true,
    environments: ['production', 'staging'],
    description: 'AWS access key',
  },
  {
    variable: 'AWS_SECRET_ACCESS_KEY',
    required: true,
    environments: ['production', 'staging'],
    description: 'AWS secret key',
  },

  // Security
  {
    variable: 'CORS_ORIGIN',
    required: true,
    environments: ['production', 'staging'],
    description: 'CORS allowed origins',
  },

  // Monitoring
  {
    variable: 'SENTRY_DSN',
    required: true,
    environments: ['production'],
    description: 'Sentry DSN',
  },
];

function main() {
  console.log('🔍 Checking environment variables...\n');

  const environment = process.env.NODE_ENV || 'development';
  console.log(`Environment: ${environment}\n`);

  const missing: EnvCheck[] = [];
  const weak: { variable: string; reason: string }[] = [];
  const present: string[] = [];

  // Check each variable
  envChecks.forEach((check) => {
    const shouldCheck =
      check.environments.includes('all') || check.environments.includes(environment);

    if (!shouldCheck) {
      return;
    }

    const value = process.env[check.variable];

    if (!value) {
      if (check.required) {
        missing.push(check);
      }
    } else {
      present.push(check.variable);

      // Check for weak secrets in production
      if (environment === 'production') {
        if (check.variable.includes('SECRET') || check.variable.includes('PASSWORD')) {
          if (value.length < 20) {
            weak.push({
              variable: check.variable,
              reason: 'Should be at least 20 characters',
            });
          }
          if (value.includes('dev') || value.includes('test') || value.includes('change')) {
            weak.push({
              variable: check.variable,
              reason: 'Appears to be a default/test value',
            });
          }
        }
      }
    }
  });

  // Display results
  console.log(`✅ Found ${present.length} environment variables\n`);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:\n');
    missing.forEach((check) => {
      console.error(`  - ${check.variable}: ${check.description}`);
    });
    console.log('');
  }

  if (weak.length > 0) {
    console.warn('⚠️  Weak secrets detected:\n');
    weak.forEach((item) => {
      console.warn(`  - ${item.variable}: ${item.reason}`);
    });
    console.log('');
  }

  // Check .env file exists
  const envFile = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envFile)) {
    console.warn('⚠️  .env file not found\n');
    console.log('💡 Create .env file from template:');
    console.log(`   cp config/environments/.env.${environment}.template .env\n`);
  }

  // Summary
  if (missing.length === 0 && weak.length === 0) {
    console.log('✅ All environment variables are properly configured!\n');
    process.exit(0);
  } else {
    console.error('❌ Environment variable check failed\n');
    process.exit(1);
  }
}

main();
