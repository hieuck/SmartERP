import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSessionRefreshHint,
  hasInjectedE2ESession,
  hasSessionRefreshHint,
  shouldAttemptSessionRefresh,
} from './lib/auth/sessionRefresh';

describe('App auth bootstrap guards', () => {
  beforeEach(() => {
    document.cookie = 'session_hint=; Max-Age=0; path=/';
    sessionStorage.clear();
  });

  it('detects session refresh hint cookie', () => {
    expect(hasSessionRefreshHint()).toBe(false);

    document.cookie = 'session_hint=1; path=/';

    expect(hasSessionRefreshHint()).toBe(true);
  });

  it('clears stale session refresh hint cookies', () => {
    document.cookie = 'session_hint=1; path=/';

    clearSessionRefreshHint();

    expect(hasSessionRefreshHint()).toBe(false);
  });

  it('skips public entry refresh when no session hint exists', () => {
    expect(shouldAttemptSessionRefresh('/login', false)).toBe(false);
    expect(shouldAttemptSessionRefresh('/register', false)).toBe(false);
    expect(shouldAttemptSessionRefresh('/', false)).toBe(false);
    expect(shouldAttemptSessionRefresh('/dashboard', false)).toBe(false);
  });

  it('allows refresh only when a session hint exists', () => {
    expect(shouldAttemptSessionRefresh('/dashboard', true)).toBe(true);
    expect(shouldAttemptSessionRefresh('/login', true)).toBe(true);
  });

  it('restores E2E sessions without requiring a session hint cookie', () => {
    sessionStorage.setItem('e2e_access_token', 'demo-token');
    sessionStorage.setItem('e2e_user', JSON.stringify({ id: 'demo-user' }));

    expect(hasInjectedE2ESession()).toBe(true);
    expect(shouldAttemptSessionRefresh('/dashboard', false, true)).toBe(true);
  });
});
