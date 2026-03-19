import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage - Page Object Model for Login page
 *
 * Handles:
 * - User login with email and password
 * - Form validation
 * - Error messages
 * - Remember me functionality
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);

    // Ant Design Form uses id prefix from form name — fallback to input type
    this.emailInput = page.locator('#login_email, input[type="email"]').first();
    this.passwordInput = page.locator('#login_password, input[type="password"]').first();
    this.submitButton = page.locator('button[type="submit"]').first();
    this.errorMessage = page
      .locator('.ant-alert-error, .ant-message-error, [role="alert"]')
      .first();

    // Fallback to other selectors if data-testid not available
    this.rememberMeCheckbox = page.locator('input[type="checkbox"]').first();
    this.forgotPasswordLink = page.locator('a:has-text("Forgot Password")');
    this.signUpLink = page.locator('a:has-text("Sign Up")');
    this.pageTitle = page.locator('h2');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await super.goto('/login');
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string, rememberMe = false) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    } else if (await this.rememberMeCheckbox.isChecked()) {
      await this.rememberMeCheckbox.uncheck();
    }

    await this.clickButton(this.submitButton);

    // Wait for either success (redirect to dashboard) or error message
    await Promise.race([
      this.page.waitForURL('/dashboard', { timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 }),
    ]);
  }

  /**
   * Login and wait for API response
   */
  async loginWithApiWait(email: string, password: string) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);

    // Wait for login API call
    const responsePromise = this.waitForApiResponse('/api/auth/login');
    await this.clickButton(this.submitButton);

    const response = await responsePromise;
    return response;
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible' });
    return await this.getTextContent(this.errorMessage);
  }

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Check if login button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if login button is loading
   */
  async isSubmitButtonLoading(): Promise<boolean> {
    const loadingIcon = this.submitButton.locator('.anticon-loading');
    return await this.isVisible(loadingIcon);
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.clickButton(this.forgotPasswordLink);
  }

  /**
   * Click sign up link
   */
  async clickSignUp() {
    await this.clickButton(this.signUpLink);
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.getTextContent(this.pageTitle);
  }

  /**
   * Check if on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    return this.page.url().includes('/login');
  }
}
