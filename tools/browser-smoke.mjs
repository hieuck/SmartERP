import { chromium } from 'playwright';

const frontendUrl = process.env.SMARTERP_FRONTEND_URL ?? 'http://127.0.0.1:5173';
const backendApiUrl = process.env.SMARTERP_BACKEND_API_URL ?? 'http://127.0.0.1:3000/api';
const failOnWarnings = process.env.SMARTERP_FAIL_ON_WARNINGS === '1';

const publicRoutes = ['/login', '/register'];
const protectedRoutes = ['/dashboard', '/dashboard/users', '/dashboard/search?q=demo'];

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

  await page.goto(`${frontendUrl}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const bodyText = await page.locator('body').innerText();
  await page.close();

  return {
    route,
    warnings: unique(consoleWarnings),
    errors: unique(consoleErrors),
    failedRequests: unique(failedRequests),
    bodyPreview: bodyText.slice(0, 300),
  };
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
