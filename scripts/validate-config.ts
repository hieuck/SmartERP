#!/usr/bin/env ts-node
/**
 * Configuration Validation Script
 *
 * Validates environment configuration before deployment.
 * Usage: npm run config:validate
 */

import { getConfig } from '../config/environments';
import { validateEnvironmentVariables } from '../config/environments/validator';

function main() {
  console.log('🔍 Validating configuration...\n');

  const environment = process.env.NODE_ENV || 'development';
  console.log(`Environment: ${environment}\n`);

  try {
    // Validate environment variables
    console.log('📋 Checking environment variables...');
    const envValidation = validateEnvironmentVariables(environment);

    if (!envValidation.isValid) {
      console.error('❌ Environment variable validation failed:\n');
      envValidation.errors.forEach((error) => {
        console.error(`  - ${error}`);
      });
      process.exit(1);
    }
    console.log('✅ Environment variables OK\n');

    // Load and validate configuration
    console.log('📋 Loading configuration...');
    const config = getConfig();
    console.log('✅ Configuration loaded successfully\n');

    // Display configuration summary
    console.log('📊 Configuration Summary:');
    console.log(`  App: ${config.app.name} (${config.app.environment})`);
    console.log(`  Port: ${config.app.port}`);
    console.log(`  URL: ${config.app.url}`);
    console.log(
      `  Database: ${config.database.type}://${config.database.host}:${config.database.port}/${config.database.database}`,
    );
    console.log(`  Redis: ${config.redis.host}:${config.redis.port}`);
    console.log(`  Storage: ${config.storage.type}`);
    console.log(`  Monitoring: ${config.monitoring.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`  2FA: ${config.features.enable2FA ? 'Enabled' : 'Disabled'}`);
    console.log(
      `  Rate Limiting: ${config.security.rateLimiting.enabled ? 'Enabled' : 'Disabled'}`,
    );
    console.log(`  CSRF: ${config.security.csrf.enabled ? 'Enabled' : 'Disabled'}\n`);

    // Security checks
    console.log('🔒 Security Checks:');

    if (environment === 'production') {
      const securityIssues: string[] = [];

      if (config.jwt.secret.length < 48) {
        securityIssues.push('JWT secret should be at least 48 characters in production');
      }
      if (config.security.sessionSecret.length < 48) {
        securityIssues.push('Session secret should be at least 48 characters in production');
      }
      if (config.security.corsOrigin === '*') {
        securityIssues.push('CORS origin should not be "*" in production');
      }
      if (!config.security.rateLimiting.enabled) {
        securityIssues.push('Rate limiting should be enabled in production');
      }
      if (!config.security.csrf.enabled) {
        securityIssues.push('CSRF protection should be enabled in production');
      }
      if (!config.features.enable2FA) {
        securityIssues.push('2FA should be enabled in production');
      }
      if (!config.monitoring.enabled) {
        securityIssues.push('Monitoring should be enabled in production');
      }

      if (securityIssues.length > 0) {
        console.error('⚠️  Security warnings:\n');
        securityIssues.forEach((issue) => {
          console.error(`  - ${issue}`);
        });
        console.log('');
      } else {
        console.log('✅ All security checks passed\n');
      }
    } else {
      console.log('ℹ️  Security checks skipped (not production)\n');
    }

    console.log('✅ Configuration validation complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Configuration validation failed:\n');
    console.error(error instanceof Error ? error.message : String(error));
    console.log('');
    process.exit(1);
  }
}

main();
