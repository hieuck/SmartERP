const PUBLIC_ENTRY_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
]);
const SESSION_HINT_COOKIE_KEY = 'session_hint';
const SESSION_HINT_COOKIE = `${SESSION_HINT_COOKIE_KEY}=1`;
const SESSION_REFRESH_FAILURE_KEY = 'session_refresh_failed';

function getCookieParts() {
  return document.cookie.split('; ').filter(Boolean);
}

export function isPublicEntryPath(pathname: string) {
  return PUBLIC_ENTRY_PATHS.has(pathname);
}

export function hasSessionRefreshHint() {
  return getCookieParts().includes(SESSION_HINT_COOKIE);
}

export function clearSessionRefreshHint() {
  document.cookie = `${SESSION_HINT_COOKIE_KEY}=; Max-Age=0; path=/; SameSite=Lax`;
}

export function hasRecentSessionRefreshFailure() {
  return sessionStorage.getItem(SESSION_REFRESH_FAILURE_KEY) === '1';
}

export function markSessionRefreshFailure() {
  sessionStorage.setItem(SESSION_REFRESH_FAILURE_KEY, '1');
}

export function clearSessionRefreshFailure() {
  sessionStorage.removeItem(SESSION_REFRESH_FAILURE_KEY);
}

export function hasInjectedE2ESession() {
  return Boolean(sessionStorage.getItem('e2e_access_token') && sessionStorage.getItem('e2e_user'));
}

export function shouldAttemptSessionRefresh(
  pathname: string,
  hasHint = hasSessionRefreshHint(),
  hasInjectedSession = hasInjectedE2ESession(),
  hasRecentFailure = hasRecentSessionRefreshFailure(),
) {
  if (hasInjectedSession) {
    return true;
  }

  if (!hasHint) {
    return false;
  }

  if (hasRecentFailure) {
    return false;
  }

  return !isPublicEntryPath(pathname) || hasHint;
}
