import * as Sentry from '@sentry/node';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { initSentry } from './sentry.config';

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

describe('initSentry', () => {
  const envBackup = { ...process.env };
  let warnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    process.env = { ...envBackup };
    delete process.env.SENTRY_DSN;
    delete process.env.APP_VERSION;
    process.env.NODE_ENV = 'development';
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterAll(() => {
    process.env = envBackup;
  });

  it('does not warn in development when DSN is missing', () => {
    initSentry();

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns in production when DSN is missing', () => {
    process.env.NODE_ENV = 'production';

    initSentry();

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Sentry DSN not configured. Error tracking disabled.');
  });

  it('initializes sentry when DSN is configured', () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/123';
    process.env.APP_VERSION = '2.0.0';

    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://example@sentry.io/123',
        environment: 'development',
        release: 'smart-erp-backend@2.0.0',
      }),
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
