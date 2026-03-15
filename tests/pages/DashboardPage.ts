import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage - Page Object Model for Dashboard
 * 
 * Handles:
 * - Dashboard navigation
 * - KPI cards verification
 * - Charts verification
 * - Quick actions
 */
export class DashboardPage extends BasePage {
  // Locators for KPI cards
  readonly revenueTodayCard: Locator;
  readonly revenueWeekCard: Locator;
  readonly totalOrdersCard: Locator;
  readonly totalCustomersCard: Locator;
  readonly totalProductsCard: Locator;
  readonly lowStockCard: Locator;
  readonly pendingPaymentsCard: Locator;
  readonly totalPaymentsCard: Locator;

  // Locators for charts
  readonly salesChart: Locator;
  readonly revenueByCategoryChart: Locator;
  readonly topProductsChart: Locator;
  readonly topCustomersTable: Locator;

  // Locators for navigation
  readonly welcomeMessage: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);
    
    // KPI cards - using Ant Design Statistic components
    this.revenueTodayCard = page.locator('.ant-statistic').filter({ hasText: 'Revenue Today' });
    this.revenueWeekCard = page.locator('.ant-statistic').filter({ hasText: 'Revenue This Week' });
    this.totalOrdersCard = page.locator('.ant-statistic').filter({ hasText: 'Total Orders' });
    this.totalCustomersCard = page.locator('.ant-statistic').filter({ hasText: 'Total Customers' });
    this.totalProductsCard = page.locator('.ant-statistic').filter({ hasText: 'Total Products' });
    this.lowStockCard = page.locator('.ant-statistic').filter({ hasText: 'Low Stock' });
    this.pendingPaymentsCard = page.locator('.ant-statistic').filter({ hasText: 'Pending Payments' });
    this.totalPaymentsCard = page.locator('.ant-statistic').filter({ hasText: 'Total Payments' });

    // Charts
    this.salesChart = page.locator('.recharts-wrapper').first();
    this.revenueByCategoryChart = page.locator('.recharts-pie');
    this.topProductsChart = page.locator('.recharts-bar-rectangle');
    this.topCustomersTable = page.locator('.ant-table').filter({ hasText: 'Top Customers' });

    // Navigation
    this.welcomeMessage = page.locator('.welcome');
    this.pageTitle = page.locator('h1');
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await super.goto('/dashboard');
  }

  /**
   * Wait for dashboard to load completely
   */
  async waitForDashboardLoad() {
    // Wait for API calls to complete
    await Promise.all([
      this.waitForApiResponse('/api/dashboard/overview'),
      this.waitForApiResponse('/api/dashboard/sales-chart'),
      this.waitForApiResponse('/api/dashboard/top-products'),
      this.waitForApiResponse('/api/dashboard/top-customers'),
      this.waitForApiResponse('/api/dashboard/revenue-by-category'),
    ]);
    
    // Wait for charts to render
    await this.salesChart.waitFor({ state: 'visible' });
  }

  /**
   * Get KPI value
   */
  async getKpiValue(cardLocator: Locator): Promise<string> {
    const valueElement = cardLocator.locator('.ant-statistic-content-value');
    return await this.getTextContent(valueElement);
  }

  /**
   * Check if all KPI cards are visible
   */
  async areAllKpiCardsVisible(): Promise<boolean> {
    const cards = [
      this.revenueTodayCard,
      this.revenueWeekCard,
      this.totalOrdersCard,
      this.totalCustomersCard,
      this.totalProductsCard,
      this.lowStockCard,
      this.pendingPaymentsCard,
      this.totalPaymentsCard,
    ];

    for (const card of cards) {
      if (!(await this.isVisible(card))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if charts are visible
   */
  async areChartsVisible(): Promise<boolean> {
    return (
      (await this.isVisible(this.salesChart)) &&
      (await this.isVisible(this.revenueByCategoryChart)) &&
      (await this.isVisible(this.topProductsChart)) &&
      (await this.isVisible(this.topCustomersTable))
    );
  }

  /**
   * Navigate to products page
   */
  async goToProducts() {
    await this.page.click('a[href="/dashboard/products"]');
    await this.waitForNavigation('/dashboard/products');
  }

  /**
   * Navigate to customers page
   */
  async goToCustomers() {
    await this.page.click('a[href="/dashboard/customers"]');
    await this.waitForNavigation('/dashboard/customers');
  }

  /**
   * Navigate to orders page
   */
  async goToOrders() {
    await this.page.click('a[href="/dashboard/orders/sales"]');
    await this.waitForNavigation('/dashboard/orders/sales');
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.getTextContent(this.pageTitle);
  }

  /**
   * Check if on dashboard page
   */
  async isOnDashboardPage(): Promise<boolean> {
    return this.page.url().includes('/dashboard');
  }
}
