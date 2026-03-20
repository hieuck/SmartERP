import { chromium } from 'playwright';

const frontendUrl = process.env.SMARTERP_FRONTEND_URL ?? 'http://127.0.0.1:5173';
const backendApiUrl = process.env.SMARTERP_BACKEND_API_URL ?? 'http://127.0.0.1:3000/api';
const failOnWarnings = process.env.SMARTERP_FAIL_ON_WARNINGS === '1';
const routeNavigationTimeoutMs = Number(process.env.SMARTERP_ROUTE_TIMEOUT_MS ?? '15000');
const routeIdleTimeoutMs = Number(process.env.SMARTERP_ROUTE_IDLE_TIMEOUT_MS ?? '5000');

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password?token=smoke-test-token',
  '/terms',
  '/privacy',
];
const protectedRoutes = [
  '/dashboard',
  '/dashboard/users',
  '/dashboard/search?q=demo',
  '/dashboard/notifications',
  '/dashboard/notifications/center',
  '/dashboard/notifications/preferences',
  '/dashboard/audit',
  '/dashboard/accounting/accounts',
  '/dashboard/accounting/accounts/new',
  '/dashboard/accounting/journal-entries',
  '/dashboard/settings',
  '/dashboard/settings/system',
  '/dashboard/settings/print',
  '/dashboard/production/work-centers',
  '/dashboard/production/work-orders',
  '/dashboard/ecommerce/products',
  '/dashboard/ecommerce/products/new',
];

function unique(items) {
  return [...new Set(items)];
}

async function loginDemoUser() {
  const response = await fetch(`${backendApiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SMARTERP_DEMO_EMAIL ?? 'admin@demo.com',
      password: process.env.SMARTERP_DEMO_PASSWORD ?? 'admin123',
    }),
  });

  if (!response.ok) {
    throw new Error(`Demo login failed with status ${response.status}`);
  }

  const payload = await response.json();
  const data = payload?.data ?? payload;
  const token = data?.token ?? data?.accessToken;
  const user = data?.user;

  if (!token || !user) {
    throw new Error('Demo login succeeded without a usable token/user payload');
  }

  return { token, user };
}

async function collectRoute(browser, route, session) {
  const page = await browser.newPage();
  const consoleWarnings = [];
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'warning') {
      consoleWarnings.push(message.text());
    }

    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  if (session) {
    await page.addInitScript((sessionData) => {
      sessionStorage.setItem('e2e_access_token', sessionData.token);
      sessionStorage.setItem('e2e_user', JSON.stringify(sessionData.user));
    }, session);
  }

  let bodyPreview = '';

  try {
    await page.goto(`${frontendUrl}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: routeNavigationTimeoutMs,
    });
    await page.waitForLoadState('networkidle', { timeout: routeIdleTimeoutMs }).catch(() => {});
    await page.waitForTimeout(500);

    bodyPreview = (await page.locator('body').innerText()).slice(0, 300);

    return {
      route,
      warnings: unique(consoleWarnings),
      errors: unique(consoleErrors),
      failedRequests: unique(failedRequests),
      bodyPreview,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const routeErrors = unique([...consoleErrors, `Route check failed: ${message}`]);
    try {
      bodyPreview = (await page.locator('body').innerText()).slice(0, 300);
    } catch {
      bodyPreview = '';
    }

    return {
      route,
      warnings: unique(consoleWarnings),
      errors: routeErrors,
      failedRequests: unique(failedRequests),
      bodyPreview,
    };
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    const session = await loginDemoUser();
    const pages = [
      ...publicRoutes.map((route) => collectRoute(browser, route)),
      ...protectedRoutes.map((route) => collectRoute(browser, route, session)),
    ];

    const routes = await Promise.all(pages);

    const summary = {
      checkedAt: new Date().toISOString(),
      frontendUrl,
      backendApiUrl,
      routeNavigationTimeoutMs,
      routeIdleTimeoutMs,
      routes,
    };

    console.log(JSON.stringify(summary, null, 2));

    const hasErrors = routes.some(
      (route) => route.errors.length > 0 || route.failedRequests.length > 0,
    );
    const hasWarnings = routes.some((route) => route.warnings.length > 0);

    if (hasErrors || (failOnWarnings && hasWarnings)) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
