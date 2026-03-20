import { describe, expect, it } from '@jest/globals';
import { getTypeOrmLogging } from './database.config';

describe('getTypeOrmLogging', () => {
  it('disables query logging by default in development', () => {
    expect(getTypeOrmLogging('development', undefined)).toBe(false);
  });

  it('uses minimal structured logging in production by default', () => {
    expect(getTypeOrmLogging('production', undefined)).toEqual([
      'error',
      'warn',
      'schema',
      'migration',
    ]);
  });

  it('enables full query logging when explicitly requested', () => {
    expect(getTypeOrmLogging('development', 'true')).toEqual([
      'error',
      'warn',
      'schema',
      'migration',
      'query',
    ]);
  });

  it('supports minimal logging override', () => {
    expect(getTypeOrmLogging('development', 'minimal')).toEqual([
      'error',
      'warn',
      'schema',
      'migration',
    ]);
  });

  it('supports explicit logging disable override', () => {
    expect(getTypeOrmLogging('production', 'false')).toBe(false);
  });
});
