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
const financeEmail = "finance@smarterp.vn";
const salesEmail = "sales@smarterp.vn";
const warehouseEmail = "warehouse@smarterp.vn";
const collectorEmail = "collector@smarterp.vn";
const sessionStorageKey = "smarterp.next.session";
const tenantStorageKey = "smarterp.next.selectedTenantId";
const languageStorageKey = "smarterp-next-language";
const smokeId = String(Date.now()).slice(-6);
const exportSnapshotDownloadPath = path.join(outputDir, `runtime-next-tenant-export-${smokeId}.json`);
const handoffPackageDownloadPath = path.join(outputDir, `runtime-next-handoff-${smokeId}.json`);
const recoveryDrillDownloadPath = path.join(outputDir, `runtime-next-recovery-drill-${smokeId}.json`);
const tenantName = `Smoke Tenant ${smokeId}`;
const tenantSlug = `smoke-${smokeId}`;
const customerName = `Smoke Buyer ${smokeId}`;
const customerEmail = `smoke.${smokeId}@example.com`;
const customerPhone = "+84 98 000 0000";
const customerCity = "Ho Chi Minh City";
const supplierName = `Smoke Supplier ${smokeId}`;
const supplierEmail = `supply.${smokeId}@example.com`;
const supplierPhone = "+84 27 4123 4567";
const supplierCity = "Binh Duong";
const supplierCode = `SUP-${smokeId}`;
const productCategoryName = `Bottles ${smokeId}`;
const productName = `Smoke Bottle ${smokeId}`;
const productSku = `SMK-${smokeId}`;
const productImageUrl = "/product-photo-demo.svg";
const restoredTenantName = `Restored Tenant ${smokeId}`;
const restoredTenantSlug = `restored-${smokeId}`;
const restoredTenantIndustry = "Restored Smoke QA";
const customerImportCsv = `name,email,phone,city\n${customerName},${customerEmail},${customerPhone},${customerCity}`;
const supplierImportCsv = `supplierCode,name,email,phone,city,leadTimeDays\n${supplierCode},${supplierName},${supplierEmail},${supplierPhone},${supplierCity},7`;
const editableCustomerName = `Editable Buyer ${smokeId}`;
const editableCustomerEmail = `editable.buyer.${smokeId}@example.com`;
const editableCustomerPhone = "+84 98 111 1111";
const editableCustomerCity = "Da Nang";
const editedCustomerName = `Edited Buyer ${smokeId}`;
const editedCustomerEmail = `edited.buyer.${smokeId}@example.com`;
const editedCustomerPhone = "+84 98 222 2222";
const editedCustomerCity = "Can Tho";
const editableSupplierCode = `EDIT-SUP-${smokeId}`;
const editableSupplierName = `Editable Supplier ${smokeId}`;
const editableSupplierEmail = `editable.supplier.${smokeId}@example.com`;
const editableSupplierPhone = "+84 27 4000 1111";
const editableSupplierCity = "Dong Nai";
const editedSupplierCode = `EDIT2-SUP-${smokeId}`;
const editedSupplierName = `Edited Supplier ${smokeId}`;
const editedSupplierEmail = `edited.supplier.${smokeId}@example.com`;
const editedSupplierPhone = "+84 27 4000 2222";
const editedSupplierCity = "Long An";
const editableProductCategoryName = `Editable Category ${smokeId}`;
const editedProductCategoryName = `Edited Category ${smokeId}`;
const editableProductName = `Editable Product ${smokeId}`;
const editableProductUnitPrice = 31000;
const editedProductName = `Edited Product ${smokeId}`;
const editedProductUnitPrice = 33000;
const expectedReceiptDateInput = buildDateInputFromToday(7);
const editedExpectedReceiptDateInput = buildDateInputFromToday(10);
const firstPaymentTermDays = 14;
const secondPaymentTermDays = 10;
const secondDaysPastDue = 35;
const promisedPaymentDateInput = buildDateInputFromToday(3);
const worklistActionDateInput = buildDateInputFromToday(0);
const collectionNote = "Khach xac nhan se chuyen khoan vao cuoi tuan.";
const escalatedCollectionNote = "Qua ngay hua thanh toan, can founder xu ly truc tiep.";
const invoiceAmendmentNote = "Corrected commercial terms before customer payment posting.";
const reissueAmendmentNote = "Corrected shipping quantity after voiding the previous invoice revision.";
const invoiceCreditNote = "Returned shipment after full settlement and inspection.";
const manualReturnAuthorizationNote = "Approved customer return after warehouse inspection request.";
const manualReturnAuthorizationAmendNote = "Customer confirmed a larger approved return quantity after the initial case was opened.";
const manualReturnCloseNote = "Customer withdrew the warehouse return request after collections review.";
const manualReturnReopenNote = "Customer resumed the return after the prior close-out was reversed.";
const manualReturnReceiptNote = "Warehouse received the returned bottle before finance posted the credit note.";
const founderReturnAuthorizationNote = "Approved premium bottle return after founder escalation.";
const founderReturnReceiptNote = "Warehouse received the premium return before finance requested a large credit.";
const founderReturnCreditNote = "Large financial-only credit requested for the premium return case.";
const partialInvoiceCreditNote = "Refund one damaged bottle after full settlement.";
const firstIssueDateInput = buildDateInputFromToday(0);
const secondIssueDateInput = buildDateInputFromToday(-(secondDaysPastDue + secondPaymentTermDays));
const amendedPaymentTermDays = firstPaymentTermDays + 7;
const unitPrice = 25000;
const productImportCsv = `name,category,unitPrice,sku,imageUrl\n${productName},${productCategoryName},${unitPrice},${productSku},${productImageUrl}`;
const purchaseUnitCost = 18000;
const purchaseQuantity = 24;
const editedPurchaseQuantity = 26;
const cancelablePurchaseQuantity = 4;
const stockInQuantity = 12;
const saleQuantity = 5;
const editedSaleQuantity = 4;
const secondSaleQuantity = 2;
const creditedOrderQuantity = 1;
const founderReturnOrderQuantity = 2;
const founderReturnTopUpQuantity = 1;
const partialCreditOrderQuantity = 5;
const partialCreditQuantity = 2;
const partialCreditMode = "financial_only";
const cancelableOrderQuantity = 1;
const voidableOrderQuantity = 3;
const invalidQuantity = 20;
const taxRate = 10;
const partialPaymentAmount = 50000;
const firstOrderGrossAmount = unitPrice * editedSaleQuantity;
const secondOrderGrossAmount = unitPrice * secondSaleQuantity;
const voidableOrderGrossAmount = unitPrice * voidableOrderQuantity;
const firstInvoiceAmount = Math.round(firstOrderGrossAmount * (1 + taxRate / 100));
const secondInvoiceAmount = Math.round(secondOrderGrossAmount * (1 + taxRate / 100));
const creditedInvoiceAmount = Math.round(unitPrice * creditedOrderQuantity * (1 + taxRate / 100));
const founderReturnInvoiceAmount = Math.round(unitPrice * founderReturnOrderQuantity * (1 + taxRate / 100));
const partialCreditInvoiceAmount = Math.round(unitPrice * partialCreditOrderQuantity * (1 + taxRate / 100));
const partialCreditAmount = Math.round(unitPrice * partialCreditQuantity * (1 + taxRate / 100));
const voidableInvoiceAmount = Math.round(voidableOrderGrossAmount * (1 + taxRate / 100));
const partialCreditNetGrossAmount = unitPrice * (partialCreditOrderQuantity - partialCreditQuantity);
const partialCreditNetInvoiceAmount = partialCreditInvoiceAmount - partialCreditAmount;
const expectedGrossSales = firstOrderGrossAmount + secondOrderGrossAmount;
const expectedInvoicedAmount = firstInvoiceAmount + secondInvoiceAmount;
const remainingPaymentAmount = firstInvoiceAmount - partialPaymentAmount;
const expectedCashCollectedAmount = firstInvoiceAmount;
const expectedOutstandingReceivablesAmount = secondInvoiceAmount;
const expectedCurrentReceivablesAmount = 0;
const expectedOverdue31To60Amount = secondInvoiceAmount;
const expectedRemainingStock = stockInQuantity - editedSaleQuantity - secondSaleQuantity;
const expectedReceivedPurchaseValue = stockInQuantity * purchaseUnitCost;
const expectedInventoryValueAmount = expectedRemainingStock * purchaseUnitCost;
const expectedCashOnHandAmount = partialPaymentAmount;
const expectedBankAmount = remainingPaymentAmount;
const expectedReceivablesLedgerAmount = expectedOutstandingReceivablesAmount;
const expectedPayablesAmount = expectedReceivedPurchaseValue;
const expectedCogsAmount = (editedSaleQuantity + secondSaleQuantity) * purchaseUnitCost;
const expectedVatPayableAmount = firstInvoiceAmount + secondInvoiceAmount - expectedGrossSales;
const expectedRevenueAmount = expectedGrossSales;
const expectedGrossSalesAfterPartialCredit = expectedGrossSales + partialCreditNetGrossAmount;
const expectedInvoicedAmountAfterPartialCredit = expectedInvoicedAmount + partialCreditNetInvoiceAmount;
const expectedCashCollectedAmountAfterPartialCredit = expectedCashCollectedAmount + partialCreditNetInvoiceAmount;
const expectedCreditedAmountAfterPartialCredit = creditedInvoiceAmount + partialCreditAmount;
const expectedRemainingStockAfterPartialCredit = expectedRemainingStock - partialCreditOrderQuantity;
const expectedInventoryValueAfterPartialCredit = expectedRemainingStockAfterPartialCredit * purchaseUnitCost;
const expectedRestoreRemainingStock = expectedRemainingStockAfterPartialCredit;
const expectedRestoreInventoryValueAmount = expectedInventoryValueAfterPartialCredit;
const initialPurchaseOrderAmount = purchaseUnitCost * purchaseQuantity;
const expectedPurchaseOrderAmount = purchaseUnitCost * editedPurchaseQuantity;
const sidebarIndexes = {
  dashboard: 0,
  setup: 1,
  tenants: 2,
  customers: 3,
  suppliers: 4,
  products: 5,
  purchaseOrders: 6,
  inventory: 7,
  orders: 8,
  invoices: 9,
  reports: 10,
  approvals: 11,
  operations: 12,
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

function isExpectedForbiddenConsoleMessage(message) {
  return message.includes("status of 403") && message.includes("Forbidden");
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
        response.status() === 403 &&
        response.request().method() === "POST" &&
        (
          response.url().endsWith("/api/invoices") ||
          response.url().endsWith("/api/invoices/amend") ||
          response.url().endsWith("/api/invoices/credit") ||
          response.url().endsWith("/api/invoices/return-authorizations") ||
          response.url().endsWith("/api/invoices/return-receipts") ||
          response.url().endsWith("/api/purchase-orders") ||
          response.url().endsWith("/api/onboarding/import") ||
          response.url().endsWith("/api/onboarding/restore/preview") ||
          response.url().endsWith("/api/onboarding/restore")
        )
      ) ||
      (
        response.status() === 400 &&
        response.request().method() === "POST" &&
        (
          response.url().endsWith("/api/tenants") ||
          response.url().endsWith("/api/suppliers") ||
          response.url().endsWith("/api/products") ||
          response.url().endsWith("/api/orders/cancel") ||
          response.url().endsWith("/api/orders/update") ||
          response.url().endsWith("/api/orders/close") ||
          response.url().endsWith("/api/orders/reopen") ||
          response.url().endsWith("/api/customers/delete") ||
          response.url().endsWith("/api/suppliers/delete") ||
          response.url().endsWith("/api/product-categories/delete") ||
          response.url().endsWith("/api/products/delete") ||
          response.url().endsWith("/api/purchase-orders/cancel") ||
          response.url().endsWith("/api/purchase-orders/update") ||
          response.url().endsWith("/api/purchase-orders/close") ||
          response.url().endsWith("/api/purchase-orders/reopen") ||
          response.url().endsWith("/api/purchase-orders/receipts") ||
          response.url().endsWith("/api/invoices") ||
          response.url().endsWith("/api/invoices/amend") ||
          response.url().endsWith("/api/invoices/credit") ||
          response.url().endsWith("/api/invoices/payments") ||
          response.url().endsWith("/api/invoices/collections") ||
          response.url().endsWith("/api/invoices/return-authorizations") ||
          response.url().endsWith("/api/invoices/return-authorizations/update") ||
          response.url().endsWith("/api/invoices/return-authorizations/reopen") ||
          response.url().endsWith("/api/invoices/return-receipts") ||
          response.url().endsWith("/api/invoices/void") ||
          response.url().endsWith("/api/invoices/reopen")
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

async function assertImageLoadedInScope(scope, expectedSrc, message) {
  const visual = scope.locator("[data-testid='product-visual']").first();
  await visual.waitFor({ timeout: 15000 });
  const image = visual.locator("img").first();
  await image.waitFor({ timeout: 15000 });
  const imageState = await image.evaluate((element) => ({
    src: element.getAttribute("src") ?? "",
    complete: element.complete,
    naturalWidth: element.naturalWidth,
  }));

  assert(
    imageState.src.includes(expectedSrc),
    `${message} Expected "${expectedSrc}" but saw "${imageState.src || "no src"}".`,
  );
  assert(
    imageState.complete && imageState.naturalWidth > 0,
    `${message} The product image did not finish loading.`,
  );
}

async function openApp(page) {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "load" });
}

async function openDirectRoute(page, routePath) {
  await page.goto(`${baseUrl}${routePath}`, { waitUntil: "load" });
  await page.waitForURL(new RegExp(`${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), {
    timeout: 15000,
  });
  await page.locator("#root").waitFor({ timeout: 30000 });
  await page.waitForFunction(() => Boolean(document.body?.textContent?.trim().length), undefined, {
    timeout: 30000,
  });
}

async function openSection(page, index, expectedPath) {
  const menuItem = page.locator(".ant-layout-sider .ant-menu-item").nth(index);
  const expectedUrlPattern = new RegExp(`${expectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
  await menuItem.waitFor({ timeout: 15000 });
  await menuItem.scrollIntoViewIfNeeded();
  const link = menuItem.locator("a");

  try {
    if ((await link.count()) > 0) {
      await link.first().click();
    } else {
      await menuItem.click();
    }

    await page.waitForURL(expectedUrlPattern, { timeout: 5000 });
  } catch {
    await page.goto(`${baseUrl}${expectedPath}`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(expectedUrlPattern, { timeout: 15000 });
  }

  await page.waitForLoadState("networkidle");
  await page.locator(".page-stack").waitFor({ timeout: 15000 });
}

function getFormCard(page) {
  return page.locator(".two-column .ant-card").first();
}

function getListCard(page) {
  return page.locator(".two-column > .ant-card").last();
}

function getInvoiceRowByNumber(page, invoiceNumber) {
  return getListCard(page)
    .locator(".record-row")
    .filter({ has: page.locator("strong", { hasText: invoiceNumber }) })
    .first();
}

async function fillField(container, selector, value) {
  const input = container.locator(selector);
  await input.click();
  await input.fill("");
  await input.fill(String(value));
}

async function setLargeFieldValue(container, selector, value) {
  const input = container.locator(selector);
  const normalizedValue = String(value);
  await input.waitFor({ timeout: 15000 });
  await input.evaluate((element, nextValue) => {
    const prototype = Object.getPrototypeOf(element);
    const valueDescriptor =
      Object.getOwnPropertyDescriptor(prototype, "value") ??
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value") ??
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");

    if (!valueDescriptor?.set) {
      throw new Error("Unable to resolve a native value setter for the large form field.");
    }

    valueDescriptor.set.call(element, "");
    element.dispatchEvent(new Event("input", { bubbles: true }));
    valueDescriptor.set.call(element, nextValue);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, normalizedValue);
  await waitForInputValue(input, normalizedValue);
}

async function fillNumberInput(input, value) {
  const normalizedValue = String(value);
  await input.evaluate((element, nextValue) => {
    const valueDescriptor =
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value") ??
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");

    if (!valueDescriptor?.set) {
      throw new Error("Unable to resolve a native value setter for the numeric field.");
    }

    element.focus();
    valueDescriptor.set.call(element, "");
    element.dispatchEvent(new Event("input", { bubbles: true }));
    valueDescriptor.set.call(element, nextValue);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.blur();
  }, normalizedValue);
  await waitForInputValue(input, normalizedValue);
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
  const option = page.locator(".ant-select-dropdown:visible .ant-select-item-option").filter({ hasText: optionText }).first();
  await option.waitFor({ timeout: 15000 });
  await option.click();
}

async function waitForSelectableOption(page, combobox, optionText, timeout = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    await combobox.click();
    await page.waitForTimeout(100);
    const option = page.locator(".ant-select-dropdown:visible .ant-select-item-option").filter({ hasText: optionText }).first();
    const isVisible = await option.isVisible().catch(() => false);
    await page.keyboard.press("Escape").catch(() => {});

    if (isVisible) {
      return;
    }

    await page.waitForTimeout(150);
  }

  throw new Error(`Option "${optionText}" did not become selectable within ${timeout}ms.`);
}

async function clickSubmit(container) {
  await container.locator("button[type='submit']").first().click();
}

async function waitForLocatorCount(page, locator, expectedCount, timeout = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    if ((await locator.count()) === expectedCount) {
      return;
    }

    await page.waitForTimeout(150);
  }

  throw new Error(`Locator count did not reach ${expectedCount} within ${timeout}ms.`);
}

async function waitForLocatorText(locator, expectedTexts, timeout = 15000) {
  const startedAt = Date.now();
  const normalizedExpectedTexts = Array.isArray(expectedTexts) ? expectedTexts : [expectedTexts];

  while (Date.now() - startedAt < timeout) {
    const text = ((await locator.textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    const matches = normalizedExpectedTexts.every((expectedText) =>
      expectedText instanceof RegExp ? expectedText.test(text) : text.includes(expectedText),
    );

    if (matches) {
      return text;
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw new Error(
    `Locator text did not include expected content within ${timeout}ms: ${normalizedExpectedTexts
      .map((value) => (value instanceof RegExp ? value.toString() : value))
      .join(", ")}.`,
  );
}

async function importDatasetViaTenantOnboarding(page, card, datasetLabel, csvText) {
  await waitForFormReady(card);
  await selectOption(page, card.getByRole("combobox", { name: /\* (Bộ dữ liệu|Dataset)/ }), datasetLabel);
  await fillField(card, "#csvText", csvText);
  const importResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/onboarding/import") &&
      response.request().method() === "POST",
    { timeout: 30000 },
  );
  await clickSubmit(card);
  const importResult = await importResponse;
  const importPayload = await importResult.json().catch(() => null);
  assert(
    importResult.status() === 200,
    `Onboarding import failed for ${datasetLabel}: ${importPayload?.error ?? importResult.status()}.`,
  );
  await card.locator(".ant-alert").waitFor({ timeout: 15000 });
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

async function loginAs(page, email, password) {
  await page.locator('input[autocomplete="email"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.locator('.login-card button[type="submit"]').click();
  await page.waitForURL(/\/dashboard$/, { timeout: 15000 });
  await page.locator(".page-stack").waitFor({ timeout: 15000 });
}

async function logout(page) {
  await page.locator(".header-user").click();
  const logoutMenuItem = page.locator(".ant-dropdown [role='menuitem']").first();
  await logoutMenuItem.waitFor({ timeout: 15000 });
  await Promise.all([
    page.waitForURL(/\/login$/, { timeout: 30000, waitUntil: "domcontentloaded" }),
    logoutMenuItem.click(),
  ]);
  await page.locator(".login-card").waitFor({ timeout: 30000 });
}

async function clickLanguageToggle(page, value) {
  await page.locator(".header-language").getByText(value, { exact: true }).click();
  await waitForStoredValue(page, languageStorageKey, value.toLowerCase());
}

async function findInvoiceNumberByOrderNumber(page, orderNumber) {
  const renderedRow = getListCard(page).locator(".record-row").filter({ hasText: orderNumber }).first();
  const renderedStrongTexts = await renderedRow.locator("strong").allTextContents();
  const renderedInvoiceNumber =
    renderedStrongTexts
      .map((value) => value.trim())
      .find((value) => value.length > 0 && value !== orderNumber) ?? "";

  if (renderedInvoiceNumber) {
    return renderedInvoiceNumber;
  }

  return page.evaluate(
    async ({ targetOrderNumber, sessionKey, tenantKey }) => {
      const rawSession = window.localStorage.getItem(sessionKey);
      const tenantId = window.localStorage.getItem(tenantKey);
      const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";

      if (!tenantId || !accessToken) {
        return "";
      }

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch(`/api/invoices?tenantId=${encodeURIComponent(tenantId)}`, {
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          });

          const payload = await response.json();
          const targetInvoice = payload.items.find((item) => item.orderNumber === targetOrderNumber);
          if (targetInvoice?.invoiceNumber) {
            return targetInvoice.invoiceNumber;
          }
        } catch {
          // Retry once when the browser fetch races with navigation or server warmup.
        }

        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }

      return "";
    },
    {
      targetOrderNumber: orderNumber,
      sessionKey: sessionStorageKey,
      tenantKey: tenantStorageKey,
    },
  );
}

async function waitForTenantContext(page, expectedTenantName) {
  await page.locator(".page-stack").waitFor({ timeout: 30000 });
  await page.waitForFunction(
    ({ tenantName }) => {
      return Boolean(document.body?.textContent?.includes(tenantName));
    },
    { tenantName: expectedTenantName },
    { timeout: 30000 },
  );
}

async function verifyRoleOnboardingCard(page, role, expectedTexts) {
  const card = page.getByTestId("role-onboarding-card");
  await card.waitFor({ timeout: 15000 });
  await page.getByTestId(`role-onboarding-${role}`).waitFor({ timeout: 15000 });

  for (const text of expectedTexts) {
    await card.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });
  }
}

async function dismissAlertIfVisible(page, selector) {
  const alerts = page.locator(selector);
  if ((await alerts.count()) === 0) {
    return;
  }

  const alert = alerts.first();
  const isVisible = await alert.isVisible().catch(() => false);
  if (!isVisible) {
    return;
  }

  const closeButton = alert.locator(".ant-alert-close-icon");
  if ((await closeButton.count()) === 0) {
    return;
  }

  await closeButton.first().click();
  await alert.waitFor({ state: "hidden", timeout: 15000 });
}

async function dismissGlobalAlerts(page) {
  await dismissAlertIfVisible(page, ".global-alert-notice .ant-alert");
  await dismissAlertIfVisible(page, ".global-alert-error .ant-alert");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getStatisticValue(page, title) {
  return page
    .locator(".ant-statistic")
    .filter({ hasText: title })
    .locator(".ant-statistic-content-value");
}

async function waitForStatisticValue(page, title, expected, timeout = 30000) {
  const titlePattern = title instanceof RegExp ? title : new RegExp(escapeRegExp(title), "i");
  const metricCandidates = [
    getStatisticValue(page, titlePattern),
    page.locator(".workspace-hero-metric").filter({ hasText: titlePattern }).locator("strong"),
    page
      .locator(".workspace-summary-card")
      .filter({ hasText: titlePattern })
      .locator(".workspace-summary-card-value"),
    page.locator(".workspace-summary-list-row").filter({ hasText: titlePattern }).locator("strong"),
  ];
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    for (const candidate of metricCandidates) {
      const textValues = (await candidate.allTextContents()).map((value) =>
        value.replace(/\s+/g, " ").trim(),
      );

      if (
        textValues.some((text) =>
          typeof expected === "string" ? text === expected : expected.test(text),
        )
      ) {
        return;
      }
    }

    await page.waitForTimeout(150);
  }

  throw new Error(`Statistic "${String(title)}" did not reach the expected value within ${timeout}ms.`);
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

    if (
      isExpectedUnauthorizedConsoleMessage(text) ||
      isExpectedBadRequestConsoleMessage(text) ||
      isExpectedForbiddenConsoleMessage(text)
    ) {
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
  let initialInvoiceNumber = "";
  let invoiceNumber = "";
  let secondOrderNumber = "";
  let secondInvoiceNumber = "";
  let secondReturnCaseNumber = "";
  let creditedOrderNumber = "";
  let creditedInvoiceNumber = "";
  let creditedReturnCaseNumber = "";
  let founderReturnOrderNumber = "";
  let founderReturnInvoiceNumber = "";
  let founderReturnCaseNumber = "";
  let partialCreditOrderNumber = "";
  let partialCreditInvoiceNumber = "";
  let voidedOrderNumber = "";
  let voidedInvoiceNumber = "";
  let reissuedInvoiceNumber = "";
  let purchaseOrderNumber = "";
  let invalidLoginVerified = false;
  let staleSessionRejectedVerified = false;
  let localeReloadVerified = false;
  let duplicateTenantRejectedVerified = false;
  let setupWorkspaceVerified = false;
  let pilotHandoffPackageVerified = false;
  let pilotHandoffTransactionSummaryVerified = false;
  let onboardingImportVerified = false;
  let onboardingExportVerified = false;
  let baselineRestorePreviewVerified = false;
  let baselineRestoreTransactionReplayVerified = false;
  let baselineRestoreControlReplayVerified = false;
  let baselineRestoreVerified = false;
  let recoveryDrillVerified = false;
  let recoveryDrillTransactionReplayVerified = false;
  let recoveryDrillControlReplayVerified = false;
  let customerCrudVerified = false;
  let supplierCrudVerified = false;
  let productCategoryCrudVerified = false;
  let productCrudVerified = false;
  let productImageVerified = false;
  let purchaseOrderImageVerified = false;
  let inventoryImageVerified = false;
  let orderImageVerified = false;
  let invoiceImageVerified = false;
  let customerDeleteGuardVerified = false;
  let supplierDeleteGuardVerified = false;
  let productCategoryDeleteGuardVerified = false;
  let productDeleteGuardVerified = false;
  let duplicateSupplierRejectedVerified = false;
  let duplicateProductRejectedVerified = false;
  let orderEditVerified = false;
  let orderEditGuardVerified = false;
  let orderCancellationVerified = false;
  let orderCancelGuardVerified = false;
  let canceledOrderInvoiceGuardVerified = false;
  let supplierAndPurchaseOrdersVerified = false;
  let purchaseOrderEditVerified = false;
  let purchaseOrderEditGuardVerified = false;
  let purchaseOrderCancellationVerified = false;
  let purchaseOrderCancelGuardVerified = false;
  let purchaseOrderCloseVerified = false;
  let purchaseOrderCloseGuardVerified = false;
  let purchaseOrderReopenVerified = false;
  let purchaseOrderReopenGuardVerified = false;
  let canceledPurchaseOrderReceiptGuardVerified = false;
  let purchaseReceiptApprovalVerified = false;
  let purchaseReceiptVerified = false;
  let purchaseReceiptGuardVerified = false;
  let purchaseOrderCategoryFlowVerified = false;
  let inventoryAdjustmentRejectionVerified = false;
  let inventoryValuationVerified = false;
  let inventoryCategoryFlowVerified = false;
  let invoicePaymentApprovalVerified = false;
  let paymentGuardVerified = false;
  let partialSettlementVerified = false;
  let finalSettlementVerified = false;
  let orderCloseVerified = false;
  let orderCloseGuardVerified = false;
  let orderReopenVerified = false;
  let orderReopenGuardVerified = false;
  let orderCategoryFlowVerified = false;
  let invoiceVoidVerified = false;
  let invoiceAmendGuardVerified = false;
  let invoiceAmendVerified = false;
  let invoiceAmendAuditVerified = false;
  let invoiceReissueVerified = false;
  let invoiceReissueLineageVerified = false;
  let invoiceRevisionLineageVerified = false;
  let invoiceAmendmentNoteGuardVerified = false;
  let invoiceAmendmentNoteUiVerified = false;
  let invoiceAmendmentNoteAuditVerified = false;
  let invoiceReopenVerified = false;
  let invoiceCreditGuardVerified = false;
  let invoiceCreditVerified = false;
  let invoiceCreditAuditVerified = false;
  let invoiceCreditApprovalVerified = false;
  let invoiceCreditInventoryRestockVerified = false;
  let invoiceCreditReceivedReturnGuardVerified = false;
  let invoiceReturnAuthorizationVerified = false;
  let invoiceReturnAuthorizationAuditVerified = false;
  let invoiceReturnCaseQueueVerified = false;
  let invoiceReturnCaseActionOwnerVerified = false;
  let invoiceReturnCaseNumberVerified = false;
  let invoiceReturnCaseFilterVerified = false;
  let invoiceReturnCaseAmendVerified = false;
  let invoiceReturnCaseAmendGuardVerified = false;
  let invoiceReturnCaseAmendAuditVerified = false;
  let invoiceReturnCaseCloseVerified = false;
  let invoiceReturnCaseCloseAuditVerified = false;
  let invoiceReturnCaseReopenVerified = false;
  let invoiceReturnCaseReopenGuardVerified = false;
  let invoiceReturnCaseReopenAuditVerified = false;
  let invoiceReturnCaseSettledVerified = false;
  let invoiceReturnCaseFounderApprovalVerified = false;
  let invoiceReturnCaseSettlementAuditVerified = false;
  let invoiceReturnReceiptAuthorizationGuardVerified = false;
  let invoiceReturnReceiptClosedCaseGuardVerified = false;
  let invoiceReturnReceiptVerified = false;
  let partialInvoiceCreditVerified = false;
  let partialInvoiceCreditAuditVerified = false;
  let partialInvoiceCreditNoRestockVerified = false;
  let partialInvoiceCreditReportVerified = false;
  let partialInvoiceCreditOrderStateVerified = false;
  let partialInvoiceCreditCollectionGuardVerified = false;
  let partialInvoiceReturnReceiptSuppressedVerified = false;
  let creditedOrderReturnedVerified = false;
  let creditedOrderReturnAuditVerified = false;
  let creditedOrderExcludedFromSalesVerified = false;
  let creditedOrderCancelGuardVerified = false;
  let creditedOrderCloseGuardVerified = false;
  let invoiceReopenGuardVerified = false;
  let invoiceReopenRevisionGuardVerified = false;
  let invoiceReopenAuditVerified = false;
  let invoiceReissueAuditVerified = false;
  let invoiceCategoryContextVerified = false;
  let reissuedInvoiceVoidVerified = false;
  let voidedInvoicePaymentGuardVerified = false;
  let voidedInvoiceCollectionGuardVerified = false;
  let creditedInvoicePaymentGuardVerified = false;
  let creditedInvoiceCollectionGuardVerified = false;
  let reopenedInvoiceOrderCancellationGuardVerified = false;
  let voidedInvoiceOrderCancellationVerified = false;
  let backdatedInvoiceApprovalVerified = false;
  let collectionFollowUpVerified = false;
  let collectionHistoryVerified = false;
  let collectionWorklistVerified = false;
  let collectionResolutionVerified = false;
  let ledgerPostingVerified = false;
  let auditTrailVerified = false;
  let operationsStatusVerified = false;
  let operationsReadinessVerified = false;
  let operationsBuildVerified = false;
  let loginRoleHintsVerified = false;
  let financeRoleOnboardingVerified = false;
  let pilotHandoffReturnAuthorizationSummaryVerified = false;
  let exportedInvoiceReturnAuthorizationsVerified = false;
  let exportedInvoiceReturnReceiptsVerified = false;
  let unauthorizedApiBlockedVerified = false;
  let baselineRestoreReturnAuthorizationScopeVerified = false;
  let rbacSalesVisibilityVerified = false;
  let salesRoleOnboardingVerified = false;
  let rbacSalesBlockedRouteVerified = false;
  let rbacSalesBlockedRestorePreviewVerified = false;
  let rbacWarehouseBlockedMutationVerified = false;
  let warehouseRoleOnboardingVerified = false;
  let rbacCollectorActionSplitVerified = false;
  let collectorRoleOnboardingVerified = false;
  let reportCategoryPerformanceVerified = false;
  let approvalCategoryContextVerified = false;
  let auditCategoryContextVerified = false;
  let recoveryDrillReturnAuthorizationScopeVerified = false;

  try {
    await openApp(page);
    await page.waitForURL(/\/login$/, { timeout: 15000 });
    await page.getByTestId("login-role-card-finance").getByText("Hóa đơn", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByTestId("login-role-card-sales").getByText("Khách hàng", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByTestId("login-role-card-collector").getByText("Báo cáo", { exact: false }).first().waitFor({ timeout: 15000 });
    loginRoleHintsVerified = true;
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
          modules: [
            "identity",
            "tenant",
            "customers",
            "suppliers",
            "products",
            "purchasing",
            "orders",
            "inventory",
            "invoices",
            "reporting",
            "approvals",
            "operations",
          ],
          permissions: [
            "manage_tenants",
            "manage_customers",
            "manage_suppliers",
            "manage_products",
            "manage_purchase_orders",
            "receive_purchase_orders",
            "manage_inventory",
            "manage_orders",
            "issue_invoices",
            "record_invoice_payments",
            "manage_collections",
            "view_reports",
            "decide_approvals",
            "view_operations",
          ],
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
    await page.waitForURL(/\/dashboard$/, { timeout: 15000 });
    await page.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: 15000 });
    assert((await page.evaluate((key) => window.localStorage.getItem(key), languageStorageKey)) === "en", "Language did not persist as English after reload.");
    localeReloadVerified = true;
    await clickLanguageToggle(page, "VI");
    await page.getByRole("heading", { name: "Bảng điều khiển" }).waitFor({ timeout: 15000 });
    await page.locator(".ant-layout-sider").waitFor({ timeout: 15000 });
    await page.locator(".page-stack").waitFor({ timeout: 15000 });

    await openSection(page, sidebarIndexes.setup, "/dashboard/setup");
    await page.getByRole("heading", { name: "Khởi tạo" }).waitFor({ timeout: 15000 });
    await page.getByText("Checklist khởi tạo pilot", { exact: false }).waitFor({ timeout: 15000 });
    const setupCreateTenantCard = page.getByTestId("setup-create-tenant-card");
    await fillField(setupCreateTenantCard, "#name", tenantName);
    await fillField(setupCreateTenantCard, "#slug", tenantSlug);
    await fillField(setupCreateTenantCard, "#industry", "Smoke QA");
    await clickSubmit(setupCreateTenantCard);
    await setupCreateTenantCard.getByText(tenantName, { exact: false }).waitFor({ timeout: 15000 });
    await waitForInputValue(setupCreateTenantCard.locator("#name"), "");
    await waitForInputValue(setupCreateTenantCard.locator("#slug"), "");
    await setupCreateTenantCard
      .getByText("0 khách hàng, 0 nhà cung cấp, 0 sản phẩm", { exact: false })
      .waitFor({ timeout: 15000 });
    setupWorkspaceVerified = true;
    await fillField(setupCreateTenantCard, "#name", `${tenantName} Duplicate`);
    await fillField(setupCreateTenantCard, "#slug", tenantSlug);
    await fillField(setupCreateTenantCard, "#industry", "Duplicate Industry");
    const duplicateTenantResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/tenants") &&
        response.request().method() === "POST" &&
        response.status() === 400,
      { timeout: 15000 },
    );
    await clickSubmit(setupCreateTenantCard);
    assert(
      ((await (await duplicateTenantResponse).json())?.error ?? "") === "A tenant with this slug already exists.",
      "Duplicate tenant slug did not return the expected validation message.",
    );
    await dismissGlobalAlerts(page);
    duplicateTenantRejectedVerified = true;

    const onboardingCard = page.getByTestId("setup-onboarding-card");
    await importDatasetViaTenantOnboarding(page, onboardingCard, "Khách hàng", customerImportCsv);
    await importDatasetViaTenantOnboarding(page, onboardingCard, "Nhà cung cấp", supplierImportCsv);
    await importDatasetViaTenantOnboarding(page, onboardingCard, "Sản phẩm", productImportCsv);
    await page
      .getByTestId("setup-checklist-items")
      .getByText("Nạp danh mục sản phẩm", { exact: false })
      .waitFor({ timeout: 15000 });
    await setupCreateTenantCard
      .getByText("1 khách hàng, 1 nhà cung cấp, 1 sản phẩm", { exact: false })
      .waitFor({ timeout: 15000 });
    onboardingImportVerified = true;

    await openDirectRoute(page, "/dashboard/customers");
    await waitForTenantContext(page, tenantName);
    const customersListCard = getListCard(page);
    const customersFormCard = getFormCard(page);
    await customersListCard.getByText(customerName, { exact: false }).waitFor({ timeout: 15000 });
    await customersListCard.getByText(customerEmail, { exact: false }).waitFor({ timeout: 15000 });
    await waitForFormReady(customersFormCard);
    await fillField(customersFormCard, "#name", editableCustomerName);
    await fillField(customersFormCard, "#email", editableCustomerEmail);
    await fillField(customersFormCard, "#phone", editableCustomerPhone);
    await fillField(customersFormCard, "#city", editableCustomerCity);
    await clickSubmit(customersFormCard);
    const editableCustomerRow = customersListCard.locator(".record-row").filter({ hasText: editableCustomerName }).first();
    await editableCustomerRow.waitFor({ timeout: 15000 });
    await editableCustomerRow.locator('[data-testid="customer-edit-button"]').click();
    await waitForFormReady(customersFormCard);
    await fillField(customersFormCard, "#name", editedCustomerName);
    await fillField(customersFormCard, "#email", editedCustomerEmail);
    await fillField(customersFormCard, "#phone", editedCustomerPhone);
    await fillField(customersFormCard, "#city", editedCustomerCity);
    await clickSubmit(customersFormCard);
    const editedCustomerRow = customersListCard.locator(".record-row").filter({ hasText: editedCustomerName }).first();
    await editedCustomerRow.waitFor({ timeout: 15000 });
    await editedCustomerRow.getByText(editedCustomerEmail, { exact: false }).waitFor({ timeout: 15000 });
    await editedCustomerRow.locator('[data-testid="customer-delete-button"]').click();
    await page.locator(".ant-popover .ant-btn-primary").click();
    await waitForLocatorCount(page, customersListCard.locator(".record-row").filter({ hasText: editedCustomerName }), 0);
    customerCrudVerified = true;

    await openSection(page, sidebarIndexes.suppliers, "/dashboard/suppliers");
    await waitForTenantContext(page, tenantName);
    const suppliersListCard = getListCard(page);
    const suppliersFormCard = getFormCard(page);
    await suppliersListCard.getByText(supplierName, { exact: false }).waitFor({ timeout: 15000 });
    await suppliersListCard.getByText(supplierCode, { exact: false }).waitFor({ timeout: 15000 });
    await waitForFormReady(suppliersFormCard);
    await fillField(suppliersFormCard, "#supplierCode", editableSupplierCode);
    await fillField(suppliersFormCard, "#name", editableSupplierName);
    await fillField(suppliersFormCard, "#email", editableSupplierEmail);
    await fillField(suppliersFormCard, "#phone", editableSupplierPhone);
    await fillField(suppliersFormCard, "#city", editableSupplierCity);
    await fillField(suppliersFormCard, "#leadTimeDays", 5);
    await clickSubmit(suppliersFormCard);
    const editableSupplierRow = suppliersListCard.locator(".record-row").filter({ hasText: editableSupplierName }).first();
    await editableSupplierRow.waitFor({ timeout: 15000 });
    await editableSupplierRow.locator('[data-testid="supplier-edit-button"]').click();
    await waitForFormReady(suppliersFormCard);
    await fillField(suppliersFormCard, "#supplierCode", editedSupplierCode);
    await fillField(suppliersFormCard, "#name", editedSupplierName);
    await fillField(suppliersFormCard, "#email", editedSupplierEmail);
    await fillField(suppliersFormCard, "#phone", editedSupplierPhone);
    await fillField(suppliersFormCard, "#city", editedSupplierCity);
    await fillField(suppliersFormCard, "#leadTimeDays", 9);
    const supplierUpdateResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/suppliers/update") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await clickSubmit(suppliersFormCard);
    await supplierUpdateResponse;
    const editedSupplierRow = suppliersListCard.locator(".record-row").filter({ hasText: editedSupplierName }).first();
    await editedSupplierRow.waitFor({ timeout: 15000 });
    await editedSupplierRow.getByText(editedSupplierCode, { exact: false }).waitFor({ timeout: 15000 });
    await editedSupplierRow.locator('[data-testid="supplier-delete-button"]').click();
    await page.locator(".ant-popover .ant-btn-primary").click();
    await waitForLocatorCount(page, suppliersListCard.locator(".record-row").filter({ hasText: editedSupplierName }), 0);
    supplierCrudVerified = true;
    const duplicateSupplierResponse = await page.evaluate(
      async ({ duplicateCode, duplicateName, duplicateEmail, sessionKey, tenantKey }) => {
        const tenantId = window.localStorage.getItem(tenantKey);
        const session = window.localStorage.getItem(sessionKey);
        const accessToken = session ? JSON.parse(session).accessToken : "";

        const response = await fetch("/api/suppliers", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            tenantId,
            supplierCode: duplicateCode,
            name: duplicateName,
            email: duplicateEmail,
            phone: "",
            city: "",
            leadTimeDays: 5,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        duplicateCode: supplierCode,
        duplicateName: `${supplierName} Duplicate`,
        duplicateEmail: `duplicate.${smokeId}@example.com`,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      duplicateSupplierResponse.status === 400 &&
        (duplicateSupplierResponse.body?.error ?? "") ===
        "A supplier with this code already exists for the selected tenant.",
      "Duplicate supplier code did not return the expected validation message.",
    );
    duplicateSupplierRejectedVerified = true;

    await openSection(page, sidebarIndexes.products, "/dashboard/products");
    await waitForTenantContext(page, tenantName);
    const productsListCard = page.getByTestId("product-list-card");
    const productsFormCard = page.getByTestId("product-form-card");
    const productCategoriesCard = page.getByTestId("product-categories-card");
    const importedProductRow = productsListCard.locator(".record-row").filter({ hasText: productName }).first();
    await importedProductRow.waitFor({ timeout: 15000 });
    const importedProductRowText = (await importedProductRow.textContent()) ?? "";
    assert(
      importedProductRowText.includes(productSku),
      "Imported product row did not include the expected SKU.",
    );
    assert(
      importedProductRowText.includes(productCategoryName),
      "Imported product row did not include the expected category name.",
    );
    await assertImageLoadedInScope(
      importedProductRow,
      productImageUrl,
      "Imported product row did not render the product image.",
    );
    const importedProductLookup = await page.evaluate(
      async ({ targetProductName, sessionKey, tenantKey }) => {
        const tenantId = window.localStorage.getItem(tenantKey);
        const session = window.localStorage.getItem(sessionKey);
        const accessToken = session ? JSON.parse(session).accessToken : "";
        const response = await fetch(`/api/products?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = await response.json();
        const product = payload.items.find((item) => item.name === targetProductName);

        return {
          status: response.status,
          item: product ?? null,
        };
      },
      {
        targetProductName: productName,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      importedProductLookup.status === 200 && importedProductLookup.item?.imageUrl === productImageUrl,
      "Imported product did not persist the expected image URL.",
    );
    productImageVerified = true;
    await waitForFormReady(productCategoriesCard);
    await fillField(productCategoriesCard, "#name", editableProductCategoryName);
    await clickSubmit(productCategoriesCard);
    const editableCategoryRow = productCategoriesCard
      .locator(".compact-record-row")
      .filter({ hasText: editableProductCategoryName })
      .first();
    await editableCategoryRow.waitFor({ timeout: 15000 });
    await editableCategoryRow.locator('[data-testid="product-category-edit-button"]').click();
    await waitForFormReady(productCategoriesCard);
    await fillField(productCategoriesCard, "#name", editedProductCategoryName);
    await clickSubmit(productCategoriesCard);
    const editedCategoryRow = productCategoriesCard
      .locator(".compact-record-row")
      .filter({ hasText: editedProductCategoryName })
      .first();
    await editedCategoryRow.waitFor({ timeout: 15000 });
    await editedCategoryRow.getByText(/0 .*phẩm|0 product/, { exact: false }).waitFor({ timeout: 15000 });
    await waitForFormReady(productsFormCard);
    await selectOption(
      page,
      productsFormCard.getByRole("combobox", { name: /Danh mục|Category/ }),
      editedProductCategoryName,
    );
    await fillField(productsFormCard, "#name", editableProductName);
    await fillField(productsFormCard, "#unitPrice", editableProductUnitPrice);
    await clickSubmit(productsFormCard);
    const editableProductRow = productsListCard.locator(".record-row").filter({ hasText: editableProductName }).first();
    await editableProductRow.waitFor({ timeout: 15000 });
    const editableProductLookup = await page.evaluate(
      async ({ targetProductName, sessionKey, tenantKey }) => {
        const tenantId = window.localStorage.getItem(tenantKey);
        const session = window.localStorage.getItem(sessionKey);
        const accessToken = session ? JSON.parse(session).accessToken : "";
        const response = await fetch(`/api/products?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = await response.json();
        const product = payload.items.find((item) => item.name === targetProductName);

        return {
          status: response.status,
          item: product ?? null,
        };
      },
      {
        targetProductName: editableProductName,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      editableProductLookup.status === 200 &&
        editableProductLookup.item?.sku &&
        /^[A-Z0-9]{3,4}-\d{4}$/.test(editableProductLookup.item.sku) &&
        editableProductLookup.item.categoryName === editedProductCategoryName,
      "Product creation did not generate a valid SKU inside the selected category.",
    );
    const editableGeneratedProductSku = editableProductLookup.item.sku;
    assert(
      ((await editableProductRow.textContent()) ?? "").includes(editableGeneratedProductSku),
      "Editable product row did not render the generated SKU.",
    );
    await editableProductRow.locator('[data-testid="product-edit-button"]').click();
    await waitForFormReady(productsFormCard);
    await fillField(productsFormCard, "#sku", "");
    await fillField(productsFormCard, "#name", editedProductName);
    await fillField(productsFormCard, "#unitPrice", editedProductUnitPrice);
    await clickSubmit(productsFormCard);
    const editedProductRow = productsListCard.locator(".record-row").filter({ hasText: editedProductName }).first();
    await editedProductRow.waitFor({ timeout: 15000 });
    assert(
      ((await editedProductRow.textContent()) ?? "").includes(editableGeneratedProductSku),
      "Edited product row did not preserve the generated SKU when SKU input stayed blank.",
    );
    await editedProductRow.locator('[data-testid="product-delete-button"]').click();
    await page.locator(".ant-popover .ant-btn-primary").click();
    await waitForLocatorCount(page, productsListCard.locator(".record-row").filter({ hasText: editedProductName }), 0);
    await editedCategoryRow.locator('[data-testid="product-category-delete-button"]').click();
    await page.locator(".ant-popover .ant-btn-primary").click();
    await waitForLocatorCount(
      page,
      productCategoriesCard.locator(".compact-record-row").filter({ hasText: editedProductCategoryName }),
      0,
    );
    productCategoryCrudVerified = true;
    productCrudVerified = true;
    const duplicateProductResponse = await page.evaluate(
      async ({ categoryName, duplicateSku, duplicateName, duplicateUnitPrice, sessionKey, tenantKey }) => {
        const tenantId = window.localStorage.getItem(tenantKey);
        const session = window.localStorage.getItem(sessionKey);
        const accessToken = session ? JSON.parse(session).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const categoriesResponse = await fetch(
          `/api/product-categories?tenantId=${encodeURIComponent(tenantId ?? "")}`,
          { headers: { authorization: `Bearer ${accessToken}` } },
        );
        const categoriesPayload = await categoriesResponse.json();
        const category = categoriesPayload.items.find((item) => item.name === categoryName);

        const response = await fetch("/api/products", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            categoryId: category?.id ?? "",
            sku: duplicateSku,
            name: duplicateName,
            unitPrice: duplicateUnitPrice,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        categoryName: productCategoryName,
        duplicateSku: productSku,
        duplicateName: `${productName} Duplicate`,
        duplicateUnitPrice: unitPrice + 1000,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      duplicateProductResponse.status === 400 &&
        (duplicateProductResponse.body?.error ?? "") ===
        "A product with this SKU already exists for the selected tenant.",
      "Duplicate product SKU did not return the expected validation message.",
    );
    duplicateProductRejectedVerified = true;

    await openSection(page, sidebarIndexes.purchaseOrders, "/dashboard/purchase-orders");
    await waitForTenantContext(page, tenantName);
    const purchaseOrdersCreateCard = page.locator(".two-column > :first-child .ant-card").nth(0);
    const purchaseOrdersReceiveCard = page.locator(".two-column > :first-child .ant-card").nth(1);
    await waitForFormReady(purchaseOrdersCreateCard);
    await selectOption(page, purchaseOrdersCreateCard.getByRole("combobox", { name: /Nhà cung cấp|Nha cung cap/ }), supplierName);
    await selectOption(page, purchaseOrdersCreateCard.getByRole("combobox", { name: /Sản phẩm|San pham/ }), productName);
    await fillField(purchaseOrdersCreateCard, "#quantityOrdered", cancelablePurchaseQuantity);
    await fillField(purchaseOrdersCreateCard, "#unitCost", purchaseUnitCost);
    await fillField(purchaseOrdersCreateCard, "#expectedReceiptDate", expectedReceiptDateInput);
    await clickSubmit(purchaseOrdersCreateCard);
    const cancelablePurchaseOrderRow = getListCard(page)
      .locator(".record-row")
      .filter({ hasText: `${supplierName} (${supplierCode})` })
      .first();
    await cancelablePurchaseOrderRow.waitFor({ timeout: 15000 });
    await cancelablePurchaseOrderRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    const canceledPurchaseOrderNumber =
      (await cancelablePurchaseOrderRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(
      canceledPurchaseOrderNumber.length > 0,
      "Cancelable purchase order number was not rendered before cancellation.",
    );
    await cancelablePurchaseOrderRow.locator('[data-testid="purchase-order-cancel-button"]').click();
    await page.getByRole("button", { name: /Hủy đơn mua|Huy don mua/ }).last().click();
    await cancelablePurchaseOrderRow.getByText(/Đã hủy|Da huy/).waitFor({ timeout: 15000 });
    const receiptOptionsTextAfterCancel = await purchaseOrdersReceiveCard.textContent();
    assert(
      !receiptOptionsTextAfterCancel?.includes(canceledPurchaseOrderNumber),
      "Canceled purchase order still appeared inside the receiving card.",
    );
    purchaseOrderCancellationVerified = true;
    const canceledPurchaseOrderReceiptResponse = await page.evaluate(
      async ({ purchaseOrderNumberToReceive, quantity, sessionKey, tenantKey, receivedDate }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const purchaseOrdersResponse = await fetch(
          `/api/purchase-orders?tenantId=${encodeURIComponent(tenantId ?? "")}`,
          { headers },
        );
        const purchaseOrdersPayload = await purchaseOrdersResponse.json();
        const targetPurchaseOrder = purchaseOrdersPayload.items.find(
          (item) => item.purchaseOrderNumber === purchaseOrderNumberToReceive,
        );

        if (!targetPurchaseOrder || !tenantId) {
          return { status: 0, body: { error: "Canceled purchase order lookup failed before receipt test." } };
        }

        const response = await fetch("/api/purchase-orders/receipts", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            purchaseOrderId: targetPurchaseOrder.id,
            quantityReceived: quantity,
            receivedDate,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        purchaseOrderNumberToReceive: canceledPurchaseOrderNumber,
        quantity: 1,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        receivedDate: firstIssueDateInput,
      },
    );
    assert(
      canceledPurchaseOrderReceiptResponse.status === 400 &&
        canceledPurchaseOrderReceiptResponse.body?.error === "The selected purchase order has been canceled.",
      "Canceled purchase order still accepted a receipt.",
    );
    canceledPurchaseOrderReceiptGuardVerified = true;

    await waitForFormReady(purchaseOrdersCreateCard);
    await selectOption(page, purchaseOrdersCreateCard.getByRole("combobox", { name: /Nhà cung cấp|Nha cung cap/ }), supplierName);
    await selectOption(page, purchaseOrdersCreateCard.getByRole("combobox", { name: /Sản phẩm|San pham/ }), productName);
    await fillField(purchaseOrdersCreateCard, "#quantityOrdered", purchaseQuantity);
    await fillField(purchaseOrdersCreateCard, "#unitCost", purchaseUnitCost);
    await fillField(purchaseOrdersCreateCard, "#expectedReceiptDate", expectedReceiptDateInput);
    await clickSubmit(purchaseOrdersCreateCard);
    let purchaseOrderRow = getListCard(page).locator(".record-row").filter({ hasText: supplierName }).first();
    await purchaseOrderRow.waitFor({ timeout: 15000 });
    await purchaseOrderRow.getByText(productName, { exact: false }).waitFor({ timeout: 15000 });
    await purchaseOrderRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    await purchaseOrderRow.getByText(buildAmountPattern(initialPurchaseOrderAmount)).first().waitFor({ timeout: 15000 });
    await purchaseOrderRow.getByText(/Đã lập|Da lap/).waitFor({ timeout: 15000 });
    purchaseOrderNumber = (await purchaseOrderRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(purchaseOrderNumber.length > 0, "Purchase order number was not rendered after purchase order creation.");
    purchaseOrderRow = getListCard(page).locator(".record-row").filter({ hasText: purchaseOrderNumber }).first();
    supplierAndPurchaseOrdersVerified = true;
    purchaseOrderCategoryFlowVerified = true;
    await assertImageLoadedInScope(
      purchaseOrderRow,
      productImageUrl,
      "Purchase order row did not render the product image.",
    );
    purchaseOrderImageVerified = true;
    await purchaseOrderRow.locator('[data-testid="purchase-order-edit-button"]').click();
    await fillField(purchaseOrdersCreateCard, "#quantityOrdered", editedPurchaseQuantity);
    await fillField(purchaseOrdersCreateCard, "#expectedReceiptDate", editedExpectedReceiptDateInput);
    await clickSubmit(purchaseOrdersCreateCard);
    await purchaseOrderRow.getByText(/Đã đặt: 26|Da dat: 26/).waitFor({ timeout: 15000 });
    await purchaseOrderRow.getByText(/Còn lại: 26|Con lai: 26/).waitFor({ timeout: 15000 });
    purchaseOrderEditVerified = true;

    await waitForFormReady(purchaseOrdersReceiveCard);
    await selectOption(page, purchaseOrdersReceiveCard.getByRole("combobox", { name: /Đơn mua|Don mua/ }), purchaseOrderNumber);
    await fillField(purchaseOrdersReceiveCard, "#quantityReceived", stockInQuantity);
    await fillField(purchaseOrdersReceiveCard, "#receivedDate", firstIssueDateInput);
    await clickSubmit(purchaseOrdersReceiveCard);
    await purchaseOrderRow.getByText(/Đã lập|Da lap/).waitFor({ timeout: 15000 });
    await purchaseOrderRow.getByText(/Đã nhận: 0|Da nhan: 0/).waitFor({ timeout: 15000 });
    await purchaseOrderRow.getByText(/Còn lại: 26|Con lai: 26/).waitFor({ timeout: 15000 });
    await openSection(page, sidebarIndexes.approvals, "/dashboard/approvals");
    await waitForTenantContext(page, tenantName);
    const approvalsPendingCard = page.locator(".two-column .ant-card").first();
    const approvalsHistoryCard = page.locator(".two-column .ant-card").last();
    const purchaseReceiptApprovalRow = approvalsPendingCard
      .locator(".activity-row")
      .filter({ hasText: purchaseOrderNumber })
      .first();
    await purchaseReceiptApprovalRow.waitFor({ timeout: 15000 });
    await purchaseReceiptApprovalRow
      .getByText("Large inventory receipt requires founder approval.", { exact: false })
      .waitFor({ timeout: 15000 });
    await purchaseReceiptApprovalRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    const purchaseReceiptApprovalResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/approval-requests/decision") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await purchaseReceiptApprovalRow.getByRole("button", { name: "Duyệt" }).click();
    await purchaseReceiptApprovalResponse;
    await waitForLocatorCount(
      page,
      approvalsPendingCard.locator(".activity-row").filter({ hasText: purchaseOrderNumber }),
      0,
    );
    await approvalsHistoryCard.getByText(purchaseOrderNumber, { exact: false }).first().waitFor({ timeout: 15000 });
    await approvalsHistoryCard.getByText("Đã duyệt", { exact: false }).first().waitFor({ timeout: 15000 });
    purchaseReceiptApprovalVerified = true;
    await dismissGlobalAlerts(page);
    await openSection(page, sidebarIndexes.purchaseOrders, "/dashboard/purchase-orders");
    await waitForTenantContext(page, tenantName);
    await purchaseOrderRow.getByText(/Nhận một phần|Nhan mot phan/).waitFor({ timeout: 15000 });
    await purchaseOrderRow.getByText(/Đã nhận: 12|Da nhan: 12/).waitFor({ timeout: 15000 });
    await purchaseOrderRow.getByText(/Còn lại: 14|Con lai: 14/).waitFor({ timeout: 15000 });
    purchaseReceiptVerified = true;

    const excessiveReceiptResponse = await page.evaluate(
      async ({ purchaseOrderNumberToOverReceive, quantity, sessionKey, tenantKey, receivedDate }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const purchaseOrdersResponse = await fetch(
          `/api/purchase-orders?tenantId=${encodeURIComponent(tenantId ?? "")}`,
          { headers },
        );
        const purchaseOrdersPayload = await purchaseOrdersResponse.json();
        const targetPurchaseOrder = purchaseOrdersPayload.items.find(
          (item) => item.purchaseOrderNumber === purchaseOrderNumberToOverReceive,
        );

        if (!targetPurchaseOrder || !tenantId) {
          return { status: 0, body: { error: "Purchase order lookup failed before receipt guard test." } };
        }

        const response = await fetch("/api/purchase-orders/receipts", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            purchaseOrderId: targetPurchaseOrder.id,
            quantityReceived: quantity,
            receivedDate,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        purchaseOrderNumberToOverReceive: purchaseOrderNumber,
        quantity: editedPurchaseQuantity - stockInQuantity + 1,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        receivedDate: firstIssueDateInput,
      },
    );
    assert(
      excessiveReceiptResponse.status === 400 &&
        excessiveReceiptResponse.body?.error === "Received quantity cannot exceed the outstanding quantity.",
      "Excessive receipt did not return the expected validation message.",
    );
    purchaseReceiptGuardVerified = true;
    const cancelReceivedPurchaseOrderResponse = await page.evaluate(
      async ({ purchaseOrderNumberToCancel, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const purchaseOrdersResponse = await fetch(
          `/api/purchase-orders?tenantId=${encodeURIComponent(tenantId ?? "")}`,
          { headers },
        );
        const purchaseOrdersPayload = await purchaseOrdersResponse.json();
        const targetPurchaseOrder = purchaseOrdersPayload.items.find(
          (item) => item.purchaseOrderNumber === purchaseOrderNumberToCancel,
        );

        if (!targetPurchaseOrder || !tenantId) {
          return { status: 0, body: { error: "Received purchase order lookup failed before cancellation guard test." } };
        }

        const response = await fetch("/api/purchase-orders/cancel", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            purchaseOrderId: targetPurchaseOrder.id,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        purchaseOrderNumberToCancel: purchaseOrderNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      cancelReceivedPurchaseOrderResponse.status === 400 &&
        cancelReceivedPurchaseOrderResponse.body?.error ===
          "The selected purchase order cannot be canceled because receipts already exist.",
      "Received purchase order did not reject cancellation.",
    );
    purchaseOrderCancelGuardVerified = true;
    const receivedPurchaseOrderUpdateResponse = await page.evaluate(
      async ({ purchaseOrderNumberToUpdate, quantityOrdered, sessionKey, tenantKey, expectedReceiptDate }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const purchaseOrdersResponse = await fetch(
          `/api/purchase-orders?tenantId=${encodeURIComponent(tenantId ?? "")}`,
          { headers },
        );
        const purchaseOrdersPayload = await purchaseOrdersResponse.json();
        const targetPurchaseOrder = purchaseOrdersPayload.items.find(
          (item) => item.purchaseOrderNumber === purchaseOrderNumberToUpdate,
        );

        if (!targetPurchaseOrder || !tenantId) {
          return { status: 0, body: { error: "Received purchase order lookup failed before update guard test." } };
        }

        const response = await fetch("/api/purchase-orders/update", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            purchaseOrderId: targetPurchaseOrder.id,
            supplierId: targetPurchaseOrder.supplierId,
            productId: targetPurchaseOrder.productId,
            quantityOrdered,
            unitCost: targetPurchaseOrder.unitCost,
            expectedReceiptDate,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        purchaseOrderNumberToUpdate: purchaseOrderNumber,
        quantityOrdered: editedPurchaseQuantity + 1,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        expectedReceiptDate: editedExpectedReceiptDateInput,
      },
    );
    assert(
      receivedPurchaseOrderUpdateResponse.status === 400 &&
        receivedPurchaseOrderUpdateResponse.body?.error ===
          "The selected purchase order can only be edited while it is still issued.",
      "Received purchase order did not reject editing after receipt.",
    );
    purchaseOrderEditGuardVerified = true;
    await openSection(page, sidebarIndexes.purchaseOrders, "/dashboard/purchase-orders");
    await waitForTenantContext(page, tenantName);
    const purchaseOrderCloseResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/purchase-orders/close") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await purchaseOrderRow.locator('[data-testid="purchase-order-close-button"]').click();
    await page
      .locator(".ant-popconfirm-buttons")
      .last()
      .getByRole("button", { name: /Chốt đơn mua|Close Purchase Order/ })
      .click();
    await purchaseOrderCloseResponse;
    await openSection(page, sidebarIndexes.purchaseOrders, "/dashboard/purchase-orders");
    await waitForTenantContext(page, tenantName);
    await purchaseOrderRow.getByText(/Đã chốt|Closed/).waitFor({ timeout: 15000 });
    const receiptOptionsTextAfterClose = await purchaseOrdersReceiveCard.textContent();
    assert(
      !receiptOptionsTextAfterClose?.includes(purchaseOrderNumber),
      "Closed purchase order still appeared inside the receiving card.",
    );
    purchaseOrderCloseVerified = true;
    const purchaseOrderReopenResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/purchase-orders/reopen") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await purchaseOrderRow.locator('[data-testid="purchase-order-reopen-button"]').click();
    await page
      .locator(".ant-popconfirm-buttons")
      .last()
      .getByRole("button", { name: /Mở lại đơn mua|Reopen Purchase Order/ })
      .click();
    await purchaseOrderReopenResponse;
    await openSection(page, sidebarIndexes.purchaseOrders, "/dashboard/purchase-orders");
    await waitForTenantContext(page, tenantName);
    await purchaseOrderRow.getByText(/Nhận một phần|Partially Received/).waitFor({ timeout: 15000 });
    const purchaseOrdersReceiveCombobox = purchaseOrdersReceiveCard.getByRole("combobox", {
      name: /Đơn mua|Purchase Order/,
    });
    await purchaseOrdersReceiveCombobox.click();
    const visibleReceiveDropdown = page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)").last();
    await visibleReceiveDropdown.waitFor({ timeout: 15000 });
    const reopenedReceiptOption = visibleReceiveDropdown.getByText(purchaseOrderNumber, { exact: false });
    assert(
      (await reopenedReceiptOption.count()) > 0,
      "Reopened purchase order did not return to the receiving card.",
    );
    await page.keyboard.press("Escape");
    purchaseOrderReopenVerified = true;
    const reopenedPurchaseOrderReopenResponse = await page.evaluate(
      async ({ purchaseOrderNumberToReopen, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const purchaseOrdersResponse = await fetch(
          `/api/purchase-orders?tenantId=${encodeURIComponent(tenantId ?? "")}`,
          { headers },
        );
        const purchaseOrdersPayload = await purchaseOrdersResponse.json();
        const targetPurchaseOrder = purchaseOrdersPayload.items.find(
          (item) => item.purchaseOrderNumber === purchaseOrderNumberToReopen,
        );

        if (!targetPurchaseOrder || !tenantId) {
          return { status: 0, body: { error: "Reopened purchase order lookup failed before reopen guard test." } };
        }

        const response = await fetch("/api/purchase-orders/reopen", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            purchaseOrderId: targetPurchaseOrder.id,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        purchaseOrderNumberToReopen: purchaseOrderNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      reopenedPurchaseOrderReopenResponse.status === 400 &&
        reopenedPurchaseOrderReopenResponse.body?.error ===
          "The selected purchase order can only be reopened after it has been closed.",
      "Open purchase order did not reject reopening while already active.",
    );
    purchaseOrderReopenGuardVerified = true;
    const purchaseOrderRecloseResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/purchase-orders/close") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await purchaseOrderRow.locator('[data-testid="purchase-order-close-button"]').click();
    await page
      .locator(".ant-popconfirm-buttons")
      .last()
      .getByRole("button", { name: /Chốt đơn mua|Close Purchase Order/ })
      .click();
    await purchaseOrderRecloseResponse;
    await openSection(page, sidebarIndexes.purchaseOrders, "/dashboard/purchase-orders");
    await waitForTenantContext(page, tenantName);
    await purchaseOrderRow.getByText(/Đã chốt|Closed/).waitFor({ timeout: 15000 });
    await purchaseOrdersReceiveCombobox.click();
    const reclosedReceiveDropdown = page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)").last();
    await reclosedReceiveDropdown.waitFor({ timeout: 15000 });
    const reclosedReceiptOption = reclosedReceiveDropdown.getByText(purchaseOrderNumber, { exact: false });
    assert(
      (await reclosedReceiptOption.count()) === 0,
      "Reclosed purchase order still appeared inside the receiving card.",
    );
    await page.keyboard.press("Escape");
    const closedPurchaseOrderReceiptResponse = await page.evaluate(
      async ({ purchaseOrderNumberToReceive, quantity, sessionKey, tenantKey, receivedDate }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const purchaseOrdersResponse = await fetch(
          `/api/purchase-orders?tenantId=${encodeURIComponent(tenantId ?? "")}`,
          { headers },
        );
        const purchaseOrdersPayload = await purchaseOrdersResponse.json();
        const targetPurchaseOrder = purchaseOrdersPayload.items.find(
          (item) => item.purchaseOrderNumber === purchaseOrderNumberToReceive,
        );

        if (!targetPurchaseOrder || !tenantId) {
          return { status: 0, body: { error: "Closed purchase order lookup failed before receipt guard test." } };
        }

        const response = await fetch("/api/purchase-orders/receipts", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            purchaseOrderId: targetPurchaseOrder.id,
            quantityReceived: quantity,
            receivedDate,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        purchaseOrderNumberToReceive: purchaseOrderNumber,
        quantity: 1,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        receivedDate: firstIssueDateInput,
      },
    );
    assert(
      closedPurchaseOrderReceiptResponse.status === 400 &&
        closedPurchaseOrderReceiptResponse.body?.error === "The selected purchase order has been closed.",
      "Closed purchase order still accepted a receipt.",
    );
    purchaseOrderCloseGuardVerified = true;

    await openSection(page, sidebarIndexes.inventory, "/dashboard/inventory");
    await waitForTenantContext(page, tenantName);
    const inventoryFormCard = getFormCard(page);
    const inventoryRow = getListCard(page).locator(".record-row").filter({ hasText: productName }).first();
    await inventoryRow.waitFor({ timeout: 15000 });
    await inventoryRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    await inventoryRow.getByText(String(stockInQuantity), { exact: true }).waitFor({ timeout: 15000 });
    await inventoryRow.getByText(buildAmountPattern(purchaseUnitCost)).first().waitFor({ timeout: 15000 });
    await inventoryRow.getByText(buildAmountPattern(expectedReceivedPurchaseValue)).first().waitFor({ timeout: 15000 });
    await assertImageLoadedInScope(
      inventoryRow,
      productImageUrl,
      "Inventory row did not render the product image.",
    );
    inventoryImageVerified = true;
    await waitForFormReady(inventoryFormCard);
    await selectOption(page, inventoryFormCard.getByRole("combobox", { name: /Sản phẩm|San pham/ }), productName);
    await selectOption(page, inventoryFormCard.getByRole("combobox", { name: /Loại điều chỉnh|Loai dieu chinh/ }), "Xuất kho");
    await fillNumberInput(inventoryFormCard.getByRole("spinbutton", { name: /Số lượng|So luong/ }), 2);
    await clickSubmit(inventoryFormCard);
    await inventoryRow.getByText(String(stockInQuantity), { exact: true }).waitFor({ timeout: 15000 });
    await inventoryRow.getByText(buildAmountPattern(expectedReceivedPurchaseValue)).first().waitFor({ timeout: 15000 });
    await openSection(page, sidebarIndexes.approvals, "/dashboard/approvals");
    await waitForTenantContext(page, tenantName);
    const inventoryAdjustmentApprovalRow = approvalsPendingCard
      .locator(".activity-row")
      .filter({ hasText: productSku })
      .first();
    await inventoryAdjustmentApprovalRow.waitFor({ timeout: 15000 });
    await inventoryAdjustmentApprovalRow
      .getByText("Outbound inventory adjustments require founder approval.", { exact: false })
      .waitFor({ timeout: 15000 });
    await inventoryAdjustmentApprovalRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    const inventoryAdjustmentDecisionResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/approval-requests/decision") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await inventoryAdjustmentApprovalRow.getByRole("button", { name: "Từ chối" }).click();
    await inventoryAdjustmentDecisionResponse;
    await waitForLocatorCount(
      page,
      approvalsPendingCard.locator(".activity-row").filter({ hasText: productSku }),
      0,
    );
    await approvalsHistoryCard.getByText(productSku, { exact: false }).first().waitFor({ timeout: 15000 });
    await approvalsHistoryCard.getByText("Đã từ chối", { exact: false }).first().waitFor({ timeout: 15000 });
    inventoryAdjustmentRejectionVerified = true;
    await dismissGlobalAlerts(page);
    await openSection(page, sidebarIndexes.inventory, "/dashboard/inventory");
    await waitForTenantContext(page, tenantName);
    await inventoryRow.getByText(String(stockInQuantity), { exact: true }).waitFor({ timeout: 15000 });
    await inventoryRow.getByText(buildAmountPattern(expectedReceivedPurchaseValue)).first().waitFor({ timeout: 15000 });
    inventoryValuationVerified = true;
    inventoryCategoryFlowVerified = true;

    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    const ordersFormCard = getFormCard(page);
    await waitForFormReady(ordersFormCard);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Khách hàng" }), customerName);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Sản phẩm" }), productName);
    await fillNumberInput(ordersFormCard.getByRole("spinbutton", { name: "* Số lượng" }), cancelableOrderQuantity);
    await clickSubmit(ordersFormCard);
    const canceledOrderRow = getListCard(page)
      .locator(".record-row")
      .filter({ hasText: `${productName} x ${cancelableOrderQuantity}` })
      .first();
    await canceledOrderRow.waitFor({ timeout: 15000 });
    await canceledOrderRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    const canceledOrderNumber = (await canceledOrderRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(canceledOrderNumber.length > 0, "Cancelable order number was not rendered before cancellation.");
    await canceledOrderRow.locator('[data-testid="order-cancel-button"]').click();
    await page.getByRole("button", { name: /Hủy đơn hàng|Huy don hang/ }).last().click();
    await canceledOrderRow.getByText(/Đã hủy|Da huy/).waitFor({ timeout: 15000 });
    const canceledOrderInventoryResponse = await page.evaluate(
      async ({ productSkuToCheck, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          authorization: `Bearer ${accessToken}`,
        };

        const response = await fetch(`/api/inventory?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const payload = await response.json();
        const inventoryItem = payload.items.find((item) => item.sku === productSkuToCheck);

        return {
          status: response.status,
          item: inventoryItem ?? null,
        };
      },
      {
        productSkuToCheck: productSku,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      canceledOrderInventoryResponse.status === 200 &&
        canceledOrderInventoryResponse.item?.quantityOnHand === stockInQuantity,
      "Canceling the order did not restore stock to the expected quantity.",
    );
    orderCancellationVerified = true;
    const canceledOrderInvoiceResponse = await page.evaluate(
      async ({ targetOrderNumber, issueDate, taxRatePercent, paymentTermDays, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!targetOrder || !tenantId) {
          return { status: 0, body: { error: "Canceled order lookup failed before invoice guard test." } };
        }

        const response = await fetch("/api/invoices", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
            issueDate,
            paymentTermDays,
            taxRatePercent,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: canceledOrderNumber,
        issueDate: firstIssueDateInput,
        taxRatePercent: taxRate,
        paymentTermDays: firstPaymentTermDays,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      canceledOrderInvoiceResponse.status === 400 &&
        canceledOrderInvoiceResponse.body?.error === "Only confirmed orders can be invoiced.",
      "Canceled order still accepted invoice issuance.",
    );
    canceledOrderInvoiceGuardVerified = true;

    await waitForFormReady(ordersFormCard);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Khách hàng" }), customerName);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Sản phẩm" }), productName);
    await fillNumberInput(ordersFormCard.getByRole("spinbutton", { name: "* Số lượng" }), saleQuantity);
    await clickSubmit(ordersFormCard);
    const initialOrderRow = getListCard(page)
      .locator(".record-row")
      .filter({ hasText: `${productName} x ${saleQuantity}` })
      .first();
    await initialOrderRow.waitFor({ timeout: 15000 });
    await initialOrderRow.getByText(customerName, { exact: false }).waitFor({ timeout: 15000 });
    await initialOrderRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    await assertImageLoadedInScope(
      initialOrderRow,
      productImageUrl,
      "Order row did not render the product image.",
    );
    orderImageVerified = true;
    orderNumber = (await initialOrderRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(orderNumber.length > 0, "Order number was not rendered after order creation.");
    const orderRow = getListCard(page).locator(".record-row").filter({ hasText: orderNumber }).first();
    await orderRow.locator('[data-testid="order-edit-button"]').click();
    await fillNumberInput(ordersFormCard.getByRole("spinbutton", { name: "* Số lượng" }), editedSaleQuantity);
    await clickSubmit(ordersFormCard);
    await page.waitForFunction(
      ({ targetOrderNumber, targetProductText }) => {
        const matchingRow = Array.from(document.querySelectorAll(".record-row")).find((row) =>
          row.textContent?.includes(targetOrderNumber),
        );

        return Boolean(matchingRow?.textContent?.includes(targetProductText));
      },
      {
        targetOrderNumber: orderNumber,
        targetProductText: `${productName} x ${editedSaleQuantity}`,
      },
      { timeout: 15000 },
    );
    const editedOrderInventoryResponse = await page.evaluate(
      async ({ productSkuToCheck, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          authorization: `Bearer ${accessToken}`,
        };

        const response = await fetch(`/api/inventory?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const payload = await response.json();
        const inventoryItem = payload.items.find((item) => item.sku === productSkuToCheck);

        return {
          status: response.status,
          item: inventoryItem ?? null,
        };
      },
      {
        productSkuToCheck: productSku,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      editedOrderInventoryResponse.status === 200 &&
        editedOrderInventoryResponse.item?.quantityOnHand === stockInQuantity - editedSaleQuantity,
      "Editing the order did not rebalance stock to the expected quantity.",
    );
    orderEditVerified = true;
    orderCategoryFlowVerified = true;

    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Khách hàng" }), customerName);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Sản phẩm" }), productName);
    await fillNumberInput(ordersFormCard.getByRole("spinbutton", { name: "* Số lượng" }), invalidQuantity);
    await clickSubmit(ordersFormCard);
    await ordersFormCard.locator(".ant-form-item-explain-error").last().waitFor({ timeout: 15000 });

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    const issueInvoiceCard = page.getByTestId("invoice-issue-card");
    const paymentCard = page.getByTestId("invoice-payment-card");
    const followUpCard = page.getByTestId("invoice-follow-up-card");
    const worklistCard = page.getByTestId("invoice-worklist-card");
    const activityCard = page.getByTestId("invoice-activity-card");
    await waitForFormReady(issueInvoiceCard);
    await selectOption(page, issueInvoiceCard.getByRole("combobox", { name: /Đơn hàng/ }), orderNumber);
    await fillField(issueInvoiceCard, "#issueDate", firstIssueDateInput);
    await fillField(issueInvoiceCard, "#paymentTermDays", firstPaymentTermDays);
    await fillField(issueInvoiceCard, "#taxRatePercent", taxRate);
    const initialInvoiceCreateResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/invoices") &&
        response.request().method() === "POST" &&
        response.status() === 201,
      { timeout: 15000 },
    );
    await clickSubmit(issueInvoiceCard);
    const initialInvoiceCreateResult = await initialInvoiceCreateResponse;
    const initialInvoiceCreatePayload = await initialInvoiceCreateResult.json();
    assert(
      initialInvoiceCreateResult.status() === 201,
      `Initial invoice creation failed: ${initialInvoiceCreatePayload?.error ?? initialInvoiceCreateResult.status()}.`,
    );
    let invoiceRow = getListCard(page).locator(".record-row").filter({ hasText: orderNumber }).first();
    await invoiceRow.waitFor({ timeout: 30000 });
    await invoiceRow.getByText(customerName, { exact: false }).waitFor({ timeout: 15000 });
    await invoiceRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    await assertImageLoadedInScope(
      invoiceRow,
      productImageUrl,
      "Invoice row did not render the product image.",
    );
    invoiceImageVerified = true;
    invoiceNumber = (await invoiceRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(invoiceNumber.length > 0, "Invoice number was not rendered after invoice creation.");
    initialInvoiceNumber = invoiceNumber;
    await invoiceRow.getByText(buildAmountPattern(firstInvoiceAmount)).first().waitFor({ timeout: 15000 });
    const missingActiveAmendmentNoteResponse = await page.evaluate(
      async ({ targetInvoiceNumber, issueDate, paymentTermDays, taxRatePercent, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Invoice lookup failed before active amendment note guard test." } };
        }

        const response = await fetch("/api/invoices/amend", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            issueDate,
            paymentTermDays,
            taxRatePercent,
            amendmentNote: "",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: invoiceNumber,
        issueDate: firstIssueDateInput,
        paymentTermDays: amendedPaymentTermDays,
        taxRatePercent: taxRate,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      missingActiveAmendmentNoteResponse.status === 400 &&
        missingActiveAmendmentNoteResponse.body?.error ===
          "Amendment note is required when amending an active invoice.",
      "Active invoice amendment did not require an amendment note.",
    );
    invoiceAmendGuardVerified = true;

    const originalInvoiceNumber = invoiceNumber;
    await invoiceRow.locator('[data-testid="invoice-amend-button"]').click();
    const amendInvoiceModal = page
      .getByRole("dialog")
      .filter({ hasText: new RegExp(`Sửa ${originalInvoiceNumber}|Amend ${originalInvoiceNumber}`) })
      .last();
    await amendInvoiceModal.waitFor({ timeout: 15000 });
    await fillField(amendInvoiceModal, "#issueDate", firstIssueDateInput);
    await fillField(amendInvoiceModal, "#paymentTermDays", amendedPaymentTermDays);
    await fillField(amendInvoiceModal, "#taxRatePercent", taxRate);
    await fillField(amendInvoiceModal, "#amendmentNote", invoiceAmendmentNote);
    await amendInvoiceModal.locator("button[type='submit']").click();
    await amendInvoiceModal.waitFor({ state: "hidden", timeout: 15000 });

    const amendedInvoiceResponse = await page.evaluate(
      async ({ targetOrderNumber, targetOriginalInvoiceNumber, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          authorization: `Bearer ${accessToken}`,
        };

        const response = await fetch(`/api/invoices?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const payload = await response.json();
        const amendedInvoice = payload.items.find(
          (item) =>
            item.orderNumber === targetOrderNumber &&
            item.status === "issued" &&
            item.invoiceNumber !== targetOriginalInvoiceNumber,
        );

        return amendedInvoice ?? null;
      },
      {
        targetOrderNumber: orderNumber,
        targetOriginalInvoiceNumber: originalInvoiceNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(amendedInvoiceResponse?.invoiceNumber, "Invoice amend did not create a new active invoice revision.");
    assert(
      amendedInvoiceResponse?.revisionNumber === 2,
      `Invoice amend revision should be 2, got ${amendedInvoiceResponse?.revisionNumber ?? "unknown"}.`,
    );
    assert(
      amendedInvoiceResponse?.amendmentRootInvoiceNumber === originalInvoiceNumber,
      "Amended invoice did not retain the expected root invoice number.",
    );
    assert(
      amendedInvoiceResponse?.amendmentNote === invoiceAmendmentNote,
      "Amended invoice did not persist the amendment note.",
    );
    invoiceNumber = amendedInvoiceResponse.invoiceNumber;
    const originalInvoiceRow = getInvoiceRowByNumber(page, originalInvoiceNumber);
    const amendedInvoiceRow = getInvoiceRowByNumber(page, invoiceNumber);
    await originalInvoiceRow.getByText(/Đã hủy hiệu lực|Da huy hieu luc/, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await amendedInvoiceRow.getByText(/Đã phát hành|Da phat hanh/, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    const originalInvoiceText = await originalInvoiceRow.textContent();
    const amendedInvoiceText = await amendedInvoiceRow.textContent();
    assert(
      originalInvoiceText?.includes(invoiceNumber),
      "Original invoice row did not show the amended replacement invoice number.",
    );
    assert(
      amendedInvoiceText?.includes(originalInvoiceNumber),
      "Amended invoice row did not show the original invoice number.",
    );
    assert(
      amendedInvoiceText?.includes(invoiceAmendmentNote),
      "Amended invoice row did not show the amendment note.",
    );
    invoiceRow = amendedInvoiceRow;
    invoiceAmendVerified = true;

    const invoicedOrderUpdateResponse = await page.evaluate(
      async ({ targetOrderNumber, quantity, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!targetOrder || !tenantId) {
          return { status: 0, body: { error: "Invoiced order lookup failed before update guard test." } };
        }

        const response = await fetch("/api/orders/update", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
            customerId: targetOrder.customerId,
            productId: targetOrder.productId,
            quantity,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: orderNumber,
        quantity: editedSaleQuantity + 1,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      invoicedOrderUpdateResponse.status === 400 &&
        invoicedOrderUpdateResponse.body?.error ===
          "The selected order cannot be edited because an invoice already references it.",
      "Invoiced order did not reject editing after invoice issuance.",
    );
    orderEditGuardVerified = true;
    const invoicedOrderCancelResponse = await page.evaluate(
      async ({ targetOrderNumber, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!targetOrder || !tenantId) {
          return { status: 0, body: { error: "Invoiced order lookup failed before cancel guard test." } };
        }

        const response = await fetch("/api/orders/cancel", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: orderNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      invoicedOrderCancelResponse.status === 400 &&
        invoicedOrderCancelResponse.body?.error ===
          "The selected order cannot be canceled because an invoice already references it.",
      "Invoiced order did not reject cancellation.",
    );
    orderCancelGuardVerified = true;
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
    await invoiceRow.getByText("Đã phát hành", { exact: false }).waitFor({ timeout: 15000 });
    await invoiceRow.getByText(buildAmountPattern(firstInvoiceAmount)).first().waitFor({ timeout: 15000 });
    await openSection(page, sidebarIndexes.approvals, "/dashboard/approvals");
    await waitForTenantContext(page, tenantName);
    const paymentApprovalRow = approvalsPendingCard
      .locator(".activity-row")
      .filter({ hasText: invoiceNumber })
      .first();
    await paymentApprovalRow.waitFor({ timeout: 15000 });
    await paymentApprovalRow
      .getByText("Large cash receipt requires founder approval.", { exact: false })
      .waitFor({ timeout: 15000 });
    await paymentApprovalRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    await paymentApprovalRow.getByRole("button", { name: "Duyệt" }).click();
    await waitForLocatorCount(page, approvalsPendingCard.locator(".activity-row").filter({ hasText: invoiceNumber }), 0);
    await approvalsHistoryCard.getByText(invoiceNumber, { exact: false }).first().waitFor({ timeout: 15000 });
    await approvalsHistoryCard.getByText("Đã duyệt", { exact: false }).first().waitFor({ timeout: 15000 });
    invoicePaymentApprovalVerified = true;
    await dismissGlobalAlerts(page);
    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
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
    const settledOrderRow = getListCard(page).locator(".record-row").filter({ hasText: orderNumber }).first();
    await settledOrderRow.waitFor({ timeout: 15000 });
    const orderCloseResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/orders/close") &&
        response.request().method() === "POST",
      { timeout: 15000 },
    );
    await settledOrderRow.locator('[data-testid="order-close-button"]').click();
    await page
      .locator(".ant-popconfirm-buttons")
      .last()
      .getByRole("button", { name: /Chốt đơn hàng|Close Order/ })
      .click();
    const orderCloseResult = await orderCloseResponse;
    const orderClosePayload = await orderCloseResult.json();
    assert(
      orderCloseResult.status() === 200,
      `Settled order close failed: ${orderClosePayload?.error ?? orderCloseResult.status()}.`,
    );
    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    const closedOrderRow = getListCard(page).locator(".record-row").filter({ hasText: orderNumber }).first();
    await closedOrderRow.waitFor({ timeout: 15000 });
    await closedOrderRow.getByText(/Đã chốt|Closed/).waitFor({ timeout: 15000 });
    orderCloseVerified = true;
    const orderReopenResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/orders/reopen") &&
        response.request().method() === "POST",
      { timeout: 15000 },
    );
    await closedOrderRow.locator('[data-testid="order-reopen-button"]').click();
    await page
      .locator(".ant-popconfirm-buttons")
      .last()
      .getByRole("button", { name: /Mở lại đơn hàng|Reopen Order/ })
      .click();
    const orderReopenResult = await orderReopenResponse;
    const orderReopenPayload = await orderReopenResult.json();
    assert(
      orderReopenResult.status() === 200,
      `Closed order reopen failed: ${orderReopenPayload?.error ?? orderReopenResult.status()}.`,
    );
    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    const reopenedOrderRow = getListCard(page).locator(".record-row").filter({ hasText: orderNumber }).first();
    await reopenedOrderRow.waitFor({ timeout: 15000 });
    await reopenedOrderRow.getByText(/Đã xác nhận|Confirmed/).waitFor({ timeout: 15000 });
    orderReopenVerified = true;
    const reopenedOrderReopenResponse = await page.evaluate(
      async ({ targetOrderNumber, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!targetOrder || !tenantId) {
          return { status: 0, body: { error: "Reopened order lookup failed before reopen guard test." } };
        }

        const response = await fetch("/api/orders/reopen", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: orderNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      reopenedOrderReopenResponse.status === 400 &&
        reopenedOrderReopenResponse.body?.error ===
          "The selected order can only be reopened after it has been closed.",
      "Open order did not reject reopening while already active.",
    );
    orderReopenGuardVerified = true;
    const orderRecloseResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/orders/close") &&
        response.request().method() === "POST",
      { timeout: 15000 },
    );
    await reopenedOrderRow.locator('[data-testid="order-close-button"]').click();
    await page
      .locator(".ant-popconfirm-buttons")
      .last()
      .getByRole("button", { name: /Chốt đơn hàng|Close Order/ })
      .click();
    const orderRecloseResult = await orderRecloseResponse;
    const orderReclosePayload = await orderRecloseResult.json();
    assert(
      orderRecloseResult.status() === 200,
      `Reclosed order failed after reopen: ${orderReclosePayload?.error ?? orderRecloseResult.status()}.`,
    );
    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    await settledOrderRow.getByText(/Đã chốt|Closed/).waitFor({ timeout: 15000 });

    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    await waitForFormReady(ordersFormCard);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Khách hàng" }), customerName);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Sản phẩm" }), productName);
    await fillNumberInput(ordersFormCard.getByRole("spinbutton", { name: "* Số lượng" }), voidableOrderQuantity);
    await clickSubmit(ordersFormCard);
    const voidedOrderRow = getListCard(page)
      .locator(".record-row")
      .filter({ hasText: `${productName} x ${voidableOrderQuantity}` })
      .first();
    await voidedOrderRow.waitFor({ timeout: 15000 });
    voidedOrderNumber = (await voidedOrderRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(voidedOrderNumber.length > 0, "Voidable order number was not rendered after order creation.");

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    await waitForFormReady(issueInvoiceCard);
    await selectOption(page, issueInvoiceCard.getByRole("combobox", { name: /Đơn hàng/ }), voidedOrderNumber);
    await fillField(issueInvoiceCard, "#issueDate", firstIssueDateInput);
    await fillField(issueInvoiceCard, "#paymentTermDays", firstPaymentTermDays);
    await fillField(issueInvoiceCard, "#taxRatePercent", taxRate);
    await clickSubmit(issueInvoiceCard);
    const voidedInvoiceRow = getListCard(page).locator(".record-row").filter({ hasText: voidedOrderNumber }).first();
    await voidedInvoiceRow.waitFor({ timeout: 15000 });
    voidedInvoiceNumber = await findInvoiceNumberByOrderNumber(page, voidedOrderNumber);
    assert(voidedInvoiceNumber.length > 0, "Voidable invoice number was not rendered after invoice creation.");
    await voidedInvoiceRow.getByText(buildAmountPattern(voidableInvoiceAmount)).first().waitFor({ timeout: 15000 });
    await voidedInvoiceRow.locator('[data-testid="invoice-void-button"]').click();
    await page.getByRole("button", { name: /Hủy hiệu lực|Huy hieu luc/ }).last().click();
    await voidedInvoiceRow.getByText(/Đã hủy hiệu lực|Da huy hieu luc/, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    invoiceVoidVerified = true;
    const voidedInvoicePaymentResponse = await page.evaluate(
      async ({ targetInvoiceNumber, amount, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Voided invoice lookup failed before payment guard test." } };
        }

        const response = await fetch("/api/invoices/payments", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            amount,
            method: "bank_transfer",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: voidedInvoiceNumber,
        amount: 1000,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      voidedInvoicePaymentResponse.status === 400 &&
        voidedInvoicePaymentResponse.body?.error === "The selected invoice has been voided.",
      "Voided invoice did not reject payment creation.",
    );
    voidedInvoicePaymentGuardVerified = true;
    const voidedInvoiceCollectionResponse = await page.evaluate(
      async ({ targetInvoiceNumber, sessionKey, tenantKey, nextActionDate }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Voided invoice lookup failed before collection guard test." } };
        }

        const response = await fetch("/api/invoices/collections", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            followUpStatus: "contacted",
            actionRequired: "call_customer",
            promisedPaymentDate: null,
            nextActionDate,
            collectionNote: "Voided invoice should reject follow-up updates.",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: voidedInvoiceNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        nextActionDate: firstIssueDateInput,
      },
    );
    assert(
      voidedInvoiceCollectionResponse.status === 400 &&
        voidedInvoiceCollectionResponse.body?.error === "The selected invoice has been voided.",
      "Voided invoice did not reject collection updates.",
    );
    voidedInvoiceCollectionGuardVerified = true;

    const missingAmendmentNoteResponse = await page.evaluate(
      async ({ targetOrderNumber, issueDate, paymentTermDays, taxRatePercent, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!targetOrder || !tenantId) {
          return { status: 0, body: { error: "Voided order lookup failed before amendment note guard test." } };
        }

        const response = await fetch("/api/invoices", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
            issueDate,
            paymentTermDays,
            taxRatePercent,
            amendmentNote: "",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: voidedOrderNumber,
        issueDate: firstIssueDateInput,
        paymentTermDays: firstPaymentTermDays,
        taxRatePercent: taxRate,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      missingAmendmentNoteResponse.status === 400 &&
        missingAmendmentNoteResponse.body?.error === "Amendment note is required when reissuing an invoice.",
      "Invoice reissue did not require an amendment note after a prior revision was voided.",
    );
    invoiceAmendmentNoteGuardVerified = true;

    await waitForFormReady(issueInvoiceCard);
    await selectOption(page, issueInvoiceCard.getByRole("combobox", { name: /Đơn hàng/ }), voidedOrderNumber);
    await fillField(issueInvoiceCard, "#issueDate", firstIssueDateInput);
    await fillField(issueInvoiceCard, "#paymentTermDays", firstPaymentTermDays);
    await fillField(issueInvoiceCard, "#taxRatePercent", taxRate);
    await fillField(issueInvoiceCard, "#amendmentNote", reissueAmendmentNote);
    await clickSubmit(issueInvoiceCard);
    const reissuedInvoiceRow = getListCard(page).locator(".record-row").filter({ hasText: voidedOrderNumber }).first();
    await reissuedInvoiceRow.waitFor({ timeout: 15000 });
    const reissuedInvoiceResponse = await page.evaluate(
      async ({ targetOrderNumber, targetVoidedInvoiceNumber, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          authorization: `Bearer ${accessToken}`,
        };

        const response = await fetch(`/api/invoices?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const payload = await response.json();
        const reissued = payload.items.find(
          (item) =>
            item.orderNumber === targetOrderNumber &&
            item.status === "issued" &&
            item.invoiceNumber !== targetVoidedInvoiceNumber,
        );

        return reissued ?? null;
      },
      {
        targetOrderNumber: voidedOrderNumber,
        targetVoidedInvoiceNumber: voidedInvoiceNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(reissuedInvoiceResponse?.invoiceNumber, "Reissued invoice lookup did not return a new active invoice.");
    assert(
      reissuedInvoiceResponse?.revisionNumber === 2,
      `Reissued invoice revision should be 2, got ${reissuedInvoiceResponse?.revisionNumber ?? "unknown"}.`,
    );
    assert(
      reissuedInvoiceResponse?.amendmentRootInvoiceNumber === voidedInvoiceNumber,
      "Reissued invoice did not retain the expected root invoice number.",
    );
    reissuedInvoiceNumber = reissuedInvoiceResponse.invoiceNumber;
    const originalVoidedInvoiceRow = getListCard(page).locator(".record-row").filter({ hasText: voidedInvoiceNumber }).first();
    const reissuedInvoiceIssuedRow = getListCard(page).locator(".record-row").filter({ hasText: reissuedInvoiceNumber }).first();
    await reissuedInvoiceIssuedRow.getByText("Đã phát hành", { exact: false }).waitFor({ timeout: 15000 });
    const originalVoidedInvoiceText = await originalVoidedInvoiceRow.textContent();
    const reissuedInvoiceText = await reissuedInvoiceIssuedRow.textContent();
    assert(
      originalVoidedInvoiceText?.includes(reissuedInvoiceNumber),
      "Voided invoice row did not show the replacement invoice number.",
    );
    assert(
      reissuedInvoiceText?.includes(voidedInvoiceNumber),
      "Reissued invoice row did not show the original voided invoice number.",
    );
    assert(
      reissuedInvoiceText?.includes(reissueAmendmentNote),
      "Reissued invoice row did not show the amendment note.",
    );
    invoiceReissueVerified = true;
    invoiceReissueLineageVerified = true;
    invoiceRevisionLineageVerified = true;
    invoiceAmendmentNoteUiVerified = true;

    const reissuedInvoiceRowCard = getListCard(page).locator(".record-row").filter({ hasText: reissuedInvoiceNumber }).first();
    await reissuedInvoiceRowCard.locator('[data-testid="invoice-void-button"]').click();
    await page.getByRole("button", { name: /Hủy hiệu lực|Huy hieu luc/ }).last().click();
    await reissuedInvoiceRowCard.getByText(/Đã hủy hiệu lực|Da huy hieu luc/, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    reissuedInvoiceVoidVerified = true;

    await reissuedInvoiceRowCard.locator('[data-testid="invoice-reopen-button"]').click();
    await page.getByRole("button", { name: /Mở lại hóa đơn|Mo lai hoa don/ }).last().click();
    await reissuedInvoiceRowCard.getByText(/Đã phát hành|Da phat hanh/, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    invoiceReopenVerified = true;

    const reopenedInvoiceReopenResponse = await page.evaluate(
      async ({ targetInvoiceNumber, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Reopened invoice lookup failed before reopen guard test." } };
        }

        const response = await fetch("/api/invoices/reopen", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: reissuedInvoiceNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      reopenedInvoiceReopenResponse.status === 400 &&
        reopenedInvoiceReopenResponse.body?.error ===
          "The selected invoice can only be reopened after it has been voided.",
      "Issued invoice did not reject reopen while already active.",
    );
    invoiceReopenGuardVerified = true;

    const supersededInvoiceReopenResponse = await page.evaluate(
      async ({ targetInvoiceNumber, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Superseded invoice lookup failed before reopen guard test." } };
        }

        const response = await fetch("/api/invoices/reopen", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: voidedInvoiceNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      supersededInvoiceReopenResponse.status === 400 &&
        supersededInvoiceReopenResponse.body?.error ===
          "The selected invoice cannot be reopened because a newer revision already exists.",
      "Superseded invoice did not reject reopen after a newer revision existed.",
    );
    invoiceReopenRevisionGuardVerified = true;

    const reopenedInvoiceOrderCancelResponse = await page.evaluate(
      async ({ targetOrderNumber, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!targetOrder || !tenantId) {
          return { status: 0, body: { error: "Order lookup failed before cancel guard test after invoice reopen." } };
        }

        const response = await fetch("/api/orders/cancel", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: voidedOrderNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      reopenedInvoiceOrderCancelResponse.status === 400 &&
        reopenedInvoiceOrderCancelResponse.body?.error ===
          "The selected order cannot be canceled because an invoice already references it.",
      "Order cancellation did not reject while a reopened invoice revision was active.",
    );
    reopenedInvoiceOrderCancellationGuardVerified = true;

    await reissuedInvoiceRowCard.locator('[data-testid="invoice-void-button"]').click();
    await page.getByRole("button", { name: /Hủy hiệu lực|Huy hieu luc/ }).last().click();
    await waitForLocatorText(reissuedInvoiceRowCard, [/Đã hủy hiệu lực|Da huy hieu luc/]);

    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    const cancelVoidedOrderRow = getListCard(page).locator(".record-row").filter({ hasText: voidedOrderNumber }).first();
    await cancelVoidedOrderRow.waitFor({ timeout: 15000 });
    await cancelVoidedOrderRow.locator('[data-testid="order-cancel-button"]').click();
    await page.getByRole("button", { name: /Hủy đơn hàng|Huy don hang/ }).last().click();
    await cancelVoidedOrderRow.getByText(/Đã hủy|Da huy/, { exact: false }).waitFor({ timeout: 15000 });
    voidedInvoiceOrderCancellationVerified = true;

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    await waitForLocatorText(
      getListCard(page).locator(".record-row").filter({ hasText: voidedInvoiceNumber }).first(),
      [/Đã hủy hiệu lực|Da huy hieu luc/],
    );

    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    await waitForFormReady(ordersFormCard);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Khách hàng" }), customerName);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Sản phẩm" }), productName);
    await fillNumberInput(ordersFormCard.getByRole("spinbutton", { name: "* Số lượng" }), secondSaleQuantity);
    const secondOrderCreateResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/orders") &&
        response.request().method() === "POST" &&
        response.status() === 201,
      { timeout: 15000 },
    );
    await clickSubmit(ordersFormCard);
    await secondOrderCreateResponse;
    const secondOrderRow = getListCard(page)
      .locator(".record-row")
      .filter({ hasText: `${productName} x ${secondSaleQuantity}` })
      .first();
    await secondOrderRow.waitFor({ timeout: 15000 });
    await secondOrderRow.getByText(customerName, { exact: false }).waitFor({ timeout: 15000 });
    await secondOrderRow.getByText(buildAmountPattern(secondOrderGrossAmount)).first().waitFor({ timeout: 15000 });
    secondOrderNumber = (await secondOrderRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(secondOrderNumber.length > 0, "Second order number was not rendered after order creation.");

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    const backdatedInvoiceRequest = await page.evaluate(
      async ({ targetOrderNumber, issueDate, paymentTermDays, taxRatePercent, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!targetOrder || !tenantId) {
          return { status: 0, body: { error: "Second order lookup failed before backdated invoice request." } };
        }

        const response = await fetch("/api/invoices", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
            issueDate,
            paymentTermDays,
            taxRatePercent,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: secondOrderNumber,
        issueDate: secondIssueDateInput,
        paymentTermDays: secondPaymentTermDays,
        taxRatePercent: taxRate,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      backdatedInvoiceRequest.status === 202 &&
        backdatedInvoiceRequest.body?.item?.kind === "approval_requested",
      "Backdated invoice request did not enter the expected approval flow.",
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForURL(/\/dashboard\/invoices$/, { timeout: 15000 });
    await waitForTenantContext(page, tenantName);
    await openSection(page, sidebarIndexes.approvals, "/dashboard/approvals");
    await waitForTenantContext(page, tenantName);
    const backdatedInvoiceApprovalRow = approvalsPendingCard
      .locator(".activity-row")
      .filter({ hasText: secondOrderNumber })
      .first();
    await backdatedInvoiceApprovalRow.waitFor({ timeout: 15000 });
    await backdatedInvoiceApprovalRow
      .getByText("Backdated invoice issue requires founder approval.", { exact: false })
      .waitFor({ timeout: 15000 });
    await backdatedInvoiceApprovalRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    const backdatedInvoiceApprovalResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/approval-requests/decision") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await backdatedInvoiceApprovalRow.getByRole("button", { name: "Duyệt" }).click();
    await backdatedInvoiceApprovalResponse;
    await waitForLocatorCount(
      page,
      approvalsPendingCard.locator(".activity-row").filter({ hasText: secondOrderNumber }),
      0,
    );
    await approvalsHistoryCard.getByText(secondOrderNumber, { exact: false }).first().waitFor({ timeout: 15000 });
    await approvalsHistoryCard.getByText("Đã duyệt", { exact: false }).first().waitFor({ timeout: 15000 });
    backdatedInvoiceApprovalVerified = true;
    approvalCategoryContextVerified = true;
    await dismissGlobalAlerts(page);
    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    const secondInvoiceRow = getListCard(page).locator(".record-row").filter({ hasText: secondOrderNumber }).first();
    await secondInvoiceRow.waitFor({ timeout: 15000 });
    secondInvoiceNumber = await findInvoiceNumberByOrderNumber(page, secondOrderNumber);
    assert(secondInvoiceNumber.length > 0, "Second invoice number was not rendered after invoice creation.");
    await secondInvoiceRow.getByText("Đã phát hành", { exact: false }).waitFor({ timeout: 15000 });
    await secondInvoiceRow.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    await secondInvoiceRow.getByText(`Quá hạn ${secondDaysPastDue} ngày`, { exact: false }).waitFor({ timeout: 15000 });
    await secondInvoiceRow.getByText(buildAmountPattern(secondInvoiceAmount)).first().waitFor({ timeout: 15000 });
    invoiceCategoryContextVerified = true;
    const openOrderCloseResponse = await page.evaluate(
      async ({ targetOrderNumber, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!targetOrder || !tenantId) {
          return { status: 0, body: { error: "Open order lookup failed before close guard test." } };
        }

        const response = await fetch("/api/orders/close", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: secondOrderNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      openOrderCloseResponse.status === 400 &&
        openOrderCloseResponse.body?.error ===
          "The selected order can only be closed after its active invoice is fully paid.",
      "Open order did not reject close before payment.",
    );
    orderCloseGuardVerified = true;
    await waitForFormReady(followUpCard);
    await selectOption(page, followUpCard.getByRole("combobox").nth(0), secondInvoiceNumber);
    await selectOption(page, followUpCard.getByRole("combobox").nth(1), "Hứa thanh toán");
    await selectOption(page, followUpCard.getByRole("combobox").nth(2), "Xác nhận thanh toán");
    await fillField(followUpCard, "#promisedPaymentDate", promisedPaymentDateInput);
    await fillField(followUpCard, "#nextActionDate", promisedPaymentDateInput);
    await followUpCard.locator("#collectionNote").fill(collectionNote);
    const promisedFollowUpResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/invoices/collections") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await clickSubmit(followUpCard);
    await promisedFollowUpResponse;
    await waitForLocatorText(secondInvoiceRow, [
      "Hứa thanh toán",
      "Xác nhận thanh toán",
      collectionNote,
      "Ngày hứa trả:",
    ]);
    collectionFollowUpVerified = true;
    const promisedPaymentActivityRow = activityCard.locator(".activity-row").filter({ hasText: secondInvoiceNumber }).first();
    await promisedPaymentActivityRow.waitFor({ timeout: 15000 });
    await waitForLocatorText(promisedPaymentActivityRow, [
      secondInvoiceNumber,
      "Hứa thanh toán",
      "Xác nhận thanh toán",
      collectionNote,
    ]);
    await selectOption(page, followUpCard.getByRole("combobox").nth(0), secondInvoiceNumber);
    await selectOption(page, followUpCard.getByRole("combobox").nth(1), "Cần escalated");
    await selectOption(page, followUpCard.getByRole("combobox").nth(2), "Founder xử lý");
    await fillField(followUpCard, "#promisedPaymentDate", "");
    await fillField(followUpCard, "#nextActionDate", worklistActionDateInput);
    await followUpCard.locator("#collectionNote").fill(escalatedCollectionNote);
    const escalatedFollowUpResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/invoices/collections") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await clickSubmit(followUpCard);
    await escalatedFollowUpResponse;
    await waitForLocatorText(secondInvoiceRow, [
      "Cần escalated",
      "Founder xử lý",
      "Khẩn cấp",
      escalatedCollectionNote,
    ]);
    const worklistRow = worklistCard.locator(".collection-queue-row").filter({ hasText: secondInvoiceNumber }).first();
    await worklistRow.waitFor({ timeout: 15000 });
    await waitForLocatorText(worklistRow, [
      secondInvoiceNumber,
      "Founder xử lý",
      "Khẩn cấp",
      escalatedCollectionNote,
    ]);
    const latestEscalatedActivity = activityCard.locator(".activity-row").filter({ hasText: secondInvoiceNumber }).first();
    await latestEscalatedActivity.waitFor({ timeout: 15000 });
    await waitForLocatorText(latestEscalatedActivity, [
      secondInvoiceNumber,
      escalatedCollectionNote,
      "Founder xử lý",
      "Khẩn cấp",
    ]);
    await waitForLocatorText(activityCard, [collectionNote]);
    collectionHistoryVerified = true;
    collectionWorklistVerified = true;
    await worklistRow.getByRole("button", { name: "Hoàn tất việc này" }).click();
    await worklistCard.getByText(secondInvoiceNumber, { exact: false }).waitFor({ state: "hidden", timeout: 15000 });
    await worklistCard.getByText("Hiện chưa có việc thu hồi nào đang chờ xử lý.", { exact: false }).waitFor({ timeout: 15000 });
    await secondInvoiceRow.getByText("Việc cần làm: Theo dõi", { exact: false }).waitFor({ timeout: 15000 });
    const latestResolvedActivity = activityCard.locator(".activity-row").filter({ hasText: secondInvoiceNumber }).first();
    await latestResolvedActivity.getByText("Đã xử lý", { exact: false }).waitFor({ timeout: 15000 });
    await latestResolvedActivity.getByText("Việc cần làm: Theo dõi", { exact: false }).waitFor({ timeout: 15000 });
    await latestResolvedActivity.getByText(escalatedCollectionNote, { exact: false }).waitFor({ timeout: 15000 });
    collectionResolutionVerified = true;

    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-button"]').click();
    const secondReturnAuthorizationModal = page.getByRole("dialog").filter({ hasText: "Duyệt trả hàng cho" }).last();
    await secondReturnAuthorizationModal.waitFor({ timeout: 15000 });
    await fillNumberInput(secondReturnAuthorizationModal.getByRole("spinbutton").first(), 1);
    await fillField(secondReturnAuthorizationModal, "#note", manualReturnAuthorizationNote);
    await clickSubmit(secondReturnAuthorizationModal);
    await secondInvoiceRow
      .getByText(/Trạng thái case trả hàng[:\s]*Đã duyệt|Return case status[:\s]*Authorized/, {
        exact: false,
      })
      .first()
      .waitFor({ timeout: 15000 });
    await secondInvoiceRow.getByText(manualReturnAuthorizationNote, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondInvoiceRow.locator('[data-testid="invoice-return-receipt-button"]').waitFor({ timeout: 15000 });
    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-close-button"]').waitFor({
      timeout: 15000,
    });
    const returnCaseQueueCard = page.getByTestId("invoice-return-case-queue-card");
    const secondReturnCaseQueueRow = returnCaseQueueCard.locator(
      `[data-testid="invoice-return-case-row-${secondInvoiceNumber}"]`,
    );
    await secondReturnCaseQueueRow.waitFor({ timeout: 15000 });
    const secondReturnCaseQueueText = (await secondReturnCaseQueueRow.textContent()) ?? "";
    secondReturnCaseNumber = secondReturnCaseQueueText.match(/RMA-\d{8}-[A-Z0-9]{6}/)?.[0] ?? "";
    assert(secondReturnCaseNumber.length > 0, "Second invoice return case number was not rendered.");
    await secondReturnCaseQueueRow.getByText(secondReturnCaseNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondInvoiceRow.getByText(secondReturnCaseNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText("Kho xử lý", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText("Nhận hàng trả về kho", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText("Còn chờ nhận: 1", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-amend-button"]').click();
    const secondReturnAmendModal = page.getByRole("dialog").filter({ hasText: "Sửa case trả hàng cho" }).last();
    await secondReturnAmendModal.waitFor({ timeout: 15000 });
    await fillNumberInput(secondReturnAmendModal.getByRole("spinbutton").first(), 2);
    await fillField(secondReturnAmendModal, "#note", manualReturnAuthorizationAmendNote);
    await clickSubmit(secondReturnAmendModal);
    await secondInvoiceRow.getByText(manualReturnAuthorizationAmendNote, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondInvoiceRow.getByText(manualReturnAuthorizationNote, { exact: false }).first().waitFor({
      state: "detached",
      timeout: 15000,
    });
    await secondInvoiceRow.getByText(/Case trả hàng:\s*0\/2/, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText(/Case trả hàng:\s*0\/2/, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText(secondReturnCaseNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondInvoiceRow.getByText(secondReturnCaseNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText("Còn chờ nhận: 2", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    invoiceReturnCaseAmendVerified = true;

    const amendedCaseInvalidQuantityResponse = await page.evaluate(
      async ({ targetInvoiceNumber, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Amended-case invoice lookup failed before quantity guard test." } };
        }

        const response = await fetch("/api/invoices/return-authorizations/update", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            quantityAuthorized: 3,
            note: "Unexpected quantity beyond the order size.",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: secondInvoiceNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      amendedCaseInvalidQuantityResponse.status === 400 &&
        amendedCaseInvalidQuantityResponse.body?.error ===
          "Return authorization quantity cannot exceed the order quantity.",
      "Return case amend allowed a quantity larger than the order.",
    );
    invoiceReturnCaseAmendGuardVerified = true;

    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-close-button"]').click();
    const secondReturnCloseModal = page.getByRole("dialog").filter({ hasText: "Đóng case trả hàng cho" }).last();
    await secondReturnCloseModal.waitFor({ timeout: 15000 });
    await fillField(secondReturnCloseModal, "#closeNote", manualReturnCloseNote);
    const secondReturnCloseResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/invoices/return-authorizations/close") &&
        response.request().method() === "POST",
      { timeout: 15000 },
    );
    await clickSubmit(secondReturnCloseModal);
    const secondReturnCloseResult = await secondReturnCloseResponse;
    const secondReturnClosePayload = await secondReturnCloseResult.json();
    assert(
      secondReturnCloseResult.status() === 200,
      `Return case close failed: ${secondReturnClosePayload?.error ?? secondReturnCloseResult.status()}.`,
    );
    await secondReturnCloseModal.waitFor({ state: "detached", timeout: 15000 });
    await secondInvoiceRow
      .getByText(/Trạng thái case trả hàng[:\s]*Đã đóng|Return case status[:\s]*Closed/, {
        exact: false,
      })
      .first()
      .waitFor({ timeout: 15000 });
    await secondInvoiceRow.getByText(manualReturnCloseNote, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondInvoiceRow.locator('[data-testid="invoice-return-receipt-button"]').waitFor({
      state: "detached",
      timeout: 15000,
    });
    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-close-button"]').waitFor({
      state: "detached",
      timeout: 15000,
    });
    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-reopen-button"]').waitFor({
      timeout: 15000,
    });

    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-reopen-button"]').click();
    const secondReturnReopenModal = page.getByRole("dialog").filter({ hasText: "Mở lại case trả hàng cho" }).last();
    await secondReturnReopenModal.waitFor({ timeout: 15000 });
    await fillField(secondReturnReopenModal, "#reopenNote", manualReturnReopenNote);
    await clickSubmit(secondReturnReopenModal);
    await secondInvoiceRow
      .getByText(/Trạng thái case trả hàng[:\s]*Đã duyệt|Return case status[:\s]*Authorized/, {
        exact: false,
      })
      .first()
      .waitFor({ timeout: 15000 });
    await secondInvoiceRow.getByText(manualReturnCloseNote, { exact: false }).first().waitFor({
      state: "detached",
      timeout: 15000,
    });
    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-reopen-button"]').waitFor({
      state: "detached",
      timeout: 15000,
    });
    await secondInvoiceRow.locator('[data-testid="invoice-return-receipt-button"]').waitFor({ timeout: 15000 });
    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-close-button"]').waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText("Kho xử lý", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText("Nhận hàng trả về kho", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText("Còn chờ nhận: 2", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText(secondReturnCaseNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondInvoiceRow.getByText(secondReturnCaseNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondReturnCaseQueueRow.getByText("Đã đóng", { exact: false }).first().waitFor({
      state: "detached",
      timeout: 15000,
    });
    invoiceReturnCaseReopenVerified = true;

    const reopenedCaseReopenResponse = await page.evaluate(
      async ({ targetInvoiceNumber, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Reopened-case invoice lookup failed before reopen guard test." } };
        }

        const response = await fetch("/api/invoices/return-authorizations/reopen", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            reopenNote: "Unexpected duplicate reopen while the return case is already active.",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: secondInvoiceNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      reopenedCaseReopenResponse.status === 400 &&
        reopenedCaseReopenResponse.body?.error ===
          "There is no closed return case to reopen for this invoice.",
      "Active return case still allowed a duplicate reopen.",
    );
    invoiceReturnCaseReopenGuardVerified = true;

    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-close-button"]').click();
    const secondReturnRecloseModal = page.getByRole("dialog").filter({ hasText: "Đóng case trả hàng cho" }).last();
    await secondReturnRecloseModal.waitFor({ timeout: 15000 });
    await fillField(secondReturnRecloseModal, "#closeNote", manualReturnCloseNote);
    const secondReturnRecloseResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/invoices/return-authorizations/close") &&
        response.request().method() === "POST",
      { timeout: 15000 },
    );
    await clickSubmit(secondReturnRecloseModal);
    const secondReturnRecloseResult = await secondReturnRecloseResponse;
    const secondReturnReclosePayload = await secondReturnRecloseResult.json();
    assert(
      secondReturnRecloseResult.status() === 200,
      `Return case reclose failed: ${secondReturnReclosePayload?.error ?? secondReturnRecloseResult.status()}.`,
    );
    await secondReturnRecloseModal.waitFor({ state: "detached", timeout: 15000 });
    await secondInvoiceRow
      .getByText(/Trạng thái case trả hàng[:\s]*Đã đóng|Return case status[:\s]*Closed/, {
        exact: false,
      })
      .first()
      .waitFor({ timeout: 15000 });
    await secondInvoiceRow.getByText(manualReturnCloseNote, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await secondInvoiceRow.locator('[data-testid="invoice-return-receipt-button"]').waitFor({
      state: "detached",
      timeout: 15000,
    });
    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-close-button"]').waitFor({
      state: "detached",
      timeout: 15000,
    });
    await secondInvoiceRow.locator('[data-testid="invoice-return-authorization-reopen-button"]').waitFor({
      timeout: 15000,
    });
    invoiceReturnCaseCloseVerified = true;

    const closedCaseReturnReceiptResponse = await page.evaluate(
      async ({ targetInvoiceNumber, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Closed-case invoice lookup failed before return receipt guard test." } };
        }

        const response = await fetch("/api/invoices/return-receipts", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            quantityReturned: 1,
            note: "Unexpected warehouse receipt after case closure.",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: secondInvoiceNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      closedCaseReturnReceiptResponse.status === 400 &&
        closedCaseReturnReceiptResponse.body?.error ===
          "An open return authorization is required before receiving goods back from an invoice.",
      "Closed return case still allowed warehouse receipt posting.",
    );
    invoiceReturnReceiptClosedCaseGuardVerified = true;

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
    const deleteGuardResponse = await page.evaluate(
      async ({ sessionKey, tenantKey, targetCustomerName, targetSupplierCode, targetProductSku, targetCategoryName }) => {
        const tenantId = window.localStorage.getItem(tenantKey);
        const session = window.localStorage.getItem(sessionKey);
        const accessToken = session ? JSON.parse(session).accessToken : "";

        const request = async (url) => {
          const response = await fetch(url, {
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          });

          return response.json();
        };

        const [customersPayload, suppliersPayload, productsPayload, categoriesPayload] = await Promise.all([
          request(`/api/customers?tenantId=${encodeURIComponent(tenantId ?? "")}`),
          request(`/api/suppliers?tenantId=${encodeURIComponent(tenantId ?? "")}`),
          request(`/api/products?tenantId=${encodeURIComponent(tenantId ?? "")}`),
          request(`/api/product-categories?tenantId=${encodeURIComponent(tenantId ?? "")}`),
        ]);

        const customer = customersPayload.items.find((item) => item.name === targetCustomerName);
        const supplier = suppliersPayload.items.find((item) => item.supplierCode === targetSupplierCode);
        const product = productsPayload.items.find((item) => item.sku === targetProductSku);
        const category = categoriesPayload.items.find((item) => item.name === targetCategoryName);

        const postDelete = async (url, body) => {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(body),
          });

          return {
            status: response.status,
            body: await response.json(),
          };
        };

          return {
            customer: await postDelete("/api/customers/delete", {
              tenantId,
              customerId: customer?.id ?? "",
            }),
          supplier: await postDelete("/api/suppliers/delete", {
            tenantId,
            supplierId: supplier?.id ?? "",
          }),
            product: await postDelete("/api/products/delete", {
              tenantId,
              productId: product?.id ?? "",
            }),
            category: await postDelete("/api/product-categories/delete", {
              tenantId,
              categoryId: category?.id ?? "",
            }),
          };
        },
        {
          sessionKey: sessionStorageKey,
          tenantKey: tenantStorageKey,
          targetCustomerName: customerName,
          targetSupplierCode: supplierCode,
          targetProductSku: productSku,
          targetCategoryName: productCategoryName,
        },
      );
    assert(
      deleteGuardResponse.customer.status === 400 &&
        deleteGuardResponse.customer.body?.error ===
          "The selected customer cannot be deleted because orders or invoices already reference it.",
      "Customer delete guard did not block deletion of a referenced customer.",
    );
    assert(
      deleteGuardResponse.supplier.status === 400 &&
        deleteGuardResponse.supplier.body?.error ===
          "The selected supplier cannot be deleted because purchase orders already reference it.",
      "Supplier delete guard did not block deletion of a referenced supplier.",
    );
      assert(
        deleteGuardResponse.product.status === 400 &&
          deleteGuardResponse.product.body?.error ===
            "The selected product cannot be deleted because sales, purchasing, or inventory already reference it.",
        "Product delete guard did not block deletion of a referenced product.",
      );
      assert(
        deleteGuardResponse.category.status === 400 &&
          deleteGuardResponse.category.body?.error ===
            "The selected product category cannot be deleted because products still reference it.",
        "Product category delete guard did not block deletion of a referenced category.",
      );
      customerDeleteGuardVerified = true;
      supplierDeleteGuardVerified = true;
      productCategoryDeleteGuardVerified = true;
      productDeleteGuardVerified = true;

    await openSection(page, sidebarIndexes.reports, "/dashboard/reports");
    await waitForTenantContext(page, tenantName);
    await waitForStatisticValue(page, "Doanh số gộp", buildAmountPattern(expectedGrossSales));
    await waitForStatisticValue(page, "Đã xuất hóa đơn", buildAmountPattern(expectedInvoicedAmount));
    await waitForStatisticValue(page, "Tiền đã thu", buildAmountPattern(expectedCashCollectedAmount));
    await waitForStatisticValue(page, "Công nợ còn lại", buildAmountPattern(expectedOutstandingReceivablesAmount));
    await waitForStatisticValue(page, "Công nợ hiện tại", buildAmountPattern(expectedCurrentReceivablesAmount));
    await waitForStatisticValue(page, "31-60 ngày", buildAmountPattern(expectedOverdue31To60Amount));
    await waitForStatisticValue(page, "61-90 ngày", buildAmountPattern(0));
    await waitForStatisticValue(page, "Trên 90 ngày", buildAmountPattern(0));
    await waitForStatisticValue(page, /Giá trị tồn kho|Gia tri ton kho/, buildAmountPattern(expectedInventoryValueAmount));
    await waitForStatisticValue(page, "Hóa đơn đã thu đủ", "1");
    await waitForStatisticValue(page, "Hóa đơn còn công nợ", "1");
    await page.getByText("156").first().waitFor({ timeout: 15000 });
    await page.getByText("Hàng tồn kho", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(buildAmountPattern(expectedInventoryValueAmount)).first().waitFor({ timeout: 15000 });
    await page.getByText("111").first().waitFor({ timeout: 15000 });
    await page.getByText("Tiền mặt", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(buildAmountPattern(expectedCashOnHandAmount)).first().waitFor({ timeout: 15000 });
    await page.getByText("112").first().waitFor({ timeout: 15000 });
    await page.getByText("Tiền gửi ngân hàng", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(buildAmountPattern(expectedBankAmount)).first().waitFor({ timeout: 15000 });
    await page.getByText("131").first().waitFor({ timeout: 15000 });
    await page.getByText("Phải thu khách hàng", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(buildAmountPattern(expectedReceivablesLedgerAmount)).first().waitFor({ timeout: 15000 });
    await page.getByText("331").first().waitFor({ timeout: 15000 });
    await page.getByText("Phải trả nhà cung cấp", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(buildAmountPattern(expectedPayablesAmount)).first().waitFor({ timeout: 15000 });
    await page.getByText("3331").first().waitFor({ timeout: 15000 });
    await page.getByText("Thuế GTGT phải nộp", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(buildAmountPattern(expectedVatPayableAmount)).first().waitFor({ timeout: 15000 });
    await page.getByText("511").first().waitFor({ timeout: 15000 });
    await page.getByText("Doanh thu bán hàng", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(buildAmountPattern(expectedRevenueAmount)).first().waitFor({ timeout: 15000 });
    await page.getByText("632").first().waitFor({ timeout: 15000 });
    await page.getByText("Giá vốn hàng bán", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(buildAmountPattern(expectedCogsAmount)).first().waitFor({ timeout: 15000 });
    const categoryPerformanceCard = page.getByTestId("reports-category-performance-card");
    await categoryPerformanceCard.waitFor({ timeout: 15000 });
    await categoryPerformanceCard.getByText(productCategoryName, { exact: false }).waitFor({ timeout: 15000 });
    await categoryPerformanceCard.getByText(buildAmountPattern(expectedGrossSales)).first().waitFor({
      timeout: 15000,
    });
    await page.getByText("Danh mục dẫn đầu", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(productCategoryName, { exact: false }).first().waitFor({ timeout: 15000 });
    reportCategoryPerformanceVerified = true;
    ledgerPostingVerified = true;
    const auditCard = page.locator(".ant-card").filter({ hasText: "Nhật ký kiểm soát tài chính" }).first();
    await auditCard.waitFor({ timeout: 15000 });
    const auditSnapshot = await page.evaluate(async ({ sessionKey, tenantKey }) => {
      const tenantId = window.localStorage.getItem(tenantKey);
      const session = window.localStorage.getItem(sessionKey);
      const accessToken = session ? JSON.parse(session).accessToken : "";
      const response = await fetch(`/api/audit-logs?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        status: response.status,
        body: await response.json(),
      };
    }, {
      sessionKey: sessionStorageKey,
      tenantKey: tenantStorageKey,
    });
    assert(auditSnapshot.status === 200, "Audit log endpoint did not return 200.");
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "order_updated" && item.entityNumber === orderNumber,
      ),
      "Order update audit entry was not recorded.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "purchase_order_received" && item.entityNumber === purchaseOrderNumber,
      ),
      "Purchase order receipt audit entry was not recorded.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_issued" &&
          item.entityNumber === initialInvoiceNumber &&
          item.metadata?.productCategoryName === productCategoryName,
      ),
      "Invoice issue audit entry was not recorded with category context.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_amended" &&
          item.entityNumber === invoiceNumber &&
          item.metadata?.productCategoryName === productCategoryName &&
          item.metadata?.amendmentNote === invoiceAmendmentNote,
      ),
      "Invoice amendment audit entry was not recorded with category and amendment note context.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_reissued" &&
          item.entityNumber === reissuedInvoiceNumber &&
          item.metadata?.productCategoryName === productCategoryName &&
          item.metadata?.amendmentNote === reissueAmendmentNote,
      ),
      "Invoice reissue audit entry was not recorded with category and amendment note context.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_reopened" &&
          item.entityNumber === reissuedInvoiceNumber &&
          item.metadata?.productCategoryName === productCategoryName,
      ),
      "Invoice reopen audit entry was not recorded with category context.",
    );
    invoiceReopenAuditVerified = true;
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "invoice_voided" && item.entityNumber === voidedInvoiceNumber,
      ),
      "Invoice void audit entry was not recorded.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "order_closed" && item.entityNumber === orderNumber,
      ),
      "Order close audit entry was not recorded.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "order_reopened" && item.entityNumber === orderNumber,
      ),
      "Order reopen audit entry was not recorded.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "purchase_order_closed" && item.entityNumber === purchaseOrderNumber,
      ),
      "Purchase order close audit entry was not recorded.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "purchase_order_reopened" && item.entityNumber === purchaseOrderNumber,
      ),
      "Purchase order reopen audit entry was not recorded.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "payment_recorded" &&
          item.entityNumber === invoiceNumber &&
          item.metadata?.productCategoryName === productCategoryName,
      ),
      "Invoice payment audit entry was not recorded with category context.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "collection_follow_up_updated" && item.entityNumber === secondInvoiceNumber,
      ),
      "Collection follow-up audit entry was not recorded.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "collection_action_resolved" && item.entityNumber === secondInvoiceNumber,
      ),
      "Collection resolution audit entry was not recorded.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "approval_requested" && item.metadata?.productCategoryName === productCategoryName,
      ),
      "Approval requested audit entry was not recorded with category context.",
    );
    assert(
      auditSnapshot.body?.items?.some(
        (item) => item.actionType === "approval_approved" || item.actionType === "approval_rejected",
      ),
      "Approval decision audit entry was not recorded.",
    );
    await auditCard.locator(".activity-row").first().waitFor({ timeout: 15000 });
    await auditCard.getByText("SmartERP Founder", { exact: false }).first().waitFor({ timeout: 15000 });
    await auditCard.getByText(productCategoryName, { exact: false }).first().waitFor({ timeout: 15000 });
    await auditCard.getByText(invoiceAmendmentNote, { exact: false }).first().waitFor({ timeout: 15000 });
    await auditCard.getByText("Phát hành lại từ:", { exact: false }).first().waitFor({ timeout: 15000 });
    await auditCard.getByText(reissueAmendmentNote, { exact: false }).first().waitFor({ timeout: 15000 });
    auditTrailVerified = true;
    invoiceAmendAuditVerified = true;
    invoiceReissueAuditVerified = true;
    invoiceAmendmentNoteAuditVerified = true;
    auditCategoryContextVerified = true;
    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    await waitForFormReady(ordersFormCard);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Khách hàng" }), customerName);
    await selectOption(page, ordersFormCard.getByRole("combobox", { name: "* Sản phẩm" }), productName);
    await fillNumberInput(ordersFormCard.getByRole("spinbutton", { name: "* Số lượng" }), creditedOrderQuantity);
    await clickSubmit(ordersFormCard);
    const creditedOrderRow = getListCard(page)
      .locator(".record-row")
      .filter({ hasText: `${productName} x ${creditedOrderQuantity}` })
      .filter({ hasText: /Đã xác nhận|Da xac nhan|Confirmed/ })
      .first();
    await creditedOrderRow.waitFor({ timeout: 15000 });
    creditedOrderNumber = (await creditedOrderRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(creditedOrderNumber.length > 0, "Credit-note order number was not rendered after order creation.");

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    await waitForFormReady(issueInvoiceCard);
    await selectOption(page, issueInvoiceCard.getByRole("combobox", { name: /Đơn hàng/ }), creditedOrderNumber);
    await fillField(issueInvoiceCard, "#issueDate", firstIssueDateInput);
    await fillField(issueInvoiceCard, "#paymentTermDays", firstPaymentTermDays);
    await fillField(issueInvoiceCard, "#taxRatePercent", taxRate);
    await clickSubmit(issueInvoiceCard);
    creditedInvoiceNumber = await findInvoiceNumberByOrderNumber(page, creditedOrderNumber);
    assert(creditedInvoiceNumber.length > 0, "Credit-note invoice number was not rendered after invoice creation.");
    const creditedInvoiceRow = getInvoiceRowByNumber(page, creditedInvoiceNumber);
    await creditedInvoiceRow.waitFor({ timeout: 15000 });

    await waitForFormReady(paymentCard);
    await selectOption(page, paymentCard.getByRole("combobox", { name: /Hóa đơn/ }), creditedInvoiceNumber);
    await selectOption(page, paymentCard.getByRole("combobox", { name: /Phương thức/ }), "Chuyển khoản");
    await fillNumberInput(paymentCard.getByRole("spinbutton", { name: /Số tiền/ }), creditedInvoiceAmount);
    await clickSubmit(paymentCard);
    await waitForLocatorText(creditedInvoiceRow, ["Đã thanh toán"]);

    const missingCreditNoteResponse = await page.evaluate(
      async ({ targetInvoiceNumber, method, creditQuantity, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Credited invoice lookup failed before credit note guard test." } };
        }

        const response = await fetch("/api/invoices/credit", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            method,
            creditQuantity,
            creditNote: "",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: creditedInvoiceNumber,
        method: "bank_transfer",
        creditQuantity: creditedOrderQuantity,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      missingCreditNoteResponse.status === 400 &&
        missingCreditNoteResponse.body?.error === "Credit note is required when crediting a paid invoice.",
      "Invoice credit note guard did not require a business note.",
    );
    invoiceCreditGuardVerified = true;

    assert(
      (await creditedInvoiceRow.locator('[data-testid="invoice-return-authorization-button"]').count()) === 1,
      "Credited invoice did not expose the return authorization action before warehouse receipt.",
    );
    assert(
      (await creditedInvoiceRow.locator('[data-testid="invoice-return-receipt-button"]').count()) === 0,
      "Return receipt action should stay hidden before a return authorization is opened.",
    );
    const missingReturnAuthorizationResponse = await page.evaluate(
      async ({ targetInvoiceNumber, quantityReturned, note, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return {
            status: 0,
            body: { error: "Credited invoice lookup failed before return authorization guard test." },
          };
        }

        const response = await fetch("/api/invoices/return-receipts", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            quantityReturned,
            note,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: creditedInvoiceNumber,
        quantityReturned: creditedOrderQuantity,
        note: manualReturnReceiptNote,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      missingReturnAuthorizationResponse.status === 400 &&
        missingReturnAuthorizationResponse.body?.error ===
          "An open return authorization is required before receiving goods back from an invoice.",
      "Invoice return receipt guard did not require an open return authorization.",
    );
    invoiceReturnReceiptAuthorizationGuardVerified = true;

    await creditedInvoiceRow.locator('[data-testid="invoice-return-authorization-button"]').click();
    const returnAuthorizationModal = page.locator(".ant-modal:visible").last();
    await returnAuthorizationModal.waitFor({ timeout: 15000 });
    await fillNumberInput(returnAuthorizationModal.getByRole("spinbutton").first(), creditedOrderQuantity);
    await fillField(returnAuthorizationModal, "#note", manualReturnAuthorizationNote);
    await returnAuthorizationModal
      .getByRole("button", { name: /Mở case trả hàng|Open Return Case/ })
      .click();
    await creditedInvoiceRow
      .getByText(/Case trả hàng:\s*0\/1|Return case:\s*0\/1/, { exact: false })
      .first()
      .waitFor({ timeout: 15000 });
    await creditedInvoiceRow
      .getByText(/Trạng thái case trả hàng[:\s]*Đã duyệt|Return case status[:\s]*Authorized/, {
        exact: false,
      })
      .first()
      .waitFor({ timeout: 15000 });
    await creditedInvoiceRow.getByText(manualReturnAuthorizationNote, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    assert(
      (await creditedInvoiceRow.locator('[data-testid="invoice-return-authorization-button"]').count()) === 0,
      "Return authorization action should disappear while a return case is open.",
    );
    const creditBeforeReceiptResponse = await page.evaluate(
      async ({ targetInvoiceNumber, method, creditQuantity, creditNote, creditMode, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return {
            status: 0,
            body: { error: "Credited invoice lookup failed before return-credit guard test." },
          };
        }

        const response = await fetch("/api/invoices/credit", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            method,
            creditQuantity,
            creditMode,
            creditNote,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: creditedInvoiceNumber,
        method: "bank_transfer",
        creditQuantity: creditedOrderQuantity,
        creditNote: invoiceCreditNote,
        creditMode: "financial_only",
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      creditBeforeReceiptResponse.status === 400 &&
        creditBeforeReceiptResponse.body?.error ===
          "Credit quantity cannot exceed the received return quantity for the open return case.",
      "Financial-only credit should not settle a return case before warehouse receipt exists.",
    );
    invoiceCreditReceivedReturnGuardVerified = true;
    await creditedInvoiceRow.locator('[data-testid="invoice-return-receipt-button"]').waitFor({ timeout: 15000 });
    invoiceReturnAuthorizationVerified = true;

    await creditedInvoiceRow.locator('[data-testid="invoice-return-receipt-button"]').click();
    const returnReceiptModal = page.locator(".ant-modal:visible").last();
    await returnReceiptModal.waitFor({ timeout: 15000 });
    await fillNumberInput(returnReceiptModal.getByRole("spinbutton").first(), creditedOrderQuantity);
    await fillField(returnReceiptModal, "#note", manualReturnReceiptNote);
    await returnReceiptModal.getByRole("button", { name: "Ghi phiếu nhận trả" }).click();
    await creditedInvoiceRow
      .getByText(/Số lượng đã nhận trả:\s*1|Returned quantity:\s*1/, { exact: false })
      .first()
      .waitFor({ timeout: 15000 });
    await creditedInvoiceRow
      .getByText(/Phiếu nhận trả:\s*1|Return receipts:\s*1/, { exact: false })
      .first()
      .waitFor({ timeout: 15000 });
    await creditedInvoiceRow
      .getByText(/Trạng thái case trả hàng[:\s]*Đã nhận đủ|Return case status[:\s]*Received/, {
        exact: false,
      })
      .first()
      .waitFor({ timeout: 15000 });
    const creditedReturnCaseQueueRow = returnCaseQueueCard.locator(
      `[data-testid="invoice-return-case-row-${creditedInvoiceNumber}"]`,
    );
    await creditedReturnCaseQueueRow.waitFor({ timeout: 15000 });
    const creditedReturnCaseQueueText = (await creditedReturnCaseQueueRow.textContent()) ?? "";
    creditedReturnCaseNumber = creditedReturnCaseQueueText.match(/RMA-\d{8}-[A-Z0-9]{6}/)?.[0] ?? "";
    assert(creditedReturnCaseNumber.length > 0, "Credited invoice return case number was not rendered.");
    await creditedReturnCaseQueueRow.getByText(creditedReturnCaseNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await creditedInvoiceRow.getByText(creditedReturnCaseNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await creditedReturnCaseQueueRow.getByText("Tài chính xử lý", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await creditedReturnCaseQueueRow.getByText("Lập credit note", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await creditedReturnCaseQueueRow.getByText("Còn chờ ghi giảm: 1", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    const returnCaseOwnerFilter = page.getByTestId("invoice-return-case-owner-filter");
    const returnCaseStatusFilter = page.getByTestId("invoice-return-case-status-filter");
    const returnCaseSearchInput = page.getByTestId("invoice-return-case-search-input");
    await selectOption(page, returnCaseOwnerFilter, "Tài chính xử lý");
    await creditedReturnCaseQueueRow.waitFor({ timeout: 15000 });
    await waitForLocatorCount(page, returnCaseQueueCard.locator(`[data-testid="invoice-return-case-row-${secondInvoiceNumber}"]`), 0);
    await selectOption(page, returnCaseOwnerFilter, "Không còn owner mở");
    await secondReturnCaseQueueRow.waitFor({ timeout: 15000 });
    await waitForLocatorCount(page, returnCaseQueueCard.locator(`[data-testid="invoice-return-case-row-${creditedInvoiceNumber}"]`), 0);
    await selectOption(page, returnCaseOwnerFilter, "Tất cả case trả hàng");
    await secondReturnCaseQueueRow.waitFor({ timeout: 15000 });
    await creditedReturnCaseQueueRow.waitFor({ timeout: 15000 });
    invoiceReturnCaseActionOwnerVerified = true;
    invoiceReturnReceiptVerified = true;

    await openSection(page, sidebarIndexes.inventory, "/dashboard/inventory");
    await waitForTenantContext(page, tenantName);
    const creditedInventoryRowAfterManualReturn = getListCard(page)
      .locator(".record-row")
      .filter({ hasText: productName })
      .first();
    await creditedInventoryRowAfterManualReturn.waitFor({ timeout: 15000 });
    await creditedInventoryRowAfterManualReturn
      .getByText(String(expectedRemainingStock), { exact: true })
      .waitFor({ timeout: 15000 });
    await creditedInventoryRowAfterManualReturn
      .getByText(buildAmountPattern(expectedInventoryValueAmount))
      .first()
      .waitFor({ timeout: 15000 });

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    await creditedInvoiceRow.locator('[data-testid="invoice-credit-button"]').click();
    const creditModal = page.locator(".ant-modal:visible").last();
    await creditModal.waitFor({ timeout: 15000 });
    await selectOption(page, creditModal.getByRole("combobox").first(), "Chuyển khoản");
    await fillField(creditModal, "#creditNote", invoiceCreditNote);
    await creditModal.getByRole("button", { name: "Ghi credit note" }).click();
    await creditedInvoiceRow.getByText(/Đã ghi giảm|Da ghi giam/, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await creditedInvoiceRow.getByText(invoiceCreditNote, { exact: false }).first().waitFor({ timeout: 15000 });
    await creditedInvoiceRow.getByText("Chuyển khoản", { exact: false }).first().waitFor({ timeout: 15000 });
    await creditedInvoiceRow
      .getByText(/Phiếu nhận trả:\s*1|Return receipts:\s*1/, { exact: false })
      .first()
      .waitFor({ timeout: 15000 });
    await creditedInvoiceRow
      .getByText(/Trạng thái case trả hàng[:\s]*Đã tất toán|Return case status[:\s]*Settled/, {
        exact: false,
      })
      .first()
      .waitFor({ timeout: 15000 });
    await creditedInvoiceRow
      .getByText(/Số lượng đã tất toán case:\s*1\/1|Return case credited:\s*1\/1/, { exact: false })
      .first()
      .waitFor({ timeout: 15000 });
    assert(
      (await creditedInvoiceRow.getByText(/Phiếu nhận trả:\s*2|Return receipts:\s*2/, { exact: false }).count()) === 0,
      "Credit note restock should not create a second return receipt when goods were already received.",
    );
    const closedReturnCaseRow = returnCaseQueueCard.locator(
      `[data-testid="invoice-return-case-row-${secondInvoiceNumber}"]`,
    );
    const settledReturnCaseRow = returnCaseQueueCard.locator(
      `[data-testid="invoice-return-case-row-${creditedInvoiceNumber}"]`,
    );
    await closedReturnCaseRow.waitFor({ timeout: 15000 });
    await closedReturnCaseRow.getByText("Đã đóng", { exact: false }).first().waitFor({ timeout: 15000 });
    await closedReturnCaseRow.getByText(manualReturnCloseNote, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await settledReturnCaseRow.waitFor({ timeout: 15000 });
    await settledReturnCaseRow.getByText("Đã tất toán", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await settledReturnCaseRow.getByText(creditedReturnCaseNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await settledReturnCaseRow.getByText(invoiceCreditNote, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await returnCaseQueueCard
      .getByText("1 case đã đóng", { exact: false })
      .waitFor({ timeout: 15000 });
    await returnCaseQueueCard
      .getByText("1 case đã tất toán", { exact: false })
      .waitFor({ timeout: 15000 });
    await selectOption(page, returnCaseStatusFilter, "Đã đóng");
    await closedReturnCaseRow.waitFor({ timeout: 15000 });
    await waitForLocatorCount(page, returnCaseQueueCard.locator(`[data-testid="invoice-return-case-row-${creditedInvoiceNumber}"]`), 0);
    await selectOption(page, returnCaseStatusFilter, "Đã tất toán");
    await settledReturnCaseRow.waitFor({ timeout: 15000 });
    await waitForLocatorCount(page, returnCaseQueueCard.locator(`[data-testid="invoice-return-case-row-${secondInvoiceNumber}"]`), 0);
    await selectOption(page, returnCaseStatusFilter, "Tất cả case trả hàng");
    await closedReturnCaseRow.waitFor({ timeout: 15000 });
    await settledReturnCaseRow.waitFor({ timeout: 15000 });
    await returnCaseSearchInput.fill(creditedReturnCaseNumber);
    await settledReturnCaseRow.waitFor({ timeout: 15000 });
    await waitForLocatorCount(page, returnCaseQueueCard.locator(`[data-testid="invoice-return-case-row-${secondInvoiceNumber}"]`), 0);
    await returnCaseSearchInput.fill("");
    await closedReturnCaseRow.waitFor({ timeout: 15000 });
    await settledReturnCaseRow.waitFor({ timeout: 15000 });
    invoiceReturnCaseNumberVerified = true;
    invoiceReturnCaseFilterVerified = true;
    invoiceCreditVerified = true;
    invoiceReturnCaseSettledVerified = true;
    invoiceReturnCaseQueueVerified = true;

    const creditedInvoicePaymentResponse = await page.evaluate(
      async ({ targetInvoiceNumber, amount, sessionKey, tenantKey }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Credited invoice lookup failed before payment guard test." } };
        }

        const response = await fetch("/api/invoices/payments", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            amount,
            method: "bank_transfer",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: creditedInvoiceNumber,
        amount: 1000,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      creditedInvoicePaymentResponse.status === 400 &&
        creditedInvoicePaymentResponse.body?.error === "The selected invoice has been credited.",
      "Credited invoice did not reject new payment creation.",
    );
    creditedInvoicePaymentGuardVerified = true;

    const creditedInvoiceCollectionResponse = await page.evaluate(
      async ({ targetInvoiceNumber, sessionKey, tenantKey, nextActionDate }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Credited invoice lookup failed before collection guard test." } };
        }

        const response = await fetch("/api/invoices/collections", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            followUpStatus: "contacted",
            actionRequired: "call_customer",
            promisedPaymentDate: null,
            nextActionDate,
            collectionNote: "Credited invoice should reject follow-up updates.",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: creditedInvoiceNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        nextActionDate: firstIssueDateInput,
      },
    );
    assert(
      creditedInvoiceCollectionResponse.status === 400 &&
        creditedInvoiceCollectionResponse.body?.error === "The selected invoice has been credited.",
      "Credited invoice did not reject collection updates.",
    );
    creditedInvoiceCollectionGuardVerified = true;

    await openSection(page, sidebarIndexes.reports, "/dashboard/reports");
    await waitForTenantContext(page, tenantName);
    const creditedOrderReportSnapshot = await page.evaluate(async ({ sessionKey, tenantKey }) => {
      const tenantId = window.localStorage.getItem(tenantKey);
      const session = window.localStorage.getItem(sessionKey);
      const accessToken = session ? JSON.parse(session).accessToken : "";
      const response = await fetch(`/api/reports/summary?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        status: response.status,
        body: await response.json(),
      };
    }, {
      sessionKey: sessionStorageKey,
      tenantKey: tenantStorageKey,
    });
    assert(
      creditedOrderReportSnapshot.status === 200 &&
        creditedOrderReportSnapshot.body?.item?.grossSalesAmount === expectedGrossSales &&
        creditedOrderReportSnapshot.body?.item?.topCategorySalesAmount === expectedGrossSales,
      "Report summary did not exclude the fully credited order from sales totals.",
    );
    creditedOrderExcludedFromSalesVerified = true;
    await waitForStatisticValue(page, "Giá trị đã ghi giảm", buildAmountPattern(creditedInvoiceAmount));
    await waitForStatisticValue(page, "Hóa đơn đã ghi giảm", "1");
    const creditAuditSnapshot = await page.evaluate(async ({ sessionKey, tenantKey }) => {
      const tenantId = window.localStorage.getItem(tenantKey);
      const session = window.localStorage.getItem(sessionKey);
      const accessToken = session ? JSON.parse(session).accessToken : "";
      const response = await fetch(`/api/audit-logs?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        status: response.status,
        body: await response.json(),
      };
    }, {
      sessionKey: sessionStorageKey,
      tenantKey: tenantStorageKey,
    });
    assert(
      creditAuditSnapshot.status === 200 &&
        creditAuditSnapshot.body?.items?.some(
          (item) =>
            item.actionType === "invoice_credited" &&
            item.entityNumber === creditedInvoiceNumber &&
            item.metadata?.productCategoryName === productCategoryName &&
            item.metadata?.paymentMethod === "bank_transfer" &&
            item.metadata?.quantity === creditedOrderQuantity &&
            item.metadata?.inventoryValue === 0 &&
            item.metadata?.inventoryRestocked === false &&
            item.metadata?.creditNote === invoiceCreditNote,
        ),
      "Invoice credit audit entry was not recorded with note, method, and category context.",
    );
    assert(
      creditAuditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_return_authorized" &&
          item.entityNumber === creditedInvoiceNumber &&
          item.metadata?.returnCaseNumber === creditedReturnCaseNumber &&
          item.metadata?.productCategoryName === productCategoryName &&
          item.metadata?.quantity === creditedOrderQuantity &&
          item.metadata?.note === manualReturnAuthorizationNote,
      ),
      "Invoice return authorization audit entry was not recorded before warehouse receipt.",
    );
    assert(
      creditAuditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_return_amended" &&
          item.entityNumber === secondInvoiceNumber &&
          item.metadata?.returnCaseNumber === secondReturnCaseNumber &&
          item.metadata?.quantity === 2 &&
          item.metadata?.note === manualReturnAuthorizationAmendNote,
      ),
      "Invoice return amend audit entry was not recorded.",
    );
    assert(
      creditAuditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_return_closed" &&
          item.entityNumber === secondInvoiceNumber &&
          item.metadata?.returnCaseNumber === secondReturnCaseNumber &&
          item.metadata?.quantity === 2 &&
          item.metadata?.note === manualReturnCloseNote,
      ),
      "Invoice return close audit entry was not recorded.",
    );
    assert(
      creditAuditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_return_reopened" &&
          item.entityNumber === secondInvoiceNumber &&
          item.metadata?.returnCaseNumber === secondReturnCaseNumber &&
          item.metadata?.quantity === 2 &&
          item.metadata?.note === manualReturnReopenNote,
      ),
      "Invoice return reopen audit entry was not recorded.",
    );
    assert(
      creditAuditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_return_settled" &&
          item.entityNumber === creditedInvoiceNumber &&
          item.metadata?.returnCaseNumber === creditedReturnCaseNumber &&
          item.metadata?.productCategoryName === productCategoryName &&
          item.metadata?.quantity === creditedOrderQuantity &&
          item.metadata?.returnedQuantity === creditedOrderQuantity &&
          item.metadata?.creditedQuantity === creditedOrderQuantity &&
          item.metadata?.note === invoiceCreditNote,
      ),
      "Invoice return settlement audit entry was not recorded after the credit note.",
    );
    assert(
      creditAuditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_return_received" &&
          item.entityNumber === creditedInvoiceNumber &&
          item.metadata?.returnCaseNumber === creditedReturnCaseNumber &&
          item.metadata?.quantity === creditedOrderQuantity &&
          item.metadata?.inventoryValue === purchaseUnitCost * creditedOrderQuantity &&
          item.metadata?.note === manualReturnReceiptNote,
      ),
      "Invoice return receipt audit entry was not recorded for the independent warehouse receipt.",
    );
    assert(
      !creditAuditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_return_received" &&
          item.entityNumber === creditedInvoiceNumber &&
          item.metadata?.note === invoiceCreditNote,
      ),
      "Credit note should not emit a second return receipt audit entry when no extra stock was restocked.",
    );
    assert(
      creditAuditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "order_returned" &&
          item.entityNumber === creditedOrderNumber &&
          item.metadata?.productCategoryName === productCategoryName &&
          item.metadata?.quantity === creditedOrderQuantity &&
          item.metadata?.inventoryValue === purchaseUnitCost * creditedOrderQuantity &&
          item.metadata?.note === invoiceCreditNote,
      ),
      "Order return audit entry was not recorded after the full credit note.",
    );
    await page.getByText(invoiceCreditNote, { exact: false }).first().waitFor({ timeout: 15000 });
    invoiceCreditAuditVerified = true;
    invoiceReturnAuthorizationAuditVerified = true;
    invoiceReturnCaseAmendAuditVerified = true;
    invoiceReturnCaseCloseAuditVerified = true;
    invoiceReturnCaseReopenAuditVerified = true;
    invoiceReturnCaseSettlementAuditVerified = true;
    invoiceReturnReceiptVerified = true;
    creditedOrderReturnAuditVerified = true;
    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    const returnedOrderRow = getListCard(page).locator(".record-row").filter({ hasText: creditedOrderNumber }).first();
    await returnedOrderRow.waitFor({ timeout: 15000 });
    await returnedOrderRow.getByText(/Đã trả hàng|Da tra hang|Returned/, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    assert(
      (await returnedOrderRow.locator('[data-testid="order-cancel-button"]').count()) === 0 &&
        (await returnedOrderRow.locator('[data-testid="order-close-button"]').count()) === 0 &&
        (await returnedOrderRow.locator('[data-testid="order-reopen-button"]').count()) === 0,
      "Returned orders should not expose lifecycle action buttons.",
    );
    creditedOrderReturnedVerified = true;
    const returnedOrderCancelResponse = await page.evaluate(
      async ({ targetOrderNumber, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!targetOrder || !tenantId) {
          return { status: 0, body: { error: "Returned order lookup failed before cancel guard test." } };
        }

        const response = await fetch("/api/orders/cancel", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: creditedOrderNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      returnedOrderCancelResponse.status === 400 &&
        returnedOrderCancelResponse.body?.error === "The selected order has already been returned.",
      "Returned order did not reject cancellation.",
    );
    creditedOrderCancelGuardVerified = true;
    const returnedOrderCloseResponse = await page.evaluate(
      async ({ targetOrderNumber, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!targetOrder || !tenantId) {
          return { status: 0, body: { error: "Returned order lookup failed before close guard test." } };
        }

        const response = await fetch("/api/orders/close", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: creditedOrderNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      returnedOrderCloseResponse.status === 400 &&
        returnedOrderCloseResponse.body?.error === "The selected order has already been returned.",
      "Returned order did not reject closing.",
    );
    creditedOrderCloseGuardVerified = true;
    await openSection(page, sidebarIndexes.inventory, "/dashboard/inventory");
    await waitForTenantContext(page, tenantName);
    const creditedInventoryRow = getListCard(page).locator(".record-row").filter({ hasText: productName }).first();
    await creditedInventoryRow.waitFor({ timeout: 15000 });
    await creditedInventoryRow.getByText(String(expectedRemainingStock), { exact: true }).waitFor({ timeout: 15000 });
    await creditedInventoryRow
      .getByText(buildAmountPattern(expectedInventoryValueAmount))
      .first()
      .waitFor({ timeout: 15000 });
    invoiceCreditInventoryRestockVerified = true;

    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    const partialCreditOrderFormCard = getFormCard(page);
    await waitForFormReady(partialCreditOrderFormCard);
    await selectOption(page, partialCreditOrderFormCard.getByRole("combobox", { name: /Khách hàng/ }), customerName);
    await selectOption(page, partialCreditOrderFormCard.getByRole("combobox", { name: /Sản phẩm/ }), productName);
    await fillNumberInput(
      partialCreditOrderFormCard.getByRole("spinbutton", { name: /\* Số lượng/ }),
      partialCreditOrderQuantity,
    );
    await clickSubmit(partialCreditOrderFormCard);
    const partialCreditOrderRow = getListCard(page)
      .locator(".record-row")
      .filter({ hasText: `${productName} x ${partialCreditOrderQuantity}` })
      .filter({ hasText: /Đã xác nhận|Da xac nhan|Confirmed/ })
      .first();
    await partialCreditOrderRow.waitFor({ timeout: 15000 });
    partialCreditOrderNumber = (await partialCreditOrderRow.locator("strong").first().textContent())?.trim() ?? "";
    assert(partialCreditOrderNumber.length > 0, "Partial-credit order number was not rendered after order creation.");

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    await waitForFormReady(issueInvoiceCard);
    await selectOption(page, issueInvoiceCard.getByRole("combobox", { name: /Đơn hàng/ }), partialCreditOrderNumber);
    await fillField(issueInvoiceCard, "#issueDate", firstIssueDateInput);
    await fillField(issueInvoiceCard, "#paymentTermDays", firstPaymentTermDays);
    await fillField(issueInvoiceCard, "#taxRatePercent", taxRate);
    await clickSubmit(issueInvoiceCard);
    partialCreditInvoiceNumber = await findInvoiceNumberByOrderNumber(page, partialCreditOrderNumber);
    assert(partialCreditInvoiceNumber.length > 0, "Partial-credit invoice number was not rendered after issue.");
    const partialCreditInvoiceRow = getInvoiceRowByNumber(page, partialCreditInvoiceNumber);
    await partialCreditInvoiceRow.waitFor({ timeout: 15000 });

    await waitForFormReady(paymentCard);
    await selectOption(page, paymentCard.getByRole("combobox", { name: /Hóa đơn/ }), partialCreditInvoiceNumber);
    await selectOption(page, paymentCard.getByRole("combobox", { name: /Phương thức/ }), "Chuyển khoản");
    await fillNumberInput(paymentCard.getByRole("spinbutton", { name: /Số tiền/ }), partialCreditInvoiceAmount);
    await clickSubmit(paymentCard);
    await partialCreditInvoiceRow.getByText("Đã thanh toán", { exact: false }).waitFor({ timeout: 15000 });

    await partialCreditInvoiceRow.locator('[data-testid="invoice-credit-button"]').click();
    const partialCreditModal = page.locator(".ant-modal:visible").last();
    await partialCreditModal.waitFor({ timeout: 15000 });
    await selectOption(page, partialCreditModal.getByRole("combobox").first(), "Chuyển khoản");
    await fillNumberInput(partialCreditModal.getByRole("spinbutton").first(), partialCreditQuantity);
    await selectOption(
      page,
      partialCreditModal.getByRole("combobox").nth(1),
      partialCreditMode === "financial_only" ? "Chỉ điều chỉnh tài chính" : "Nhập lại hàng về kho",
    );
    await fillField(partialCreditModal, "#creditNote", partialInvoiceCreditNote);
    await partialCreditModal.getByRole("button", { name: "Ghi credit note" }).click();
    await openSection(page, sidebarIndexes.approvals, "/dashboard/approvals");
    await waitForTenantContext(page, tenantName);
    await waitForLocatorText(
      approvalsPendingCard,
      [
        partialCreditInvoiceNumber,
        "Large financial-only credit note requires founder approval.",
        productCategoryName,
      ],
      30000,
    );
    const invoiceCreditApprovalRow = approvalsPendingCard
      .locator(".activity-row")
      .filter({ hasText: partialCreditInvoiceNumber })
      .first();
    await invoiceCreditApprovalRow.waitFor({ timeout: 30000 });
    await waitForLocatorText(invoiceCreditApprovalRow, [
      partialCreditInvoiceNumber,
      "Large financial-only credit note requires founder approval.",
      productCategoryName,
    ]);
    await invoiceCreditApprovalRow.getByRole("button", { name: "Duyệt" }).click();
    await waitForLocatorCount(
      page,
      approvalsPendingCard.locator(".activity-row").filter({ hasText: partialCreditInvoiceNumber }),
      0,
    );
    await approvalsHistoryCard.getByText(partialCreditInvoiceNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await approvalsHistoryCard.getByText("Đã duyệt", { exact: false }).first().waitFor({ timeout: 15000 });
    invoiceCreditApprovalVerified = true;
    await dismissGlobalAlerts(page);
    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    await partialCreditInvoiceRow.getByText(/Đã ghi giảm một phần|Partially Credited/, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await partialCreditInvoiceRow.getByText(partialInvoiceCreditNote, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await partialCreditInvoiceRow.getByText(buildAmountPattern(partialCreditAmount)).first().waitFor({ timeout: 15000 });
    await partialCreditInvoiceRow
      .getByText(/Số lượng ghi giảm không nhập kho:\s*2|Credited without return:\s*2/, { exact: false })
      .first()
      .waitFor({ timeout: 15000 });
    assert(
      (await partialCreditInvoiceRow.getByText(/Phiếu nhận trả:|Return receipts:/, { exact: false }).count()) === 0,
      "Partial financial credit should not render a return receipt count on the invoice row.",
    );
    partialInvoiceCreditVerified = true;
    partialInvoiceReturnReceiptSuppressedVerified = true;

    const partialCreditCollectionResponse = await page.evaluate(
      async ({ targetInvoiceNumber, sessionKey, tenantKey, nextActionDate }) => {
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
        const targetInvoice = invoicesPayload.items.find((item) => item.invoiceNumber === targetInvoiceNumber);

        if (!targetInvoice || !tenantId) {
          return { status: 0, body: { error: "Partial-credit invoice lookup failed before collection guard test." } };
        }

        const response = await fetch("/api/invoices/collections", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            invoiceId: targetInvoice.id,
            followUpStatus: "contacted",
            actionRequired: "call_customer",
            promisedPaymentDate: null,
            nextActionDate,
            collectionNote: "Partially credited invoice should reject follow-up updates.",
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetInvoiceNumber: partialCreditInvoiceNumber,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        nextActionDate: firstIssueDateInput,
      },
    );
    assert(
      partialCreditCollectionResponse.status === 400 &&
        partialCreditCollectionResponse.body?.error === "The selected invoice has been credited.",
      "Partially credited invoice did not reject collection updates.",
    );
    partialInvoiceCreditCollectionGuardVerified = true;

    await openSection(page, sidebarIndexes.reports, "/dashboard/reports");
    await waitForTenantContext(page, tenantName);
    const partialCreditReportSnapshot = await page.evaluate(async ({ sessionKey, tenantKey }) => {
      const tenantId = window.localStorage.getItem(tenantKey);
      const session = window.localStorage.getItem(sessionKey);
      const accessToken = session ? JSON.parse(session).accessToken : "";
      const response = await fetch(`/api/reports/summary?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        status: response.status,
        body: await response.json(),
      };
    }, {
      sessionKey: sessionStorageKey,
      tenantKey: tenantStorageKey,
    });
    assert(
      partialCreditReportSnapshot.status === 200 &&
        partialCreditReportSnapshot.body?.item?.grossSalesAmount === expectedGrossSalesAfterPartialCredit &&
        partialCreditReportSnapshot.body?.item?.invoicedAmount === expectedInvoicedAmountAfterPartialCredit &&
        partialCreditReportSnapshot.body?.item?.cashCollectedAmount === expectedCashCollectedAmountAfterPartialCredit &&
        partialCreditReportSnapshot.body?.item?.creditedAmount === expectedCreditedAmountAfterPartialCredit,
      "Report summary did not reflect the partial credit note.",
    );
    partialInvoiceCreditReportVerified = true;

    const partialCreditAuditSnapshot = await page.evaluate(async ({ sessionKey, tenantKey }) => {
      const tenantId = window.localStorage.getItem(tenantKey);
      const session = window.localStorage.getItem(sessionKey);
      const accessToken = session ? JSON.parse(session).accessToken : "";
      const response = await fetch(`/api/audit-logs?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        status: response.status,
        body: await response.json(),
      };
    }, {
      sessionKey: sessionStorageKey,
      tenantKey: tenantStorageKey,
    });
    assert(
      partialCreditAuditSnapshot.status === 200 &&
        partialCreditAuditSnapshot.body?.items?.some(
          (item) =>
            item.actionType === "invoice_credited" &&
            item.entityNumber === partialCreditInvoiceNumber &&
            item.metadata?.quantity === partialCreditQuantity &&
            item.metadata?.amount === partialCreditAmount &&
            item.metadata?.creditedQuantity === partialCreditQuantity &&
            item.metadata?.creditedAmount === partialCreditAmount &&
            item.metadata?.returnedQuantity === 0 &&
            item.metadata?.inventoryValue === 0 &&
            item.metadata?.inventoryRestocked === false &&
            item.metadata?.creditNote === partialInvoiceCreditNote,
        ),
      "Partial financial credit audit entry did not capture the no-restock context.",
    );
    assert(
      !partialCreditAuditSnapshot.body?.items?.some(
        (item) =>
          item.actionType === "invoice_return_received" &&
          item.entityNumber === partialCreditInvoiceNumber,
      ),
      "Partial financial credit must not record an invoice return receipt audit entry.",
    );
    assert(
      !partialCreditAuditSnapshot.body?.items?.some(
        (item) => item.actionType === "order_returned" && item.entityNumber === partialCreditOrderNumber,
      ),
      "Partial credit must not mark the order as fully returned.",
    );
    partialInvoiceCreditAuditVerified = true;
    partialInvoiceCreditOrderStateVerified = true;

    await openSection(page, sidebarIndexes.inventory, "/dashboard/inventory");
    await waitForTenantContext(page, tenantName);
    const partialCreditInventoryRow = getListCard(page).locator(".record-row").filter({ hasText: productName }).first();
    await partialCreditInventoryRow.waitFor({ timeout: 15000 });
    await partialCreditInventoryRow
      .getByText(String(expectedRemainingStockAfterPartialCredit), { exact: true })
      .waitFor({ timeout: 15000 });
    await partialCreditInventoryRow
      .getByText(buildAmountPattern(expectedInventoryValueAfterPartialCredit))
      .first()
      .waitFor({ timeout: 15000 });
    partialInvoiceCreditNoRestockVerified = true;

    await openSection(page, sidebarIndexes.operations, "/dashboard/operations");
    await page.getByRole("heading", { name: "Vận hành" }).waitFor({ timeout: 15000 });
    await page.getByText("Mức sẵn sàng pilot", { exact: false }).waitFor({ timeout: 30000 });
    await page.getByText("Smoke gate gần nhất", { exact: false }).waitFor({ timeout: 30000 });
    await page.getByText(tenantName, { exact: false }).first().waitFor({ timeout: 30000 });
    const operationsSnapshot = await page.evaluate(async ({ sessionKey }) => {
      const rawSession = window.localStorage.getItem(sessionKey);
      const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
      const response = await fetch("/api/operations/status", {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        status: response.status,
        body: await response.json(),
      };
    }, { sessionKey: sessionStorageKey });
    assert(operationsSnapshot.status === 200, "Operations status endpoint did not return 200 for founder.");
    assert(
      Array.isArray(operationsSnapshot.body?.item?.tenants) &&
        operationsSnapshot.body.item.tenants.some((tenant) => tenant.tenantName === tenantName),
      "Operations status did not include the current smoke tenant.",
    );
    assert(
      operationsSnapshot.body?.item?.database?.path?.includes("smarterp-next.db"),
      "Operations status did not expose the runtime database path.",
    );
    assert(
      Array.isArray(operationsSnapshot.body?.item?.runtimeServices) &&
        operationsSnapshot.body.item.runtimeServices.length >= 2,
      "Operations status did not expose runtime service health.",
    );
    assert(
      Array.isArray(operationsSnapshot.body?.item?.artifacts) &&
        operationsSnapshot.body.item.artifacts.some((artifact) => artifact.key === "database" && artifact.exists === true),
      "Operations status did not expose operational artifacts.",
    );
    assert(
      Array.isArray(operationsSnapshot.body?.item?.artifacts) &&
        operationsSnapshot.body.item.artifacts.some(
          (artifact) => artifact.key === "build-summary" && artifact.exists === true,
        ),
      "Operations status did not expose the build summary artifact.",
    );
    assert(
      operationsSnapshot.body?.item?.build &&
        typeof operationsSnapshot.body.item.build.summaryPath === "string" &&
        operationsSnapshot.body.item.build.totalAssetCount > 0 &&
        operationsSnapshot.body.item.build.totalJavaScriptBytes > 0 &&
        operationsSnapshot.body.item.build.budget?.passed === true,
      "Operations status did not expose a healthy build summary payload.",
    );
    assert(
      Array.isArray(operationsSnapshot.body?.item?.readiness?.checks) &&
        operationsSnapshot.body.item.readiness.checks.some((check) => check.key === "api-health" && check.passed === true) &&
        operationsSnapshot.body.item.readiness.checks.some((check) => check.key === "web-health" && check.passed === true) &&
        operationsSnapshot.body.item.readiness.checks.some((check) => check.key === "build-budget" && check.passed === true),
      "Operations status did not expose healthy pilot readiness checks.",
    );
    assert(
      operationsSnapshot.body?.item?.smoke === null ||
        (
          typeof operationsSnapshot.body.item.smoke?.verifiedCheckCount === "number" &&
          operationsSnapshot.body.item.smoke.verifiedCheckCount >= 0
        ),
      "Operations status returned an invalid smoke summary payload.",
    );
    operationsStatusVerified = true;
    await page.getByText("Dịch vụ runtime", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByText("Artifact vận hành", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByText("API health", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByText("Web shell", { exact: false }).waitFor({ timeout: 15000 });
    operationsReadinessVerified = true;
    await page.getByTestId("operations-build-summary").waitFor({ timeout: 15000 });
    await page.getByText("Tóm tắt build", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByText("antd-vendor", { exact: false }).first().waitFor({ timeout: 15000 });
    operationsBuildVerified = true;
    await openSection(page, sidebarIndexes.setup, "/dashboard/setup");
    await waitForTenantContext(page, tenantName);
    const handoffCard = page.getByTestId("setup-handoff-card");
    const handoffDownloadPromise = page.waitForEvent("download", { timeout: 15000 });
    await handoffCard.getByRole("button", { name: "Tải gói bàn giao" }).click();
    const handoffDownload = await handoffDownloadPromise;
    await handoffDownload.saveAs(handoffPackageDownloadPath);
    const handoffPackage = JSON.parse(await fs.readFile(handoffPackageDownloadPath, "utf8"));
    assert(
      handoffPackage.version === "smarterp-next-pilot-handoff-v1",
      "Pilot handoff package did not expose the expected version.",
    );
    assert(
      handoffPackage.tenant?.name === tenantName && handoffPackage.tenant?.slug === tenantSlug,
      "Pilot handoff package did not include the selected tenant.",
    );
    assert(
      Array.isArray(handoffPackage.roleAccounts) &&
        handoffPackage.roleAccounts.some((item) => item.email === demoEmail) &&
        handoffPackage.roleAccounts.some((item) => item.email === salesEmail),
      "Pilot handoff package did not include the expected role accounts.",
    );
    assert(
      Array.isArray(handoffPackage.runbook) && handoffPackage.runbook.length >= 5,
      "Pilot handoff package did not include the expected runbook steps.",
    );
    assert(
      handoffPackage.tenantSnapshot?.orders?.some((item) => item.orderNumber === orderNumber) &&
        handoffPackage.tenantSnapshot?.invoices?.some((item) => item.invoiceNumber === secondInvoiceNumber),
      "Pilot handoff package did not embed the expected tenant snapshot.",
    );
    assert(
      handoffPackage.operations?.readinessLevel &&
        typeof handoffPackage.operations.smokePassed === "boolean",
      "Pilot handoff package did not include operations readiness context.",
    );
    assert(
      handoffPackage.snapshotSummary?.purchaseOrderReceiptCount ===
        handoffPackage.tenantSnapshot?.purchaseOrderReceipts?.length &&
        handoffPackage.snapshotSummary?.invoicePaymentCount ===
          handoffPackage.tenantSnapshot?.invoicePayments?.length &&
        handoffPackage.snapshotSummary?.invoiceReturnAuthorizationCount ===
          handoffPackage.tenantSnapshot?.invoiceReturnAuthorizations?.length &&
        handoffPackage.snapshotSummary?.invoiceReturnReceiptCount ===
          handoffPackage.tenantSnapshot?.invoiceReturnReceipts?.length &&
        handoffPackage.snapshotSummary?.approvalCount === handoffPackage.tenantSnapshot?.approvalRequests?.length &&
        handoffPackage.snapshotSummary?.auditLogCount === handoffPackage.tenantSnapshot?.auditLogs?.length &&
        handoffPackage.snapshotSummary?.journalEntryCount === handoffPackage.tenantSnapshot?.journalEntries?.length &&
        handoffPackage.snapshotSummary.invoiceReturnAuthorizationCount > 0 &&
        handoffPackage.snapshotSummary.invoiceReturnReceiptCount > 0,
      "Pilot handoff package did not summarize the expected transaction and control replay counts.",
    );
    await handoffCard.getByText(tenantName, { exact: false }).waitFor({ timeout: 15000 });
    pilotHandoffPackageVerified = true;
    pilotHandoffTransactionSummaryVerified = true;
    pilotHandoffReturnAuthorizationSummaryVerified = true;
    await openSection(page, sidebarIndexes.setup, "/dashboard/setup");
    await waitForTenantContext(page, tenantName);
    const recoveryCard = page.getByTestId("setup-recovery-card");
    const downloadPromise = page.waitForEvent("download", { timeout: 15000 });
    await recoveryCard.getByRole("button", { name: "Tải snapshot JSON" }).click();
    const snapshotDownload = await downloadPromise;
    await snapshotDownload.saveAs(exportSnapshotDownloadPath);
    const exportedSnapshot = JSON.parse(await fs.readFile(exportSnapshotDownloadPath, "utf8"));
    assert(
      exportedSnapshot?.tenant?.name === tenantName,
      "Tenant export snapshot did not include the expected tenant.",
    );
    assert(
      exportedSnapshot?.customers?.some((item) => item.name === customerName),
      "Tenant export snapshot did not include the imported customer.",
    );
    assert(
      exportedSnapshot?.suppliers?.some((item) => item.supplierCode === supplierCode),
      "Tenant export snapshot did not include the imported supplier.",
    );
    assert(
      exportedSnapshot?.products?.some((item) => item.sku === productSku),
      "Tenant export snapshot did not include the imported product.",
    );
    assert(
      exportedSnapshot?.orders?.some((item) => item.orderNumber === orderNumber) &&
        exportedSnapshot?.orders?.some((item) => item.orderNumber === secondOrderNumber),
      "Tenant export snapshot did not include the created sales orders.",
    );
    assert(
      exportedSnapshot?.purchaseOrders?.some((item) => item.purchaseOrderNumber === purchaseOrderNumber),
      "Tenant export snapshot did not include the purchase order.",
    );
    assert(
      exportedSnapshot?.purchaseOrderReceipts?.some(
        (item) =>
          item.purchaseOrderNumber === purchaseOrderNumber &&
          item.quantityReceived === stockInQuantity &&
          item.totalCost === expectedReceivedPurchaseValue,
      ),
      "Tenant export snapshot did not include the purchase order receipt history.",
    );
    assert(
      exportedSnapshot?.invoices?.some((item) => item.invoiceNumber === invoiceNumber) &&
        exportedSnapshot?.invoices?.some((item) => item.invoiceNumber === secondInvoiceNumber),
      "Tenant export snapshot did not include the created invoices.",
    );
    assert(
      exportedSnapshot?.invoicePayments?.some(
        (item) => item.invoiceNumber === invoiceNumber && item.amount === partialPaymentAmount,
      ) &&
        exportedSnapshot?.invoicePayments?.some(
          (item) => item.invoiceNumber === creditedInvoiceNumber && item.amount === creditedInvoiceAmount,
        ),
      "Tenant export snapshot did not include the invoice payment history.",
    );
    assert(
      exportedSnapshot?.auditLogs?.length > 0 &&
        exportedSnapshot?.journalEntries?.length > 0,
      "Tenant export snapshot did not include audit or ledger data.",
    );
    assert(
      exportedSnapshot?.invoiceReturnAuthorizations?.some(
        (item) =>
          item.invoiceNumber === creditedInvoiceNumber &&
          item.caseNumber === creditedReturnCaseNumber &&
          item.quantityAuthorized === creditedOrderQuantity &&
          item.quantityReceived === creditedOrderQuantity &&
          item.quantityCredited === creditedOrderQuantity &&
          item.status === "settled" &&
          item.note === manualReturnAuthorizationNote,
      ) &&
        exportedSnapshot?.invoiceReturnAuthorizations?.some(
          (item) =>
            item.invoiceNumber === secondInvoiceNumber &&
            item.caseNumber === secondReturnCaseNumber &&
            item.quantityAuthorized === 2 &&
            item.status === "closed" &&
            item.note === manualReturnAuthorizationAmendNote &&
            item.closeNote === manualReturnCloseNote,
      ) &&
        !exportedSnapshot?.invoiceReturnAuthorizations?.some(
          (item) => item.invoiceNumber === partialCreditInvoiceNumber,
        ),
      "Tenant export snapshot did not preserve the expected invoice return authorization history.",
    );
    assert(
      exportedSnapshot?.invoiceReturnReceipts?.some(
        (item) =>
          item.invoiceNumber === creditedInvoiceNumber &&
          item.quantityReturned === creditedOrderQuantity &&
          item.inventoryValue === purchaseUnitCost * creditedOrderQuantity &&
          item.source === "manual" &&
          item.note === manualReturnReceiptNote,
      ) &&
        !exportedSnapshot?.invoiceReturnReceipts?.some((item) => item.invoiceNumber === partialCreditInvoiceNumber),
      "Tenant export snapshot did not preserve the expected independent return receipt history.",
    );
    onboardingExportVerified = true;
    exportedInvoiceReturnAuthorizationsVerified = true;
    exportedInvoiceReturnReceiptsVerified = true;
    const originalTenantId = await page.evaluate((key) => window.localStorage.getItem(key), tenantStorageKey);
    await openSection(page, sidebarIndexes.setup, "/dashboard/setup");
    await waitForTenantContext(page, tenantName);
    const restoreCard = page.getByTestId("setup-recovery-card");
    await restoreCard.locator("#targetName").waitFor({ timeout: 15000 });
    await fillField(restoreCard, "#targetName", restoredTenantName);
    await fillField(restoreCard, "#targetSlug", restoredTenantSlug);
    await fillField(restoreCard, "#targetIndustry", restoredTenantIndustry);
    await setLargeFieldValue(restoreCard, "#snapshotJson", JSON.stringify(exportedSnapshot, null, 2));
    const previewResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/onboarding/restore/preview") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await restoreCard.getByRole("button", { name: "Xem trước khôi phục" }).click();
    const previewResult = await previewResponse;
    const restorePreviewPayload = (await previewResult.json()).item;
    await restoreCard.getByText(restoredTenantName, { exact: false }).waitFor({ timeout: 15000 });
    await restoreCard.getByText("Slug đích đang sẵn sàng", { exact: false }).waitFor({ timeout: 15000 });
    assert(
      Array.isArray(restorePreviewPayload?.restoredScopes) &&
        restorePreviewPayload.restoredScopes.includes("orders") &&
        restorePreviewPayload.restoredScopes.includes("purchaseOrders") &&
        restorePreviewPayload.restoredScopes.includes("purchaseOrderReceipts") &&
        restorePreviewPayload.restoredScopes.includes("invoices") &&
        restorePreviewPayload.restoredScopes.includes("invoicePayments") &&
        restorePreviewPayload.restoredScopes.includes("invoiceReturnAuthorizations") &&
        restorePreviewPayload.restoredScopes.includes("invoiceReturnReceipts") &&
        restorePreviewPayload.restoredScopes.includes("collections") &&
        restorePreviewPayload.restoredScopes.includes("approvals") &&
        restorePreviewPayload.restoredScopes.includes("audit") &&
        restorePreviewPayload.restoredScopes.includes("ledger"),
      "Restore preview did not promote transaction scopes into the baseline replay set.",
    );
    assert(
      Array.isArray(restorePreviewPayload?.pendingScopes) &&
        restorePreviewPayload.pendingScopes.length === 0,
      "Restore preview still reported deferred scopes after full replay was enabled.",
    );
    assert(
      restorePreviewPayload.purchaseOrderReceiptCount === exportedSnapshot.purchaseOrderReceipts.length &&
        restorePreviewPayload.invoicePaymentCount === exportedSnapshot.invoicePayments.length &&
        restorePreviewPayload.invoiceReturnAuthorizationCount ===
          exportedSnapshot.invoiceReturnAuthorizations.length &&
        restorePreviewPayload.invoiceReturnReceiptCount === exportedSnapshot.invoiceReturnReceipts.length &&
        restorePreviewPayload.collectionActivityCount === exportedSnapshot.collectionActivities.length &&
        restorePreviewPayload.approvalCount === exportedSnapshot.approvalRequests.length &&
        restorePreviewPayload.auditLogCount === exportedSnapshot.auditLogs.length &&
        restorePreviewPayload.journalEntryCount === exportedSnapshot.journalEntries.length,
      "Restore preview counts did not match the exported control and transaction graph.",
    );
    const restoreButton = restoreCard.getByRole("button", { name: "Khôi phục baseline" });
    assert(!(await restoreButton.isDisabled()), "Restore button stayed disabled after preview.");
    baselineRestorePreviewVerified = true;
    baselineRestoreTransactionReplayVerified = true;
    baselineRestoreControlReplayVerified = true;
    baselineRestoreReturnAuthorizationScopeVerified = true;
    const restoreResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/onboarding/restore") &&
        response.request().method() === "POST" &&
        response.status() === 201,
      { timeout: 15000 },
    );
    await restoreButton.click();
    const restoreResultResponse = await restoreResponse;
    const restoreResultPayload = (await restoreResultResponse.json()).item;
    assert(
      restoreResultPayload.restoredOrders === exportedSnapshot.orders.length &&
        restoreResultPayload.restoredPurchaseOrders === exportedSnapshot.purchaseOrders.length &&
        restoreResultPayload.restoredPurchaseOrderReceipts === exportedSnapshot.purchaseOrderReceipts.length &&
        restoreResultPayload.restoredInvoices === exportedSnapshot.invoices.length &&
        restoreResultPayload.restoredInvoicePayments === exportedSnapshot.invoicePayments.length &&
        restoreResultPayload.restoredInvoiceReturnAuthorizations ===
          exportedSnapshot.invoiceReturnAuthorizations.length &&
        restoreResultPayload.restoredInvoiceReturnReceipts === exportedSnapshot.invoiceReturnReceipts.length &&
        restoreResultPayload.restoredCollectionActivities === exportedSnapshot.collectionActivities.length &&
        restoreResultPayload.restoredApprovalRequests === exportedSnapshot.approvalRequests.length &&
        restoreResultPayload.restoredAuditLogs === exportedSnapshot.auditLogs.length &&
        restoreResultPayload.restoredJournalEntries === exportedSnapshot.journalEntries.length,
      "Restore result did not replay the expected transaction and control graph counts.",
    );
    await restoreCard.getByText(restoredTenantName, { exact: false }).waitFor({ timeout: 15000 });
    await waitForTenantContext(page, restoredTenantName);
    await openSection(page, sidebarIndexes.customers, "/dashboard/customers");
    await waitForTenantContext(page, restoredTenantName);
    await waitForLocatorText(getListCard(page), [customerName], 30000);
    await openSection(page, sidebarIndexes.suppliers, "/dashboard/suppliers");
    await waitForTenantContext(page, restoredTenantName);
    await waitForLocatorText(getListCard(page), [supplierName], 30000);
    await openSection(page, sidebarIndexes.products, "/dashboard/products");
    await waitForTenantContext(page, restoredTenantName);
    await waitForLocatorText(getListCard(page), [productName], 30000);
    await openSection(page, sidebarIndexes.inventory, "/dashboard/inventory");
    await waitForTenantContext(page, restoredTenantName);
    const restoredInventoryRow = getListCard(page).locator(".record-row").filter({ hasText: productName }).first();
    await restoredInventoryRow.waitFor({ timeout: 15000 });
    await restoredInventoryRow.getByText(String(expectedRestoreRemainingStock), { exact: true }).waitFor({
      timeout: 15000,
    });
    await restoredInventoryRow
      .getByText(buildAmountPattern(expectedRestoreInventoryValueAmount))
      .first()
      .waitFor({ timeout: 15000 });
    const restoredTransactionSnapshot = await page.evaluate(
      async ({ sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";

        if (!tenantId || !accessToken) {
          return null;
        }

        const headers = {
          authorization: `Bearer ${accessToken}`,
        };

        const [ordersResponse, purchaseOrdersResponse, invoicesResponse] = await Promise.all([
          fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId)}`, { headers }),
          fetch(`/api/purchase-orders?tenantId=${encodeURIComponent(tenantId)}`, { headers }),
          fetch(`/api/invoices?tenantId=${encodeURIComponent(tenantId)}`, { headers }),
        ]);

        const [ordersPayload, purchaseOrdersPayload, invoicesPayload] = await Promise.all([
          ordersResponse.json(),
          purchaseOrdersResponse.json(),
          invoicesResponse.json(),
        ]);

        return {
          ordersStatus: ordersResponse.status,
          purchaseOrdersStatus: purchaseOrdersResponse.status,
          invoicesStatus: invoicesResponse.status,
          orderCount: ordersPayload.items?.length ?? 0,
          returnedOrderCount:
            ordersPayload.items?.filter((item) => item.status === "returned").length ?? 0,
          purchaseOrderCount: purchaseOrdersPayload.items?.length ?? 0,
          invoiceCount: invoicesPayload.items?.length ?? 0,
          creditedInvoiceCount:
            invoicesPayload.items?.filter((item) => item.status === "credited").length ?? 0,
          invoiceReturnAuthorizationCount:
            invoicesPayload.items?.reduce(
              (sum, item) => sum + (item.returnAuthorizationCount ?? 0),
              0,
            ) ?? 0,
          invoiceReturnReceiptCount:
            invoicesPayload.items?.reduce(
              (sum, item) => sum + (item.returnReceiptCount ?? 0),
              0,
            ) ?? 0,
        };
      },
      {
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      restoredTransactionSnapshot &&
        restoredTransactionSnapshot.ordersStatus === 200 &&
        restoredTransactionSnapshot.purchaseOrdersStatus === 200 &&
        restoredTransactionSnapshot.invoicesStatus === 200 &&
        restoredTransactionSnapshot.orderCount === exportedSnapshot.orders.length &&
        restoredTransactionSnapshot.returnedOrderCount >= 1 &&
        restoredTransactionSnapshot.purchaseOrderCount === exportedSnapshot.purchaseOrders.length &&
        restoredTransactionSnapshot.invoiceCount === exportedSnapshot.invoices.length &&
        restoredTransactionSnapshot.creditedInvoiceCount >= 1 &&
        restoredTransactionSnapshot.invoiceReturnAuthorizationCount ===
          exportedSnapshot.invoiceReturnAuthorizations.length &&
        restoredTransactionSnapshot.invoiceReturnReceiptCount === exportedSnapshot.invoiceReturnReceipts.length,
      "Restored tenant API snapshot did not preserve the expected transaction graph.",
    );
    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, restoredTenantName);
    const restoredCreditedInvoiceNumber = await page.evaluate(
      async ({ sessionKey, tenantKey, targetCreditNote, targetQuantity }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const response = await fetch(`/api/invoices?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = await response.json();
        const targetInvoice = payload.items.find(
          (item) =>
            item.status === "credited" &&
            item.creditNote === targetCreditNote &&
            item.returnAuthorizationStatus === "settled" &&
            item.returnAuthorizationCreditedQuantity === targetQuantity,
        );
        return targetInvoice?.invoiceNumber ?? "";
      },
      {
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        targetCreditNote: invoiceCreditNote,
        targetQuantity: creditedOrderQuantity,
      },
    );
    assert(
      restoredCreditedInvoiceNumber.length > 0,
      "Restored tenant did not expose the settled return-case invoice through the invoices API.",
    );
    const restoredCreditedInvoiceRow = getListCard(page)
      .locator(".record-row")
      .filter({ hasText: restoredCreditedInvoiceNumber })
      .first();
    await restoredCreditedInvoiceRow.waitFor({ timeout: 15000 });
    await restoredCreditedInvoiceRow
      .getByText(/Trạng thái case trả hàng[:\s]*Đã tất toán|Return case status[:\s]*Settled/, {
        exact: false,
      })
      .first()
      .waitFor({ timeout: 15000 });
    await restoredCreditedInvoiceRow
      .getByText(/Số lượng đã tất toán case:\s*1\/1|Return case credited:\s*1\/1/, { exact: false })
      .first()
      .waitFor({ timeout: 15000 });
    await restoredCreditedInvoiceRow.getByText(creditedReturnCaseNumber, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    baselineRestoreVerified = true;
    await openSection(page, sidebarIndexes.setup, "/dashboard/setup");
    await waitForTenantContext(page, restoredTenantName);
    const recoveryDrillCard = page.getByTestId("setup-recovery-drill-card");
    await recoveryDrillCard.waitFor({ timeout: 15000 });
    await page.getByTestId("setup-recovery-drill-download").waitFor({ timeout: 15000 });
    const recoveryDrillDownloadPromise = page.waitForEvent("download", { timeout: 15000 });
    await page.getByTestId("setup-recovery-drill-download").click();
    const recoveryDrillDownload = await recoveryDrillDownloadPromise;
    await recoveryDrillDownload.saveAs(recoveryDrillDownloadPath);
    const recoveryDrillReport = JSON.parse(await fs.readFile(recoveryDrillDownloadPath, "utf8"));
    assert(
      recoveryDrillReport.version === "smarterp-next-recovery-drill-v1",
      "Recovery drill report did not expose the expected version.",
    );
    assert(
      recoveryDrillReport.restoredTenant?.name === restoredTenantName,
      "Recovery drill report did not include the restored tenant.",
    );
    assert(
      recoveryDrillReport.passCount === recoveryDrillReport.totalCount &&
        Array.isArray(recoveryDrillReport.checks) &&
        recoveryDrillReport.checks.every((check) => check.passed === true),
      "Recovery drill report did not pass every recovery check.",
    );
    assert(
      recoveryDrillReport.baselineCounts?.invoiceReturnAuthorizations ===
        exportedSnapshot.invoiceReturnAuthorizations.length &&
        recoveryDrillReport.restoredCounts?.invoiceReturnAuthorizations ===
          exportedSnapshot.invoiceReturnAuthorizations.length &&
      recoveryDrillReport.baselineCounts?.invoiceReturnReceipts === exportedSnapshot.invoiceReturnReceipts.length &&
        recoveryDrillReport.restoredCounts?.invoiceReturnReceipts === exportedSnapshot.invoiceReturnReceipts.length &&
        recoveryDrillReport.baselineCounts?.approvalRequests === exportedSnapshot.approvalRequests.length &&
        recoveryDrillReport.baselineCounts?.auditLogs === exportedSnapshot.auditLogs.length &&
        recoveryDrillReport.baselineCounts?.journalEntries === exportedSnapshot.journalEntries.length &&
        recoveryDrillReport.restoredCounts?.approvalRequests === exportedSnapshot.approvalRequests.length &&
        recoveryDrillReport.restoredCounts?.auditLogs === exportedSnapshot.auditLogs.length &&
        recoveryDrillReport.restoredCounts?.journalEntries === exportedSnapshot.journalEntries.length &&
        recoveryDrillReport.checks.some(
          (check) => check.key === "invoice-return-authorizations-restored" && check.passed === true,
        ) &&
        recoveryDrillReport.checks.some((check) => check.key === "invoice-return-receipts-restored" && check.passed === true) &&
        recoveryDrillReport.checks.some((check) => check.key === "invoice-payments-restored" && check.passed === true) &&
        recoveryDrillReport.checks.some((check) => check.key === "purchase-order-receipts-restored" && check.passed === true) &&
        recoveryDrillReport.checks.some((check) => check.key === "approvals-restored" && check.passed === true) &&
        recoveryDrillReport.checks.some((check) => check.key === "audit-restored" && check.passed === true) &&
        recoveryDrillReport.checks.some((check) => check.key === "journal-restored" && check.passed === true) &&
        Array.isArray(recoveryDrillReport.pendingScopes) &&
        recoveryDrillReport.pendingScopes.length === 0,
      "Recovery drill report did not confirm restored control and transaction replay correctly.",
    );
    recoveryDrillVerified = true;
    recoveryDrillTransactionReplayVerified = true;
    recoveryDrillControlReplayVerified = true;
    recoveryDrillReturnAuthorizationScopeVerified = true;
    await page.evaluate(
      ({ key, tenantId }) => {
        if (tenantId) {
          window.localStorage.setItem(key, tenantId);
        }
      },
      { key: tenantStorageKey, tenantId: originalTenantId },
    );
    await openApp(page);
    await waitForTenantContext(page, tenantName);
    await waitForStatisticValue(page, "Công nợ quá hạn", buildAmountPattern(expectedOverdue31To60Amount));
    await waitForStatisticValue(page, "Hóa đơn còn công nợ", "1");
    await waitForStatisticValue(page, "Phê duyệt chờ xử lý", "0");
    await page.getByText(secondInvoiceNumber, { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText(customerName, { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText("Việc cần làm hôm nay", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByText("Hôm nay chưa có việc thu hồi nào đến hạn xử lý.", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByText("Nhật ký thu hồi gần đây", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByText(escalatedCollectionNote, { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText("Cần escalated", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText("Đã xử lý", { exact: false }).first().waitFor({ timeout: 15000 });

    const storedWorkspaceStateBeforeLogout = await page.evaluate(
      ({ sessionKey, tenantKey }) => ({
        session: window.localStorage.getItem(sessionKey),
        tenantId: window.localStorage.getItem(tenantKey),
      }),
      { sessionKey: sessionStorageKey, tenantKey: tenantStorageKey },
    );
    assert(Boolean(storedWorkspaceStateBeforeLogout.session), "Session was not persisted before logout.");
      assert(Boolean(storedWorkspaceStateBeforeLogout.tenantId), "Selected tenant was not persisted before logout.");

      await logout(page);

    await loginAs(page, financeEmail, demoPassword);
    await page.locator(".shell-header").getByText("Tài chính", { exact: false }).waitFor({ timeout: 15000 });
    await page.evaluate(
      ({ key, tenantId }) => window.localStorage.setItem(key, tenantId),
      { key: tenantStorageKey, tenantId: originalTenantId },
    );
    await openDirectRoute(page, "/dashboard");
    await waitForTenantContext(page, tenantName);
    await verifyRoleOnboardingCard(page, "finance", ["Làn kiểm soát tài chính", "Hóa đơn", "Báo cáo"]);
    financeRoleOnboardingVerified = true;
    await logout(page);

    await loginAs(page, salesEmail, demoPassword);
      await page.locator(".shell-header").getByText("Kinh doanh", { exact: false }).waitFor({ timeout: 15000 });
      await page.evaluate(
        ({ key, tenantId }) => window.localStorage.setItem(key, tenantId),
        { key: tenantStorageKey, tenantId: originalTenantId },
      );
      await openDirectRoute(page, "/dashboard");
      await waitForTenantContext(page, tenantName);
      await verifyRoleOnboardingCard(page, "sales", ["Làn thực thi kinh doanh", "Khách hàng", "Đơn hàng"]);
      salesRoleOnboardingVerified = true;
      assert(
        (await page.locator(".ant-layout-sider .ant-menu-item").getByText("Khách hàng", { exact: false }).count()) > 0,
        "Sales role did not receive customer navigation.",
      );
    assert(
      (await page.locator(".ant-layout-sider .ant-menu-item").getByText("Báo cáo", { exact: false }).count()) === 0,
      "Sales role should not see reports navigation.",
    );
    assert(
      (await page.locator(".ant-layout-sider .ant-menu-item").getByText("Phê duyệt", { exact: false }).count()) === 0,
      "Sales role should not see approvals navigation.",
    );
    assert(
      (await page.locator(".ant-layout-sider .ant-menu-item").getByText("Vận hành", { exact: false }).count()) === 0,
      "Sales role should not see operations navigation.",
    );
    rbacSalesVisibilityVerified = true;
    await openDirectRoute(page, "/dashboard/operations");
    await page.getByText("Không có quyền truy cập", { exact: false }).waitFor({ timeout: 15000 });
    await openDirectRoute(page, "/dashboard/reports");
    await page.getByText("Không có quyền truy cập", { exact: false }).waitFor({ timeout: 15000 });
    const salesForbiddenInvoiceResponse = await page.evaluate(
      async ({ sessionKey, tenantKey, issueDate }) => {
        const tenantId = window.localStorage.getItem(tenantKey);
        const rawSession = window.localStorage.getItem(sessionKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";

        const response = await fetch("/api/invoices", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            tenantId,
            orderId: "forbidden-order",
            taxRatePercent: 10,
            issueDate,
            paymentTermDays: 30,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        issueDate: firstIssueDateInput,
      },
    );
    assert(
      salesForbiddenInvoiceResponse.status === 403 && salesForbiddenInvoiceResponse.body?.error === "Forbidden.",
      "Sales role did not receive a backend 403 for invoice issuance.",
    );
    const salesForbiddenImportResponse = await page.evaluate(
      async ({ sessionKey, tenantKey, csvText }) => {
        const tenantId = window.localStorage.getItem(tenantKey);
        const rawSession = window.localStorage.getItem(sessionKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";

        const response = await fetch("/api/onboarding/import", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            tenantId,
            dataset: "customers",
            csvText,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        csvText: customerImportCsv,
      },
    );
    assert(
      salesForbiddenImportResponse.status === 403 &&
        salesForbiddenImportResponse.body?.error === "Forbidden.",
      "Sales role did not receive a backend 403 for onboarding import.",
    );
    const salesForbiddenRestorePreviewResponse = await page.evaluate(
      async ({ sessionKey, snapshot }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";

        const response = await fetch("/api/onboarding/restore/preview", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            snapshot,
            targetTenant: {
              name: `${snapshot.tenant.name} Sales Preview Blocked`,
              slug: `${snapshot.tenant.slug}-sales-preview-blocked`,
              industry: snapshot.tenant.industry,
            },
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        sessionKey: sessionStorageKey,
        snapshot: exportedSnapshot,
      },
    );
    assert(
      salesForbiddenRestorePreviewResponse.status === 403 &&
        salesForbiddenRestorePreviewResponse.body?.error === "Forbidden.",
      "Sales role did not receive a backend 403 for snapshot restore preview.",
    );
    rbacSalesBlockedRestorePreviewVerified = true;
    const salesForbiddenRestoreResponse = await page.evaluate(
      async ({ sessionKey, snapshot }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";

        const response = await fetch("/api/onboarding/restore", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            snapshot,
            targetTenant: {
              name: `${snapshot.tenant.name} Sales Blocked`,
              slug: `${snapshot.tenant.slug}-sales-blocked`,
              industry: snapshot.tenant.industry,
            },
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        sessionKey: sessionStorageKey,
        snapshot: exportedSnapshot,
      },
    );
    assert(
      salesForbiddenRestoreResponse.status === 403 &&
        salesForbiddenRestoreResponse.body?.error === "Forbidden.",
      "Sales role did not receive a backend 403 for snapshot restore.",
    );
    rbacSalesBlockedRouteVerified = true;
    await logout(page);

    await loginAs(page, warehouseEmail, demoPassword);
    await page.locator(".shell-header").getByText("Kho vận", { exact: false }).waitFor({ timeout: 15000 });
    await page.evaluate(
      ({ key, tenantId }) => window.localStorage.setItem(key, tenantId),
      { key: tenantStorageKey, tenantId: originalTenantId },
    );
    await openDirectRoute(page, "/dashboard");
    await waitForTenantContext(page, tenantName);
    await verifyRoleOnboardingCard(page, "warehouse", ["Làn kiểm soát kho vận", "Tồn kho", "Đơn mua"]);
    warehouseRoleOnboardingVerified = true;
    await openDirectRoute(page, "/dashboard/purchase-orders");
    await waitForTenantContext(page, tenantName);
    await page
      .locator(".page-column-stack .ant-card")
      .nth(0)
      .getByText("Vai trò hiện tại chỉ được xem dữ liệu trong phân hệ này", { exact: false })
      .waitFor({ timeout: 15000 });
    const warehouseForbiddenPurchaseOrderResponse = await page.evaluate(
      async ({ sessionKey, tenantKey, expectedReceiptDate }) => {
        const tenantId = window.localStorage.getItem(tenantKey);
        const rawSession = window.localStorage.getItem(sessionKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const response = await fetch("/api/purchase-orders", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            supplierId: "forbidden-supplier",
            productId: "forbidden-product",
            quantityOrdered: 3,
            unitCost: 19000,
            expectedReceiptDate,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
        expectedReceiptDate: expectedReceiptDateInput,
      },
    );
    assert(
      warehouseForbiddenPurchaseOrderResponse.status === 403 &&
        warehouseForbiddenPurchaseOrderResponse.body?.error === "Forbidden.",
      "Warehouse role did not receive a backend 403 for purchase-order creation.",
    );
    rbacWarehouseBlockedMutationVerified = true;
    await logout(page);

    await loginAs(page, collectorEmail, demoPassword);
    await page.locator(".shell-header").getByText("Thu hồi công nợ", { exact: false }).waitFor({ timeout: 15000 });
    await page.evaluate(
      ({ key, tenantId }) => window.localStorage.setItem(key, tenantId),
      { key: tenantStorageKey, tenantId: originalTenantId },
    );
    await openDirectRoute(page, "/dashboard");
    await waitForTenantContext(page, tenantName);
    await verifyRoleOnboardingCard(page, "collector", ["Làn worklist thu hồi công nợ", "Hóa đơn", "Báo cáo"]);
    collectorRoleOnboardingVerified = true;
    await openDirectRoute(page, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    await page
      .locator(".page-column-stack .ant-card")
      .nth(0)
      .getByText("Vai trò hiện tại chỉ được xem dữ liệu trong phân hệ này", { exact: false })
      .waitFor({ timeout: 15000 });
    await page
      .locator(".page-column-stack .ant-card")
      .nth(1)
      .getByText("Vai trò hiện tại chỉ được xem dữ liệu trong phân hệ này", { exact: false })
      .waitFor({ timeout: 15000 });
    await page
      .locator(".page-column-stack .ant-card")
      .nth(2)
      .locator("button[type='submit']")
      .waitFor({ timeout: 15000 });
    assert(
      (await page.locator(".ant-layout-sider .ant-menu-item").getByText("Báo cáo", { exact: false }).count()) > 0,
      "Collector role did not receive reports navigation.",
    );
    rbacCollectorActionSplitVerified = true;
    await logout(page);

    await loginAs(page, demoEmail, demoPassword);
    await page.evaluate(
      ({ key, tenantId }) => window.localStorage.setItem(key, tenantId),
      { key: tenantStorageKey, tenantId: originalTenantId },
    );
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".page-stack").waitFor({ timeout: 15000 });
    const founderReturnTopUpResponse = await page.evaluate(
      async ({ quantity, targetProductName, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        if (!tenantId || !accessToken) {
          return { status: 0, body: { error: "Founder return top-up is missing tenant/session context." } };
        }

        const inventoryResponse = await fetch(`/api/inventory?tenantId=${encodeURIComponent(tenantId)}`, {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });
        const inventoryPayload = await inventoryResponse.json();
        const targetInventory = inventoryPayload.items.find((item) => item.productName === targetProductName);

        if (!targetInventory) {
          return { status: 0, body: { error: "Founder return top-up could not find the target product inventory." } };
        }

        const response = await fetch("/api/inventory/adjustments", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            productId: targetInventory.productId,
            direction: "in",
            quantity,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        quantity: founderReturnTopUpQuantity,
        targetProductName: productName,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      founderReturnTopUpResponse.status === 200 || founderReturnTopUpResponse.status === 201,
      `Founder return inventory top-up failed: ${founderReturnTopUpResponse.body?.error ?? founderReturnTopUpResponse.status}.`,
    );
    await openSection(page, sidebarIndexes.orders, "/dashboard/orders");
    await waitForTenantContext(page, tenantName);
    const founderReturnOrderFormCard = getFormCard(page);
    await waitForFormReady(founderReturnOrderFormCard);
    const founderReturnOrderCreatePayload = await page.evaluate(
      async ({ existingOrderNumbers, targetCustomerName, targetProductName, targetQuantity, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";

        if (!tenantId || !accessToken) {
          return { status: 0, body: { error: "Founder return order setup is missing tenant/session context." } };
        }

        const headers = { authorization: `Bearer ${accessToken}` };
        const [customersResponse, productsResponse] = await Promise.all([
          fetch(`/api/customers?tenantId=${encodeURIComponent(tenantId)}`, { headers }),
          fetch(`/api/products?tenantId=${encodeURIComponent(tenantId)}`, { headers }),
        ]);
        const [customersPayload, productsPayload] = await Promise.all([customersResponse.json(), productsResponse.json()]);
        const targetCustomer = customersPayload.items.find((item) => item.name === targetCustomerName);
        const targetProduct = productsPayload.items.find((item) => item.name === targetProductName);

        if (!targetCustomer || !targetProduct) {
          return { status: 0, body: { error: "Founder return order setup could not resolve customer/product ids." } };
        }

        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            tenantId,
            customerId: targetCustomer.id,
            productId: targetProduct.id,
            quantity: targetQuantity,
          }),
        });

        const responseBody = await response.json();

        if (response.status !== 201) {
          return {
            status: response.status,
            body: responseBody,
          };
        }

        if (responseBody?.item?.orderNumber) {
          return {
            status: response.status,
            body: responseBody,
          };
        }

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId)}`, {
          headers: { authorization: `Bearer ${accessToken}` },
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder =
          ordersPayload.items
            .filter(
              (item) =>
                item.customerName === targetCustomerName &&
                item.productName === targetProductName &&
                item.quantity === targetQuantity &&
                item.status === "confirmed" &&
                !existingOrderNumbers.includes(item.orderNumber),
            )
            .sort((left, right) => Date.parse(right.createdAt ?? 0) - Date.parse(left.createdAt ?? 0))[0] ?? null;

        return {
          status: response.status,
          body: responseBody,
          resolvedOrderNumber: targetOrder?.orderNumber ?? "",
        };
      },
      {
        existingOrderNumbers: [orderNumber, secondOrderNumber, voidedOrderNumber, creditedOrderNumber, partialCreditOrderNumber],
        targetCustomerName: customerName,
        targetProductName: productName,
        targetQuantity: founderReturnOrderQuantity,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      founderReturnOrderCreatePayload?.status === 201,
      `Founder return order creation failed: ${founderReturnOrderCreatePayload?.body?.error ?? founderReturnOrderCreatePayload?.status ?? "unknown"}.`,
    );
    founderReturnOrderNumber =
      founderReturnOrderCreatePayload?.body?.item?.orderNumber ??
      founderReturnOrderCreatePayload?.resolvedOrderNumber ??
      "";
    assert(founderReturnOrderNumber.length > 0, "Founder-approval return order number was not resolved after order creation.");

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    const founderReturnInvoiceCreateResponse = await page.evaluate(
      async ({ targetOrderNumber, issueDate, paymentTermDays, taxRatePercent, sessionKey, tenantKey }) => {
        const rawSession = window.localStorage.getItem(sessionKey);
        const tenantId = window.localStorage.getItem(tenantKey);
        const accessToken = rawSession ? JSON.parse(rawSession).accessToken : "";
        const headers = {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        };

        const ordersResponse = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
          headers,
        });
        const ordersPayload = await ordersResponse.json();
        const targetOrder = ordersPayload.items.find((item) => item.orderNumber === targetOrderNumber);

        if (!tenantId || !targetOrder?.id) {
          return { status: 0, body: { error: "Founder return order lookup failed before invoice creation." } };
        }

        const response = await fetch("/api/invoices", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId,
            orderId: targetOrder.id,
            issueDate,
            paymentTermDays,
            taxRatePercent,
          }),
        });

        return {
          status: response.status,
          body: await response.json(),
        };
      },
      {
        targetOrderNumber: founderReturnOrderNumber,
        issueDate: firstIssueDateInput,
        paymentTermDays: firstPaymentTermDays,
        taxRatePercent: taxRate,
        sessionKey: sessionStorageKey,
        tenantKey: tenantStorageKey,
      },
    );
    assert(
      founderReturnInvoiceCreateResponse.status === 201,
      `Founder return invoice creation failed: ${founderReturnInvoiceCreateResponse.body?.error ?? founderReturnInvoiceCreateResponse.status}`,
    );
    await openDirectRoute(page, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    founderReturnInvoiceNumber = await findInvoiceNumberByOrderNumber(page, founderReturnOrderNumber);
    assert(founderReturnInvoiceNumber.length > 0, "Founder-approval return invoice number was not rendered.");
    const founderReturnInvoiceRow = getInvoiceRowByNumber(page, founderReturnInvoiceNumber);
    await founderReturnInvoiceRow.waitFor({ timeout: 15000 });

    await waitForFormReady(paymentCard);
    await selectOption(page, paymentCard.getByRole("combobox", { name: /Hóa đơn/ }), founderReturnInvoiceNumber);
    await selectOption(page, paymentCard.getByRole("combobox", { name: /Phương thức/ }), "Chuyển khoản");
    await fillNumberInput(paymentCard.getByRole("spinbutton", { name: /Số tiền/ }), founderReturnInvoiceAmount);
    await clickSubmit(paymentCard);
    await founderReturnInvoiceRow.getByText("Đã thanh toán", { exact: false }).waitFor({ timeout: 15000 });

    await founderReturnInvoiceRow.locator('[data-testid="invoice-return-authorization-button"]').click();
    const founderReturnAuthorizationModal = page
      .getByRole("dialog")
      .filter({ hasText: "Duyệt trả hàng cho" })
      .last();
    await founderReturnAuthorizationModal.waitFor({ timeout: 15000 });
    await fillNumberInput(founderReturnAuthorizationModal.getByRole("spinbutton").first(), founderReturnOrderQuantity);
    await fillField(founderReturnAuthorizationModal, "#note", founderReturnAuthorizationNote);
    await clickSubmit(founderReturnAuthorizationModal);
    await founderReturnInvoiceRow.getByText(founderReturnAuthorizationNote, { exact: false }).first().waitFor({
      timeout: 15000,
    });

    await founderReturnInvoiceRow.locator('[data-testid="invoice-return-receipt-button"]').click();
    const founderReturnReceiptModal = page.locator(".ant-modal:visible").last();
    await founderReturnReceiptModal.waitFor({ timeout: 15000 });
    await fillNumberInput(founderReturnReceiptModal.getByRole("spinbutton").first(), founderReturnOrderQuantity);
    await fillField(founderReturnReceiptModal, "#note", founderReturnReceiptNote);
    await founderReturnReceiptModal.getByRole("button", { name: "Ghi phiếu nhận trả" }).click();
    await founderReturnInvoiceRow
      .getByText(new RegExp(`Số lượng đã nhận trả:\\s*${founderReturnOrderQuantity}|Returned quantity:\\s*${founderReturnOrderQuantity}`), {
        exact: false,
      })
      .first()
      .waitFor({ timeout: 15000 });

    await founderReturnInvoiceRow.locator('[data-testid="invoice-credit-button"]').click();
    const founderReturnCreditModal = page.locator(".ant-modal:visible").last();
    await founderReturnCreditModal.waitFor({ timeout: 15000 });
    await selectOption(page, founderReturnCreditModal.getByRole("combobox").first(), "Chuyển khoản");
    await fillNumberInput(founderReturnCreditModal.getByRole("spinbutton").first(), founderReturnOrderQuantity);
    await selectOption(page, founderReturnCreditModal.getByRole("combobox").nth(1), "Chỉ điều chỉnh tài chính");
    await fillField(founderReturnCreditModal, "#creditNote", founderReturnCreditNote);
    await founderReturnCreditModal.getByRole("button", { name: "Ghi credit note" }).click();

    const founderReturnCaseQueueRow = returnCaseQueueCard.locator(
      `[data-testid="invoice-return-case-row-${founderReturnInvoiceNumber}"]`,
    );
    await founderReturnCaseQueueRow.waitFor({ timeout: 15000 });
    const founderReturnCaseQueueText = (await founderReturnCaseQueueRow.textContent()) ?? "";
    founderReturnCaseNumber = founderReturnCaseQueueText.match(/RMA-\d{8}-[A-Z0-9]{6}/)?.[0] ?? "";
    assert(founderReturnCaseNumber.length > 0, "Founder-approval return case number was not rendered.");
    await founderReturnCaseQueueRow.getByText("Founder phê duyệt", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await founderReturnCaseQueueRow
      .getByText("Founder duyệt credit note trước khi tài chính tất toán", { exact: false })
      .first()
      .waitFor({ timeout: 15000 });
    await founderReturnCaseQueueRow
      .getByText("Large financial-only credit note requires founder approval.", { exact: false })
      .first()
      .waitFor({ timeout: 15000 });
    await returnCaseQueueCard.getByText("1 case chờ founder duyệt", { exact: false }).waitFor({ timeout: 15000 });
    await selectOption(page, page.getByTestId("invoice-return-case-owner-filter"), "Founder phê duyệt");
    await founderReturnCaseQueueRow.waitFor({ timeout: 15000 });
    await returnCaseQueueCard.getByText("Hiển thị 1 / 3 case", { exact: false }).waitFor({ timeout: 15000 });
    await selectOption(page, page.getByTestId("invoice-return-case-owner-filter"), "Tất cả case trả hàng");
    await founderReturnCaseQueueRow.waitFor({ timeout: 15000 });
    invoiceReturnCaseFounderApprovalVerified = true;
    await dismissGlobalAlerts(page);

    await openSection(page, sidebarIndexes.approvals, "/dashboard/approvals");
    await waitForTenantContext(page, tenantName);
    await waitForLocatorText(
      approvalsPendingCard,
      [founderReturnInvoiceNumber, "Large financial-only credit note requires founder approval."],
      30000,
    );
    const founderReturnApprovalRow = approvalsPendingCard
      .locator(".activity-row")
      .filter({ hasText: founderReturnInvoiceNumber })
      .first();
    await founderReturnApprovalRow.waitFor({ timeout: 30000 });
    await waitForLocatorText(founderReturnApprovalRow, [
      founderReturnInvoiceNumber,
      "Large financial-only credit note requires founder approval.",
    ]);
    await founderReturnApprovalRow.getByRole("button", { name: "Duyệt" }).click();
    await waitForLocatorCount(
      page,
      approvalsPendingCard.locator(".activity-row").filter({ hasText: founderReturnInvoiceNumber }),
      0,
    );

    await openSection(page, sidebarIndexes.invoices, "/dashboard/invoices");
    await waitForTenantContext(page, tenantName);
    await founderReturnInvoiceRow.getByText(founderReturnCreditNote, { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await founderReturnCaseQueueRow.getByText("Đã tất toán", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await founderReturnCaseQueueRow.getByText("Không còn owner mở", { exact: false }).first().waitFor({
      timeout: 15000,
    });
    await openDirectRoute(page, "/dashboard/operations");
    await waitForTenantContext(page, tenantName);
    await page.locator("[data-testid='operations-build-summary']").waitFor({ timeout: 15000 });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await logout(page);

    const storedWorkspaceStateAfterLogout = await page.evaluate(
      ({ sessionKey, tenantKey }) => ({
        session: window.localStorage.getItem(sessionKey),
        tenantId: window.localStorage.getItem(tenantKey),
      }),
      { sessionKey: sessionStorageKey, tenantKey: tenantStorageKey },
    );
    assert(!storedWorkspaceStateAfterLogout.session, "Session persisted after logout.");
    assert(!storedWorkspaceStateAfterLogout.tenantId, "Selected tenant persisted after logout.");
    const unauthorizedTenantsResponse = await page.request.get(`${baseUrl}/api/tenants`);
    const unauthorizedTenantsBody = await unauthorizedTenantsResponse.json();
    assert(
      unauthorizedTenantsResponse.status() === 401,
      `Expected /api/tenants to return 401 after logout, received ${unauthorizedTenantsResponse.status()}.`,
    );
    assert(
      unauthorizedTenantsBody?.error === "Authentication required.",
      "Protected API did not return the expected auth error after logout.",
    );
    unauthorizedApiBlockedVerified = true;

    await page.goto(`${baseUrl}/dashboard/reports`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForURL(/\/login$/, { timeout: 15000 });
    await page.locator(".login-card").waitFor({ timeout: 15000 });

    const summary = {
      checkedAt: new Date().toISOString(),
      baseUrl,
      tenantName,
      customerName,
      customerEmail,
      supplierName,
      supplierEmail,
      supplierCode,
      productName,
      productSku,
      purchaseOrderNumber,
      orderNumber,
      invoiceNumber,
      secondOrderNumber,
      secondInvoiceNumber,
      voidedOrderNumber,
      voidedInvoiceNumber,
      reissuedInvoiceNumber,
      invalidLoginVerified,
      staleSessionRejectedVerified,
      loginReloadVerified: true,
      localeReloadVerified,
      duplicateTenantRejectedVerified,
      setupWorkspaceVerified,
      pilotHandoffPackageVerified,
      pilotHandoffTransactionSummaryVerified,
      onboardingImportVerified,
      onboardingExportVerified,
      baselineRestorePreviewVerified,
      baselineRestoreTransactionReplayVerified,
      baselineRestoreControlReplayVerified,
      baselineRestoreVerified,
      recoveryDrillVerified,
      recoveryDrillTransactionReplayVerified,
      recoveryDrillControlReplayVerified,
      customerCrudVerified,
      supplierCrudVerified,
      productCategoryCrudVerified,
      productCrudVerified,
      productImageVerified,
      purchaseOrderImageVerified,
      inventoryImageVerified,
      orderImageVerified,
      invoiceImageVerified,
      customerDeleteGuardVerified,
      supplierDeleteGuardVerified,
      productCategoryDeleteGuardVerified,
      productDeleteGuardVerified,
      duplicateSupplierRejectedVerified,
      duplicateProductRejectedVerified,
      orderEditVerified,
      orderEditGuardVerified,
      orderCancellationVerified,
      orderCancelGuardVerified,
      canceledOrderInvoiceGuardVerified,
      supplierAndPurchaseOrdersVerified,
      purchaseOrderEditVerified,
      purchaseOrderEditGuardVerified,
      purchaseOrderCancellationVerified,
      purchaseOrderCancelGuardVerified,
      purchaseOrderCloseVerified,
      purchaseOrderCloseGuardVerified,
      purchaseOrderReopenVerified,
      purchaseOrderReopenGuardVerified,
      canceledPurchaseOrderReceiptGuardVerified,
      purchaseReceiptApprovalVerified,
      purchaseReceiptVerified,
      purchaseReceiptGuardVerified,
      purchaseOrderCategoryFlowVerified,
      inventoryAdjustmentRejectionVerified,
      inventoryValuationVerified,
      inventoryCategoryFlowVerified,
      invoicePaymentApprovalVerified,
      paymentGuardVerified,
      partialSettlementVerified,
      finalSettlementVerified,
      orderCloseVerified,
      orderCloseGuardVerified,
      orderReopenVerified,
      orderReopenGuardVerified,
      orderCategoryFlowVerified,
      invoiceVoidVerified,
      invoiceAmendGuardVerified,
      invoiceAmendVerified,
      invoiceAmendAuditVerified,
      invoiceReissueVerified,
      invoiceReissueLineageVerified,
      invoiceRevisionLineageVerified,
      invoiceAmendmentNoteGuardVerified,
      invoiceAmendmentNoteUiVerified,
      invoiceAmendmentNoteAuditVerified,
      invoiceReopenVerified,
      invoiceReopenGuardVerified,
      invoiceReopenRevisionGuardVerified,
      invoiceReopenAuditVerified,
      invoiceCreditGuardVerified,
      invoiceCreditVerified,
      invoiceCreditAuditVerified,
      invoiceCreditApprovalVerified,
      invoiceCreditInventoryRestockVerified,
      invoiceCreditReceivedReturnGuardVerified,
      invoiceReturnAuthorizationVerified,
      invoiceReturnAuthorizationAuditVerified,
      invoiceReturnCaseQueueVerified,
      invoiceReturnCaseFilterVerified,
      invoiceReturnCaseActionOwnerVerified,
      invoiceReturnCaseNumberVerified,
      invoiceReturnCaseAmendVerified,
      invoiceReturnCaseAmendGuardVerified,
      invoiceReturnCaseAmendAuditVerified,
      invoiceReturnCaseCloseVerified,
      invoiceReturnCaseCloseAuditVerified,
      invoiceReturnCaseReopenVerified,
      invoiceReturnCaseReopenGuardVerified,
      invoiceReturnCaseReopenAuditVerified,
      invoiceReturnCaseSettledVerified,
      invoiceReturnCaseFounderApprovalVerified,
      invoiceReturnCaseSettlementAuditVerified,
      invoiceReturnReceiptAuthorizationGuardVerified,
      invoiceReturnReceiptClosedCaseGuardVerified,
      invoiceReturnReceiptVerified,
      partialInvoiceCreditVerified,
      partialInvoiceCreditAuditVerified,
      partialInvoiceCreditNoRestockVerified,
      partialInvoiceCreditReportVerified,
      partialInvoiceCreditOrderStateVerified,
      partialInvoiceCreditCollectionGuardVerified,
      partialInvoiceReturnReceiptSuppressedVerified,
      creditedOrderReturnedVerified,
      creditedOrderReturnAuditVerified,
      creditedOrderExcludedFromSalesVerified,
      creditedOrderCancelGuardVerified,
      creditedOrderCloseGuardVerified,
      invoiceReissueAuditVerified,
      invoiceCategoryContextVerified,
      creditedInvoicePaymentGuardVerified,
      creditedInvoiceCollectionGuardVerified,
      reissuedInvoiceVoidVerified,
      voidedInvoicePaymentGuardVerified,
      voidedInvoiceCollectionGuardVerified,
      reopenedInvoiceOrderCancellationGuardVerified,
      voidedInvoiceOrderCancellationVerified,
      backdatedInvoiceApprovalVerified,
      collectionFollowUpVerified,
      collectionHistoryVerified,
      collectionWorklistVerified,
      collectionResolutionVerified,
      ledgerPostingVerified,
      auditTrailVerified,
      operationsStatusVerified,
      operationsReadinessVerified,
      operationsBuildVerified,
      loginRoleHintsVerified,
      financeRoleOnboardingVerified,
      pilotHandoffReturnAuthorizationSummaryVerified,
      exportedInvoiceReturnAuthorizationsVerified,
      exportedInvoiceReturnReceiptsVerified,
      baselineRestoreReturnAuthorizationScopeVerified,
      rbacSalesVisibilityVerified,
      salesRoleOnboardingVerified,
      rbacSalesBlockedRouteVerified,
      rbacSalesBlockedRestorePreviewVerified,
      rbacWarehouseBlockedMutationVerified,
      warehouseRoleOnboardingVerified,
      rbacCollectorActionSplitVerified,
      collectorRoleOnboardingVerified,
      reportCategoryPerformanceVerified,
      approvalCategoryContextVerified,
      auditCategoryContextVerified,
      recoveryDrillReturnAuthorizationScopeVerified,
      directRouteVerified: true,
      logoutClearsStorageVerified: true,
      logoutBlocksProtectedRouteVerified: true,
      unauthorizedApiBlockedVerified,
      expectedGrossSales,
      expectedPurchaseOrderAmount,
      expectedInvoicedAmount,
      expectedCashCollectedAmount,
      expectedGrossSalesAfterPartialCredit,
      expectedInvoicedAmountAfterPartialCredit,
      expectedCashCollectedAmountAfterPartialCredit,
      expectedCreditedAmountAfterPartialCredit,
      creditedInvoiceAmount,
      creditedOrderNumber,
      creditedInvoiceNumber,
      partialCreditOrderNumber,
      partialCreditInvoiceNumber,
      expectedOutstandingReceivablesAmount,
      expectedCurrentReceivablesAmount,
      expectedOverdue31To60Amount,
      expectedRemainingStock,
      expectedRemainingStockAfterPartialCredit,
      expectedRestoreRemainingStock,
      expectedReceivedPurchaseValue,
      expectedInventoryValueAmount,
      expectedInventoryValueAfterPartialCredit,
      expectedRestoreInventoryValueAmount,
      expectedCashOnHandAmount,
      expectedBankAmount,
      expectedReceivablesLedgerAmount,
      expectedPayablesAmount,
      expectedCogsAmount,
      expectedVatPayableAmount,
      expectedRevenueAmount,
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








