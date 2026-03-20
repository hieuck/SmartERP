import { beforeEach, describe, expect, it, vi } from 'vitest';

const { warnMock, initMock } = vi.hoisted(() => ({
  warnMock: vi.fn(),
  initMock: vi.fn(),
}));

vi.mock('../logger/logger.service', () => ({
  logger: {
    warn: warnMock,
  },
}));

vi.mock('@sentry/react', () => ({
  init: initMock,
  browserTracingIntegration: vi.fn(() => 'browser-tracing'),
  replayIntegration: vi.fn(() => 'replay'),
  setUser: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe('initSentry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('stays quiet in development when dsn is missing', async () => {
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'development');
    vi.stubEnv('VITE_SENTRY_DSN', '');

    const { initSentry } = await import('./sentry');
    initSentry();

    expect(warnMock).not.toHaveBeenCalled();
    expect(initMock).not.toHaveBeenCalled();
  });

  it('warns in production when dsn is missing', async () => {
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'production');
    vi.stubEnv('VITE_SENTRY_DSN', '');

    const { initSentry } = await import('./sentry');
    initSentry();

    expect(warnMock).toHaveBeenCalledWith('sentry', 'Sentry DSN not provided. Error tracking disabled.');
    expect(initMock).not.toHaveBeenCalled();
  });
});
