import { Page, Locator } from '@playwright/test';

/**
 * Wait Helper
 * Provides reusable wait functions for E2E tests
 */

/**
 * Wait for network to be idle
 * @param page - Playwright page object
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

/**
 * Wait for element to be visible
 * @param locator - Playwright locator
 * @param timeout - Timeout in milliseconds
 */
export async function waitForVisible(
  locator: Locator,
  timeout: number = 5000,
): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout });
}

/**
 * Wait for element to be hidden
 * @param locator - Playwright locator
 * @param timeout - Timeout in milliseconds
 */
export async function waitForHidden(
  locator: Locator,
  timeout: number = 5000,
): Promise<void> {
  await locator.waitFor({ state: 'hidden', timeout });
}

/**
 * Wait for success message
 * @param page - Playwright page object
 * @param message - Expected message text (optional)
 */
export async function waitForSuccessMessage(
  page: Page,
  message?: string,
): Promise<void> {
  const selector = message
    ? `text=/${message}/i`
    : 'text=/thành công|success/i';
  await page.locator(selector).waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Wait for error message
 * @param page - Playwright page object
 * @param message - Expected message text (optional)
 */
export async function waitForErrorMessage(
  page: Page,
  message?: string,
): Promise<void> {
  const selector = message
    ? `text=/${message}/i`
    : 'text=/lỗi|error|thất bại|failed/i';
  await page.locator(selector).waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Wait for loading spinner to disappear
 * @param page - Playwright page object
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  const spinner = page.locator('.ant-spin');
  if (await spinner.isVisible()) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

/**
 * Wait for modal to appear
 * @param page - Playwright page object
 */
export async function waitForModal(page: Page): Promise<void> {
  await page.locator('.ant-modal').waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Wait for modal to disappear
 * @param page - Playwright page object
 */
export async function waitForModalClose(page: Page): Promise<void> {
  await page.locator('.ant-modal').waitFor({ state: 'hidden', timeout: 5000 });
}

/**
 * Wait for table to load
 * @param page - Playwright page object
 */
export async function waitForTableLoad(page: Page): Promise<void> {
  await page.locator('table').waitFor({ state: 'visible', timeout: 5000 });
  await waitForLoadingComplete(page);
}
