import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { CustomThrottlerGuard } from './throttler.guard';

class TestableThrottlerGuard extends CustomThrottlerGuard {
  public async exposeTracker(req: {
    user?: { id?: string };
    ip?: string;
    connection?: { remoteAddress?: string };
  }) {
    return this.getTracker(req);
  }

  public async exposeThrow(context: ExecutionContext) {
    return this.throwThrottlingException(context, {
      limit: 10,
      ttl: 60000,
      key: 'test-key',
      tracker: '127.0.0.1',
      totalHits: 11,
      timeToExpire: 60000,
      isBlocked: true,
      timeToBlockExpire: 60000,
    });
  }

  public async exposeShouldSkip(context: ExecutionContext) {
    return this.shouldSkip(context);
  }
}

describe('CustomThrottlerGuard', () => {
  let guard: TestableThrottlerGuard;

  beforeEach(() => {
    guard = new TestableThrottlerGuard({ throttlers: [{ ttl: 60000, limit: 10 }] } as never, {
      increment: jest.fn(),
    } as never, {
      getAllAndOverride: jest.fn(),
    } as never);
  });

  it('uses user id as tracker when authenticated', async () => {
    await expect(guard.exposeTracker({ user: { id: 'user-123' }, ip: '127.0.0.1' })).resolves.toBe(
      'user:user-123',
    );
  });

  it('falls back to ip address when user is anonymous', async () => {
    await expect(guard.exposeTracker({ ip: '127.0.0.1' })).resolves.toBe('127.0.0.1');
  });

  it('throws a 429 HttpException on rate limit exceed', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: '127.0.0.1' }),
      }),
    } as ExecutionContext;

    let error: HttpException | undefined;

    try {
      await guard.exposeThrow(context);
    } catch (caught) {
      error = caught as HttpException;
    }

    expect(error).toBeInstanceOf(HttpException);
    expect(error?.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(error?.message).toBe('Rate limit exceeded for 127.0.0.1. Please try again later.');
  });

  it('skips throttling refresh requests when no refresh token is present', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          originalUrl: '/api/auth/refresh',
          cookies: {},
          body: {},
        }),
      }),
    } as ExecutionContext;

    await expect(guard.exposeShouldSkip(context)).resolves.toBe(true);
  });
});
