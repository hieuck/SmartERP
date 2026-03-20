import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loggerMock } = vi.hoisted(() => ({
  loggerMock: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: loggerMock,
}));

import { register, unregister } from './serviceWorkerRegistration';

describe('serviceWorkerRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the service worker on window load and schedules updates', async () => {
    const updateMock = vi.fn();
    const registerMock = vi.fn().mockResolvedValue({
      scope: '/app/',
      update: updateMock,
      installing: null,
      onupdatefound: null,
    });
    const setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((() => 1) as unknown as typeof setInterval);

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerMock,
      },
    });

    register();
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();

    expect(registerMock).toHaveBeenCalledWith(expect.stringMatching(/sw\.js$/));
    expect(loggerMock.info).toHaveBeenCalledWith(
      'ServiceWorkerRegistration',
      'Service Worker registered',
      { registration: '/app/' },
    );
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

    setIntervalSpy.mockRestore();
  });

  it('unregisters the active service worker when ready resolves', async () => {
    const unregisterMock = vi.fn();

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          unregister: unregisterMock,
        }),
      },
    });

    unregister();
    await Promise.resolve();

    expect(unregisterMock).toHaveBeenCalled();
  });

  it('logs registration and unregistration failures', async () => {
    const registrationError = new Error('register failed');
    const unregisterError = new Error('unregister failed');
    const registerMock = vi.fn().mockRejectedValue(registrationError);

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerMock,
        ready: Promise.reject(unregisterError),
      },
    });

    register();
    window.dispatchEvent(new Event('load'));
    unregister();
    await Promise.resolve();
    await Promise.resolve();

    expect(loggerMock.error).toHaveBeenCalledWith(
      'ServiceWorkerRegistration',
      'Service Worker registration failed',
      registrationError,
    );
    expect(loggerMock.error).toHaveBeenCalledWith(
      'ServiceWorkerRegistration',
      'Service Worker unregistration failed',
      unregisterError,
    );
  });
});
