import { Page } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api';

/**
 * Login via API, inject credentials into sessionStorage BEFORE navigating.
 * App.tsx reads sessionStorage on init — bypasses the /auth/refresh cookie flow.
 */
export async function loginAndInjectToken(
  page: Page,
  email: string,
  password: string,
): Promise<string> {
  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();
  const payload = body.data || body;
  const accessToken: string = payload.token || payload.accessToken;
  const user = payload.user;

  if (!accessToken) {
    throw new Error(`No access token in login response: ${JSON.stringify(payload)}`);
  }

  // Inject into sessionStorage via addInitScript so it's available before App initializes
  await page.addInitScript(
    ({ token, userData }) => {
      sessionStorage.setItem('e2e_access_token', token);
      sessionStorage.setItem('e2e_user', JSON.stringify(userData));
    },
    { token: accessToken, userData: user },
  );

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  return accessToken;
}

/**
 * Login via UI form — use when testing the login flow itself.
 */
export async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#login_email, input[type="email"]').first().fill(email);
  await page.locator('#login_password, input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL('/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}
