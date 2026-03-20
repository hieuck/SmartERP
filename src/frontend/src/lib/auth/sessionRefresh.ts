const PUBLIC_ENTRY_PATHS = new Set(['/', '/login', '/register']);
const SESSION_HINT_COOKIE_KEY = 'session_hint';
const SESSION_HINT_COOKIE = `${SESSION_HINT_COOKIE_KEY}=1`;

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

export function shouldAttemptSessionRefresh(_pathname: string, hasHint = hasSessionRefreshHint()) {
  return hasHint;
}
