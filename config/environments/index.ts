/**
 * Environment Configuration Loader
 *
 * Loads the appropriate configuration based on NODE_ENV.
 * Validates required environment variables before application starts.
 */

import { ConfigType, developmentConfig } from './development';
import { productionConfig } from './production';
import { stagingConfig } from './staging';
import { validateConfig } from './validator';

/**
 * Get configuration based on NODE_ENV
 */
export function getConfig(): ConfigType {
  const env = process.env.NODE_ENV || 'development';

  let config: ConfigType;

  switch (env) {
    case 'production':
      config = productionConfig;
      break;
    case 'staging':
      config = stagingConfig;
      break;
    case 'development':
    case 'test':
    default:
      config = developmentConfig;
      break;
  }

  // Validate configuration
  const validation = validateConfig(config, env);
  if (!validation.isValid) {
    console.error('❌ Configuration validation failed:');
    validation.errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
    throw new Error('Invalid configuration. Please check your environment variables.');
  }

  console.log(`✅ Configuration loaded for environment: ${env}`);
  return config;
}

/**
 * Export current configuration
 */
export const config = getConfig();

/**
 * Export types
 */
export type { ConfigType };
