import { beforeEach, describe, expect, it, vi } from 'vitest';

async function importBaseUrlModule() {
  vi.resetModules();
  return import('./baseUrl');
}

describe('resolveApiBaseUrl', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_API_URL', 'http://192.168.2.7:3000/api');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        hostname: 'localhost',
      },
    });
  });

  it('uses the local proxy when localhost dev points at an absolute LAN API url', async () => {
    const { API_BASE_URL, resolveApiBaseUrl } = await importBaseUrlModule();

    expect(resolveApiBaseUrl()).toBe('/api');
    expect(API_BASE_URL).toBe('/api');
  });

  it('preserves the configured absolute url for non-localhost dev access', async () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        hostname: '192.168.2.7',
      },
    });

    const { resolveApiBaseUrl } = await importBaseUrlModule();

    expect(resolveApiBaseUrl()).toBe('http://192.168.2.7:3000/api');
  });

  it('falls back to /api when no environment override is configured', async () => {
    vi.stubEnv('VITE_API_URL', '');

    const { resolveApiBaseUrl } = await importBaseUrlModule();

    expect(resolveApiBaseUrl()).toBe('/api');
  });
});
