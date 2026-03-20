import { beforeEach, describe, expect, it, vi } from 'vitest';

const { warnMock, initializeMock } = vi.hoisted(() => ({
  warnMock: vi.fn(),
  initializeMock: vi.fn(),
}));

vi.mock('../logger/logger.service', () => ({
  logger: {
    warn: warnMock,
    info: vi.fn(),
  },
}));

vi.mock('react-ga4', () => ({
  default: {
    initialize: initializeMock,
    send: vi.fn(),
    event: vi.fn(),
    set: vi.fn(),
  },
}));

describe('initGA4', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('stays quiet in development when measurement id is missing', async () => {
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'development');
    vi.stubEnv('VITE_GA4_MEASUREMENT_ID', '');

    const { initGA4 } = await import('./analytics');
    initGA4();

    expect(warnMock).not.toHaveBeenCalled();
    expect(initializeMock).not.toHaveBeenCalled();
  });

  it('warns in production when measurement id is missing', async () => {
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'production');
    vi.stubEnv('VITE_GA4_MEASUREMENT_ID', '');

    const { initGA4 } = await import('./analytics');
    initGA4();

    expect(warnMock).toHaveBeenCalledWith('analytics', 'GA4 Measurement ID not provided. Analytics disabled.');
    expect(initializeMock).not.toHaveBeenCalled();
  });

  it('does not initialize ga4 in development even when configured', async () => {
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'development');
    vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST1234');

    const { initGA4 } = await import('./analytics');
    initGA4();

    expect(initializeMock).not.toHaveBeenCalled();
  });
});
