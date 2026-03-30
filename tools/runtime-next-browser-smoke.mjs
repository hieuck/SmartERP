import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const baseUrl = process.env.SMARTERP_NEXT_FRONTEND_URL ?? "http://127.0.0.1:3000";
const screenshotPath = path.join(outputDir, "runtime-next-smoke.png");
const summaryPath = path.join(outputDir, "runtime-next-smoke-summary.json");
const demoEmail = process.env.SMARTERP_NEXT_DEMO_EMAIL ?? "founder@smarterp.vn";
const demoPassword = process.env.SMARTERP_NEXT_DEMO_PASSWORD ?? "smarterp-next";
const sessionStorageKey = "smarterp.next.session";
const tenantStorageKey = "smarterp.next.selectedTenantId";
const languageStorageKey = "smarterp-next-language";
const smokeId = String(Date.now()).slice(-6);
const tenantName = `Smoke Tenant ${smokeId}`;
const tenantSlug = `smoke-${smokeId}`;
const customerName = `Smoke Buyer ${smokeId}`;
const customerEmail = `smoke.${smokeId}@example.com`;
const productName = `Smoke Bottle ${smokeId}`;
const productSku = `SMK-${smokeId}`;
const firstPaymentTermDays = 14;
const secondPaymentTermDays = 10;
const secondDaysPastDue = 35;
const firstIssueDateInput = buildDateInputFromToday(0);
const secondIssueDateInput = buildDateInputFromToday(-(secondDaysPastDue + secondPaymentTermDays));
const unitPrice = 25000;
const stockInQuantity = 12;
const saleQuantity = 5;
const secondSaleQuantity = 2;
const invalidQuantity = 20;
const taxRate = 10;
const partialPaymentAmount = 50000;
const firstOrderGrossAmount = unitPrice * saleQuantity;
const secondOrderGrossAmount = unitPrice * secondSaleQuantity;
const firstInvoiceAmount = Math.round(firstOrderGrossAmount * (1 + taxRate / 100));
const secondInvoiceAmount = Math.round(secondOrderGrossAmount * (1 + taxRate / 100));
const expectedGrossSales = firstOrderGrossAmount + secondOrderGrossAmount;
const expectedInvoicedAmount = firstInvoiceAmount + secondInvoiceAmount;
const remainingPaymentAmount = firstInvoiceAmount - partialPaymentAmount;
const expectedCashCollectedAmount = firstInvoiceAmount;
const expectedOutstandingReceivablesAmount = secondInvoiceAmount;
const expectedCurrentReceivablesAmount = 0;
const expectedOverdue31To60Amount = secondInvoiceAmount;
const expectedRemainingStock = stockInQuantity - saleQuantity - secondSaleQuantity;
const sidebarIndexes = {
  dashboard: 0,
  tenants: 1,
  customers: 2,
  products: 3,
  orders: 4,
  inventory: 5,
  invoices: 6,
  reports: 7,
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeMessage(message) {
  return message.replace(/\s+/g, " ").trim();
}

function isIgnorableConsoleMessage(message) {
  return message.includes("React DevTools");
}

function isExpectedUnauthorizedConsoleMessage(message) {
  return message.includes("status of 401") && message.includes("Unauthorized");
}

function isExpectedBadRequestConsoleMessage(message) {
  return message.includes("status of 400") && message.includes("Bad Request");
}

function isIgnorableRequest(url) {
  return url.endsWith("/favicon.ico");
}

function isExpectedNegativePath(response) {
  return (
    (
      response.status() === 401 &&
      (
        (response.request().method() === "POST" && response.url().endsWith("/api/auth/login")) ||
        (response.request().method() === "GET" && response.url().endsWith("/api/tenants"))
      )
    ) ||
    (
      response.status() === 400 &&
      response.request().method() === "POST" &&
      (
        response.url().endsWith("/api/tenants") ||
        response.url().endsWith("/api/products") ||
        response.url().endsWith("/api/invoices/payments")
      )
    )
  );
}

function buildAmountPattern(amount) {
  const formatted = new Intl.NumberFormat("vi-VN").format(amount).replace(/\./g, "\\.");
  return new RegExp(formatted);
}

function buildDateInputFromToday(daysOffset) {
  const candidate = new Date();
  candidate.setUTCDate(candidate.getUTCDate() + daysOffset);
  return candidate.toISOString().slice(0, 10);
}

async function openApp(page) {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

async function openDirectRoute(page, routePath) {
  await page.goto(`${baseUrl}${routePath}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.waitForURL(new RegExp(`${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), {
    timeout: 15000,
  });
  await page.locator(".page-stack").waitFor({ timeout: 15000 });
}

async function openSection(page, index, expectedPath) {
  await page.locator(".ant-layout-sider .ant-menu-item").nth(index).click();
  await page.waitForURL(new RegExp(`${expectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), {
    timeout: 15000,
  });
  await page.waitForLoadState("networkidle");
  await page.locator(".page-stack").waitFor({ timeout: 15000 });
}

function getFormCard(page) {
  return page.locator(".two-column .ant-card").first();
}

function getListCard(page) {
  return page.locator(".two-column > .ant-card").last();
}

async function fillField(container, selector, value) {
  const input = container.locator(selector);
  await input.click();
  await input.fill("");
  await input.fill(String(value));
}

async function fillNumberInput(input, value) {
  await input.click();
  await input.fill("");
  await input.fill(String(value));
}

async function waitForInputValue(input, expectedValue, timeout = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    if ((await input.inputValue()) === expectedValue) {
      return;
    }

    await input.page().waitForTimeout(100);
  }

  throw new Error(`Input did not reset to "${expectedValue}" within ${timeout}ms.`);
}

async function selectOption(page, combobox, optionText) {
  await combobox.click();
  const option = page.locator(".ant-select-item-option").filter({ hasText: optionText }).last();
  await option.waitFor({ timeout: 15000 });
  await option.click();
}

async function clickSubmit(container) {
  await container.locator("button[type='submit']").first().click();
}

async function waitForFormReady(container) {
  await container.locator("button[type='submit']:not([disabled])").first().waitFor({ timeout: 15000 });
}

async function waitForStoredValue(page, key, value) {
  await page.waitForFunction(
    ({ storageKey, storageValue }) => window.localStorage.getItem(storageKey) === storageValue,
    { storageKey: key, storageValue: value },
    { timeout: 15000 },
  );
}

async function clickLanguageToggle(page, value) {
  await page.locator(".header-language").getByText(value, { exact: true }).click();
  await waitForStoredValue(page, languageStorageKey, value.toLowerCase());
}

async function waitForTenantContext(page, expectedTenantName) {
  const toolbar = page.locator(".page-toolbar");
  await toolbar.waitFor({ timeout: 15000 });
  await page.waitForFunction(
    ({ selector, tenantName }) => {
      const element = document.querySelector(selector);
      return Boolean(element && element.textContent && element.textContent.includes(tenantName));
    },
    { selector: ".page-toolbar", tenantName: expectedTenantName },
    { timeout: 15000 },
  );
}

function getStatisticValue(page, title) {
  return page
    .locator(".ant-statistic")
    .filter({ hasText: title })
    .locator(".ant-statistic-content-value");
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleWarnings = [];
  const consoleErrors = [];
  const failedRequests = [];

  page.on("console", (message) => {
    const text = normalizeMessage(message.text());

    if (isIgnorableConsoleMessage(text)) {
      return;
    }

    if (isExpectedUnauthorizedConsoleMessage(text) || isExpectedBadRequestConsoleMessage(text)) {
      return;
    }

    if (message.type() === "warning") {
      consoleWarnings.push(text);
    }

    if (message.type() === "error") {
      consoleErrors.push(text);
    }
  });

  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      !isIgnorableRequest(response.url()) &&
      !isExpectedNegativePath(response)
    ) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  let orderNumber = "";
  let invoiceNumber = "";
  let secondOrderNumber = "";
  let secondInvoiceNumber = "";
  let invalidLoginVerified = false;
  let staleSessionRejectedVerified = false;
  let localeReloadVerified = false;
  let duplicateTenantRejectedVerified = false;
  let duplicateProductRejectedVerified = false;
  let paymentGuardVerified = false;
  let partialSettlementVerified = false;
  let finalSettlementVerified = false;
  let unauthorizedApiBlockedVerified = false;

  try {
    await openApp(page);
    await page.waitForURL(/\/login$/, { timeout: 15000 });
    await page.locator('input[autocomplete="email"]').fill(demoEmail);
    await page.locator('input[autocomplete="current-password"]').fill(`${demoPassword}-invalid`);
    const invalidLoginResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/login") &&
        response.request().method() === "POST" &&
        response.status() === 401,
      { timeout: 15000 },
    );
    await page.locator('.login-card button[type="submit"]').click();
    await invalidLoginResponse;
    await page.locator(".login-card .ant-alert").waitFor({ timeout: 15000 });
    assert(!(await page.evaluate((key) => window.localStorage.getItem(key), sessionStorageKey)), "Session was stored after invalid login.");
    invalidLoginVerified = true;
    await page.evaluate(
      ({ sessionKey, forgedSession }) => {
        window.localStorage.setItem(sessionKey, JSON.stringify(forgedSession));
      },
      {
        sessionKey: sessionStorageKey,
        forgedSession: {
          userId: "founder-1",
          email: demoEmail,
          displayName: "SmartERP Founder",
          role: "founder",
          accessToken: "stale-token",
        },
      },
    );
    await page.goto(`${baseUrl}/dashboard/tenants`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForURL(/\/login$/, { timeout: 15000 });
    await page.locator(".login-card .ant-alert").waitFor({ timeout: 15000 });
    assert(
      !(await page.evaluate((key) => window.localStorage.getItem(key), sessionStorageKey)),
      "Forged session was not cleared after the API rejected it.",
    );
    staleSessionRejectedVerified = true;

    await page.locator('input[autocomplete="email"]').fill(demoEmail);
    await page.locator('input[autocomplete="current-password"]').fill(demoPassword);
    await page.locator('.login-card button[type="submit"]').click();
    await page.waitForURL(/\/dashboard$/, { timeout: 15000 });
    await clickLanguageToggle(page, "EN");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForURL(/\/dashboard$/, { timeout: 15000 });
    await page.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: 15000 });
    assert((await page.evaluate((key) => window.localStorage.getItem(key), languageStorageKey)) === "en", "Language did not persist as English after reload.");
    localeReloadVerified = true;
    await clickLanguageToggle(page, "VI");
    await page.getByRole("heading", { name: "Bảng điều khiển" }).waitFor({ timeout: 15000 });
    await page.locator(".ant-layout-sider").waitFor({ timeout: 15000 });
    await page.locator(".page-stack").waitFor({ timeout: 15000 });

    await openSection(page, sidebarIndexes.tenants, "/dashboard/tenants");
    const tenantsFormCard = getFormCard(page);
    await fillField(tenantsFormCard, "#name", tenantName);
    await fillField(tenantsFormCard, "#slug", tenantSlug);
    await fillField(tenantsFormCard, "#industry", "Smoke QA");
    await clickSubmit(tenantsFormCard);
    await getListCard(page).getByText(tenantName, { exact: false }).waitFor({ timeout: 15000 });
    await waitForInputValue(tenantsFormCard.locator("#name"), "");
    await waitForInputValue(tenantsFormCard.locator("#slug"), "");
    await fillField(tenantsFormCard, "#name", `${tenantName} Duplicate`);
    await fillField(tenantsFormCard, "#slug", tenantSlug);
    await fillField(tenantsFormCard, "#industry", "Duplicate Industry");
    const duplicateTenantResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/tenants") &&
        response.request().method() === "POST" &&
        response.status() === 400,
      { timeout: 15000 },
    );
    await clickSubmit(tenantsFormCard);
    assert(
      ((await (await duplicateTenantResponse).json())?.error ?? "") === "A tenant with this slug already exists.",
      "Duplicate tenant slug did not return the expected validation message.",
    );
    await page.locator(".global-alert .ant-alert").waitFor({ timeout: 15000 });
    await page.locator(".global-alert .ant-alert-close-icon").click();
    await page.locator(".global-alert .ant-alert").waitFor({ state: "hidden", timeout: 15000 });
    duplicateTenantRejectedVerified = true;

    await openDirectRoute(page, "/dashboard/customers");
    await waitForTenantContext(page, tenantName);
    const customersFormCard = getFormCard(page);
    await waitForFormReady(customersFormCard);
    await fillField(customersFormCard, "#name", customerName);
    await fillField(customersFormCard, "#email", customerEmail);
    await fillField(customersFormCard, "#phone", "+84 98 000 0000");
    await fillField(customersFormCard, "#city", "Ho Chi Minh City");
    await clickSubmit(customersFormCard);
    await getListCard(page).getByText(customerName, { exact: false }).waitFor({ timeout: 15000 });
    await waitForInputValue(customersFormCard.locator("#name"), "");
    await waitForInputValue(customersFormCard.locator("#email"), "");

    await openSection(page, sidebarIndexes.products, "/dashboard/products");
    await waitForTenantContext(page, tenantName);
    const productsFormCard = getFormCard(page);
    await waitForFormReady(productsFormCard);
    await fillField(productsFormCard, "#sku", productSku);
    await fillField(productsFormCard, "#name", productName);
    await fillField(productsFormCard, "#unitPrice", unitPrice);
    await clickSubmit(productsFormCard);
    await getListCard(page).getByText(productName, { exact: false }).waitFor({ timeout: 15000 });
    await waitForInputValue(productsFormCard.locator("#sku"), "");
    await waitForInputValue(productsFormCard.locator("#name"), "");
    await fillField(productsFormCard, "#sku", productSku);
    await fillField(productsFormCard, "#name", `${productName} Duplicate`);
    await fillField(productsFormCard, "#unitPrice", unitPrice + 1000);
    const duplicateProductResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/products") &&
        response.request().method() === "POST" &&
        response.status() === 400,
      { timeout: 15000 },
    );
    await clickSubmit(productsFormCard);
    assert(
      ((await (await duplicateProductResponse).json())?.error ?? "") ===
        "A product with this SKU already exists for the selected tenant.",
      "Duplicate product SKU did not return the expected validation message.",
    );
    await page.locator(".global-alert .ant-alert").waitFor({ timeout: 15000 });
    await page.locator(".global-alert .ant-alert-close-icon").click();
    await page.locator(".global-alert .ant-alert").waitFor({ state: "hidden", timeout: 15000 });
    duplicateProductRejectedVerified = true;

    await openSection(page, sidebarIndexes.inventory, "/dashboard/inventory");
    await waitForTenantContext(page, tenantName);
    const inventoryFormCard = getFormCard(page);
    await waitForFormReady(inventoryFormCard);
    await selectOption(page, inventoryFormCard.getByRole("combobox", { name: "* Sản phẩm" }), productName);
    await fillNumberInput(inventoryFormCard.getByRole("spinbutton", { name: "* Số lượng" }), stockInQuantity);
    await clickSubmit(inventoryFormCard);
    const inventoryRow = getListCard(page).locator(".record-row").filter({ hasText: productName }).first();
    await inventoryRow.waitFor({ timeout: 15000 });
    await inventoryRow.getByText(String(stockInQuantity), { exact: true }).waitFor({ timeout: 15000 });

    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    const ordersFormCard = getFormCard(page);
    await waitForFormReady(ordersFormCard);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Khách hàng" }), customerName);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Sản phẩm" }), productName);
    await fillNumberInput(ordersFormCard.getByRole("spinbutton", { name: "* Số lượng" }), saleQuantity);
    await clickSubmit(ordersFormCard);
    const orderRow = getListCard(page).locator(".record-row").filter({ hasText: productName }).first();
    await orderRow.waitFor({ timeout: 15000 });
    await orderRow.getByText(customerName, { exact: false }).waitFor({ timeout: 15000 });
    orderNumber = (await orderRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(orderNumber.length > 0, "Order number was not rendered after order creation.");

    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Khách hàng" }), customerName);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Sản phẩm" }), productName);
    await fillNumberInput(ordersFormCard.getByRole("spinbutton", { name: "* Số lượng" }), invalidQuantity);
    await clickSubmit(ordersFormCard);
    await ordersFormCard.locator(".ant-form-item-explain-error").last().waitFor({ timeout: 15000 });

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    const issueInvoiceCard = page.locator(".page-column-stack .ant-card").nth(0);
    const paymentCard = page.locator(".page-column-stack .ant-card").nth(1);
    const collectionCard = page.locator(".page-column-stack .ant-card").nth(2);
    await waitForFormReady(issueInvoiceCard);
    await selectOption(page, issueInvoiceCard.getByRole("combobox", { name: /Đơn hàng/ }), orderNumber);
    await fillField(issueInvoiceCard, "#issueDate", firstIssueDateInput);
    await fillField(issueInvoiceCard, "#paymentTermDays", firstPaymentTermDays);
    await fillField(issueInvoiceCard, "#taxRatePercent", taxRate);
    await clickSubmit(issueInvoiceCard);
    const invoiceRow = getListCard(page).locator(".record-row").filter({ hasText: orderNumber }).first();
    await invoiceRow.waitFor({ timeout: 15000 });
    await invoiceRow.getByText(customerName, { exact: false }).waitFor({ timeout: 15000 });
    invoiceNumber = (await invoiceRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(invoiceNumber.length > 0, "Invoice number was not rendered after invoice creation.");
    await invoiceRow.getByText(buildAmountPattern(firstInvoiceAmount)).first().waitFor({ timeout: 15000 });
    await waitForFormReady(paymentCard);
    const excessivePaymentResponse = await page.evaluate(
      async ({ invoiceNumberToOverpay, amount, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const invoicesResponse = await fetch(`/api/invoices?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const invoicesPayload = await invoicesResponse.json();
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === invoiceNumberToOverpay);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Invoice lookup failed before overpayment test." } };
        }

        const response = await fetch("/api/invoices/payments", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            amount,
            method: "cash",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        invoiceNumberToOverpay: invoiceNumber,
        amount: firstInvoiceAmount + 1,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      excessivePaymentResponse.status === 400 &&
        excessivePaymentResponse.body?.error === "Payment amount cannot exceed the outstanding balance.",
      "Excessive payment did not return the expected validation message.",
    );
    paymentGuardVerified = true;
    await selectOption(page, paymentCard.getByRole("combobox", { name: /Hóa đơn/ }), invoiceNumber);
    await selectOption(page, paymentCard.getByRole("combobox", { name: /Phương thức/ }), "Tiền mặt");
    await fillNumberInput(paymentCard.getByRole("spinbutton", { name: /Số tiền/ }), partialPaymentAmount);
    await clickSubmit(paymentCard);
    await invoiceRow.getByText("Thanh toán một phần", { exact: false }).waitFor({ timeout: 15000 });
    await invoiceRow.getByText(buildAmountPattern(partialPaymentAmount)).first().waitFor({ timeout: 15000 });
    await invoiceRow.getByText(buildAmountPattern(remainingPaymentAmount)).first().waitFor({ timeout: 15000 });
    partialSettlementVerified = true;
    await selectOption(page, paymentCard.getByRole("combobox", { name: /Hóa đơn/ }), invoiceNumber);
    await selectOption(page, paymentCard.getByRole("combobox", { name: /Phương thức/ }), "Chuyển khoản");
    await fillNumberInput(paymentCard.getByRole("spinbutton", { name: /Số tiền/ }), remainingPaymentAmount);
    await clickSubmit(paymentCard);
    await invoiceRow.getByText("Đã thanh toán", { exact: false }).waitFor({ timeout: 15000 });
    await invoiceRow.getByText(buildAmountPattern(firstInvoiceAmount)).first().waitFor({ timeout: 15000 });
    await paymentCard.getByText("Mọi hóa đơn hiện tại đều đã được thanh toán đủ.", { exact: false }).waitFor({ timeout: 15000 });
    finalSettlementVerified = true;

    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    await waitForFormReady(ordersFormCard);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Khách hàng" }), customerName);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Sản phẩm" }), productName);
    await fillNumberInput(ordersFormCard.getByRole("spinbutton", { name: "* Số lượng" }), secondSaleQuantity);
    await clickSubmit(ordersFormCard);
    const secondOrderRow = getListCard(page).locator(".record-row").first();
    await secondOrderRow.waitFor({ timeout: 15000 });
    await secondOrderRow.getByText(customerName, { exact: false }).waitFor({ timeout: 15000 });
    secondOrderNumber = (await secondOrderRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(secondOrderNumber.length > 0, "Second order number was not rendered after order creation.");

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    await waitForFormReady(issueInvoiceCard);
    await selectOption(page, issueInvoiceCard.getByRole("combobox", { name: /Đơn hàng/ }), secondOrderNumber);
    await fillField(issueInvoiceCard, "#issueDate", secondIssueDateInput);
    await fillField(issueInvoiceCard, "#paymentTermDays", secondPaymentTermDays);
    await fillField(issueInvoiceCard, "#taxRatePercent", taxRate);
    await clickSubmit(issueInvoiceCard);
    const secondInvoiceRow = getListCard(page).locator(".record-row").filter({ hasText: secondOrderNumber }).first();
    await secondInvoiceRow.waitFor({ timeout: 15000 });
    secondInvoiceNumber = (await secondInvoiceRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(secondInvoiceNumber.length > 0, "Second invoice number was not rendered after invoice creation.");
    await secondInvoiceRow.getByText("Đã phát hành", { exact: false }).waitFor({ timeout: 15000 });
    await secondInvoiceRow.getByText(`Quá hạn ${secondDaysPastDue} ngày`, { exact: false }).waitFor({ timeout: 15000 });
    await secondInvoiceRow.getByText(buildAmountPattern(secondInvoiceAmount)).first().waitFor({ timeout: 15000 });
    await collectionCard.getByText(secondInvoiceNumber, { exact: false }).waitFor({ timeout: 15000 });
    await collectionCard.getByText(`Quá hạn ${secondDaysPastDue} ngày`, { exact: false }).waitFor({ timeout: 15000 });

    await openSection(page, sidebarIndexes.customers, "/dashboard/customers");
    await waitForTenantContext(page, tenantName);
    const customerRow = getListCard(page).locator(".record-row").filter({ hasText: customerName }).first();
    await customerRow.waitFor({ timeout: 15000 });
    await customerRow.getByText(buildAmountPattern(expectedInvoicedAmount)).first().waitFor({ timeout: 15000 });
    await customerRow.getByText(buildAmountPattern(expectedCashCollectedAmount)).first().waitFor({ timeout: 15000 });
    await customerRow.getByText(buildAmountPattern(expectedOutstandingReceivablesAmount)).first().waitFor({ timeout: 15000 });
    await customerRow
      .locator(".customer-statement-item")
      .filter({ hasText: "Hiện tại" })
      .getByText(buildAmountPattern(expectedCurrentReceivablesAmount))
      .waitFor({ timeout: 15000 });
    await customerRow
      .locator(".customer-statement-item")
      .filter({ hasText: "31-60 ngày" })
      .getByText(buildAmountPattern(expectedOverdue31To60Amount))
      .waitFor({ timeout: 15000 });
    await customerRow
      .locator(".customer-statement-item")
      .filter({ hasText: "Số hóa đơn" })
      .getByText("2", { exact: true })
      .waitFor({ timeout: 15000 });

    await openSection(page, sidebarIndexes.reports, "/dashboard/reports");
    await waitForTenantContext(page, tenantName);
    await getStatisticValue(page, "Doanh số gộp").getByText(buildAmountPattern(expectedGrossSales)).waitFor({ timeout: 15000 });
    await getStatisticValue(page, "Đã xuất hóa đơn").getByText(buildAmountPattern(expectedInvoicedAmount)).waitFor({ timeout: 15000 });
    await getStatisticValue(page, "Tiền đã thu").getByText(buildAmountPattern(expectedCashCollectedAmount)).waitFor({ timeout: 15000 });
    await getStatisticValue(page, "Công nợ còn lại").getByText(buildAmountPattern(expectedOutstandingReceivablesAmount)).waitFor({ timeout: 15000 });
    await getStatisticValue(page, "Công nợ hiện tại").getByText(buildAmountPattern(expectedCurrentReceivablesAmount)).waitFor({ timeout: 15000 });
    await getStatisticValue(page, "31-60 ngày").getByText(buildAmountPattern(expectedOverdue31To60Amount)).waitFor({ timeout: 15000 });
    await getStatisticValue(page, "61-90 ngày").getByText(buildAmountPattern(0)).waitFor({ timeout: 15000 });
    await getStatisticValue(page, "Trên 90 ngày").getByText(buildAmountPattern(0)).waitFor({ timeout: 15000 });
    await getStatisticValue(page, "Hóa đơn đã thu đủ").getByText("1", { exact: true }).waitFor({ timeout: 15000 });
    await getStatisticValue(page, "Hóa đơn còn công nợ").getByText("1", { exact: true }).waitFor({ timeout: 15000 });
    await page.getByText(customerName, { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(productName, { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(String(expectedRemainingStock), { exact: true }).first().waitFor({ timeout: 15000 });
    const storedWorkspaceStateBeforeLogout = await page.evaluate(
      ({ sessionKey, tenantKey }) => ({
        session: window.localStorage.getItem(sessionKey),
        tenantId: window.localStorage.getItem(tenantKey),
      }),
      { sessionKey: sessionStorageKey, tenantKey: tenantStorageKey },
    );
    assert(Boolean(storedWorkspaceStateBeforeLogout.session), "Session was not persisted before logout.");
    assert(Boolean(storedWorkspaceStateBeforeLogout.tenantId), "Selected tenant was not persisted before logout.");

    await page.locator(".header-user").click();
    await page.locator(".ant-dropdown [role='menuitem']").first().click();
    await page.waitForURL(/\/login$/, { timeout: 15000 });
    await page.locator(".login-card").waitFor({ timeout: 15000 });

    const storedWorkspaceStateAfterLogout = await page.evaluate(
      ({ sessionKey, tenantKey }) => ({
        session: window.localStorage.getItem(sessionKey),
        tenantId: window.localStorage.getItem(tenantKey),
      }),
      { sessionKey: sessionStorageKey, tenantKey: tenantStorageKey },
    );
    assert(!storedWorkspaceStateAfterLogout.session, "Session persisted after logout.");
    assert(!storedWorkspaceStateAfterLogout.tenantId, "Selected tenant persisted after logout.");
    const unauthorizedTenantsResponse = await page.evaluate(async () => {
      const response = await fetch("/api/tenants");
      return {
        status: response.status,
        body: await response.json(),
      };
    });
    assert(
      unauthorizedTenantsResponse.status === 401,
      `Expected /api/tenants to return 401 after logout, received ${unauthorizedTenantsResponse.status}.`,
    );
    assert(
      unauthorizedTenantsResponse.body?.error === "Authentication required.",
      "Protected API did not return the expected auth error after logout.",
    );
    unauthorizedApiBlockedVerified = true;

    await page.goto(`${baseUrl}/dashboard/reports`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForURL(/\/login$/, { timeout: 15000 });
    await page.locator(".login-card").waitFor({ timeout: 15000 });

    await page.screenshot({ path: screenshotPath, fullPage: true });

    const summary = {
      checkedAt: new Date().toISOString(),
      baseUrl,
      tenantName,
      customerName,
      customerEmail,
      productName,
      productSku,
      orderNumber,
      invoiceNumber,
      secondOrderNumber,
      secondInvoiceNumber,
      invalidLoginVerified,
      staleSessionRejectedVerified,
      loginReloadVerified: true,
      localeReloadVerified,
      duplicateTenantRejectedVerified,
      duplicateProductRejectedVerified,
      paymentGuardVerified,
      partialSettlementVerified,
      finalSettlementVerified,
      directRouteVerified: true,
      logoutClearsStorageVerified: true,
      logoutBlocksProtectedRouteVerified: true,
      unauthorizedApiBlockedVerified,
      expectedGrossSales,
      expectedInvoicedAmount,
      expectedCashCollectedAmount,
      expectedOutstandingReceivablesAmount,
      expectedCurrentReceivablesAmount,
      expectedOverdue31To60Amount,
      expectedRemainingStock,
      consoleWarnings,
      consoleErrors,
      failedRequests,
      screenshotPath,
    };

    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));

    assert(consoleWarnings.length === 0, `Console warnings detected: ${consoleWarnings.join(" | ")}`);
    assert(consoleErrors.length === 0, `Console errors detected: ${consoleErrors.join(" | ")}`);
    assert(failedRequests.length === 0, `Failed network requests detected: ${failedRequests.join(" | ")}`);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});








