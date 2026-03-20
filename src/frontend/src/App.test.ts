import { beforeEach, describe, expect, it } from 'vitest';
import { hasSessionRefreshHint, shouldAttemptSessionRefresh } from './App';

describe('App auth bootstrap guards', () => {
  beforeEach(() => {
    document.cookie = 'session_hint=; Max-Age=0; path=/';
  });

  it('detects session refresh hint cookie', () => {
    expect(hasSessionRefreshHint()).toBe(false);

    document.cookie = 'session_hint=1; path=/';

    expect(hasSessionRefreshHint()).toBe(true);
  });

  it('skips public entry refresh when no session hint exists', () => {
    expect(shouldAttemptSessionRefresh('/login', false)).toBe(false);
    expect(shouldAttemptSessionRefresh('/register', false)).toBe(false);
    expect(shouldAttemptSessionRefresh('/', false)).toBe(false);
  });

  it('allows protected entry refresh or hinted public refresh', () => {
    expect(shouldAttemptSessionRefresh('/dashboard', false)).toBe(true);
    expect(shouldAttemptSessionRefresh('/login', true)).toBe(true);
  });
});
