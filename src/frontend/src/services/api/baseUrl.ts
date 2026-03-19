function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function resolveApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredBaseUrl) {
    return '/api';
  }

  if (!import.meta.env.DEV) {
    return configuredBaseUrl;
  }

  if (/^https?:\/\//i.test(configuredBaseUrl) && isLocalhost(window.location.hostname)) {
    return '/api';
  }

  return configuredBaseUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();
