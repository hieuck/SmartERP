# Project Working Report

**Date:** 2026-03-19  
**Project:** SmartERP  
**Purpose:** Shared working report for stabilizing the codebase and creating a reliable plan of execution.

## Latest Checkpoint (2026-03-20)

- notifications runtime has been aligned with the actual backend contract and is now guarded in browser smoke:
  - [src/frontend/src/services/notification/notificationService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/notification/notificationService.ts) now uses the real notification endpoints (`/notifications/unread/count`, `POST /notifications/:id/read`, `POST /notifications/read-all`) instead of stale legacy paths
  - notification preferences no longer depend on nonexistent `/notification-preferences` or unstable `/notifications/test-email`; they now persist through tenant settings and infer email availability from configured email settings
  - [src/frontend/src/pages/notifications/NotificationCenter.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/notifications/NotificationCenter.tsx) no longer uses deprecated `Button.Group`, and [src/frontend/src/pages/notifications/NotificationPreferencesPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/notifications/NotificationPreferencesPage.tsx) no longer emits the deprecated `Alert.message` warning
  - [src/frontend/src/pages/notifications/NotificationListPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/notifications/NotificationListPage.tsx) now routes its settings action to the real `/dashboard/notifications/preferences` page instead of the dead `/settings/notifications` path
  - [tools/browser-smoke.mjs](/e:/GitHub/smart-erp/tools/browser-smoke.mjs) now covers `/dashboard/notifications`, `/dashboard/notifications/center`, and `/dashboard/notifications/preferences`
  - focused Vitest coverage for the notification service and notification pages is green, and an authenticated Playwright probe for those three routes now returns with no warnings, no console errors, and no failed requests

- browser smoke now covers the manufacturing list routes that were previously repaired but not yet guarded at runtime:
  - [tools/browser-smoke.mjs](/e:/GitHub/smart-erp/tools/browser-smoke.mjs) now exercises `/dashboard/production/work-centers` and `/dashboard/production/work-orders`
  - a fresh smoke run is clean for both routes: no failed requests, no console warnings, and no console errors
  - this closes the gap between the earlier manufacturing fixes and the daily operational guard rails used to keep regressions visible

- local runtime tooling is now more trustworthy for day-to-day operations instead of silently relying on stale pid files:
  - [tools/runtime-start.mjs](/e:/GitHub/smart-erp/tools/runtime-start.mjs) now syncs the frontend/backend pid files to the actual listening process when services are already running
  - [tools/runtime-smoke.mjs](/e:/GitHub/smart-erp/tools/runtime-smoke.mjs) now reports tracked pid, listener pid, and `pidDrift` for both frontend and backend
  - a real verification run now reports `pidDrift: false` for both services after a clean `runtime-start` + `runtime-smoke` sequence
- the root cause of the earlier process-drift false positive was tooling-side, not app-side:
  - the Windows listener lookup used PowerShell variable `$pid`, which clashes with PowerShell's automatic process-id variable and produced false listener ownership
  - the helper now uses a neutral variable name and the smoke report reflects the real listener processes (`5173` -> frontend Vite, `3000` -> backend monolith)

- tenant settings runtime has been recovered end-to-end with a clean forward migration instead of patching historical schema state in place:
  - [src/backend/src/migrations/1761004800000-RecoverSettingsTable.ts](/e:/GitHub/smart-erp/src/backend/src/migrations/1761004800000-RecoverSettingsTable.ts) now safely renames legacy `system_settings`, backfills tenant-aware settings rows, and creates the indexes expected by the current `Setting` entity
  - `npm run db:init` in [src/backend](/e:/GitHub/smart-erp/src/backend) now applies the recovery migration cleanly on the active local database, and authenticated `GET /api/settings?category=GENERAL` now returns `200`
  - this keeps migration history professional: the old [init-schema.ts](/e:/GitHub/smart-erp/src/backend/src/migrations/init-schema.ts) bootstrap was restored instead of being silently rewritten
- frontend settings pages now match the real backend contract instead of calling a dead `/config/*` API family:
  - [src/frontend/src/services/utils/configService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/utils/configService.ts) now reads and writes through `/settings` and `/settings/bulk`, maps grouped settings into the forms the UI expects, and uses the real email module endpoints for reachability/test-send flows
  - [src/frontend/src/pages/settings/SystemSettingsPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/settings/SystemSettingsPage.tsx) now loads grouped settings once, keeps all tab forms mounted with `forceRender`, and no longer emits the form-instance warning on first load
  - [src/frontend/src/pages/settings/PrintSettings.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/settings/PrintSettings.tsx) now uses `App.useApp().message` and `Card` `variant="borderless"` instead of deprecated/static APIs
- settings localization and smoke coverage are now trustworthy for real user flows:
  - [src/frontend/src/i18n/locales/en/settings.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/en/settings.json) and [src/frontend/src/i18n/locales/vi/settings.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/settings.json) were rewritten to match the actual settings pages, remove mojibake in Vietnamese, and restore missing print/settings keys
  - [tools/browser-smoke.mjs](/e:/GitHub/smart-erp/tools/browser-smoke.mjs) now includes `/dashboard/settings`, `/dashboard/settings/system`, and `/dashboard/settings/print`
  - `runtime:browser-smoke` is now clean again across all tracked settings routes with no failed requests, no console errors, and no component deprecation warnings
- focused verification for the settings batch is green:
  - frontend `type-check` passes
  - backend `type-check` passes
  - [configService.test.ts](/e:/GitHub/smart-erp/src/frontend/src/services/utils/configService.test.ts) and [printConfig.test.ts](/e:/GitHub/smart-erp/src/frontend/src/utils/printConfig.test.ts) pass under Vitest
  - [settings.controller.spec.ts](/e:/GitHub/smart-erp/src/backend/src/core/settings/settings.controller.spec.ts) and [settings.service.spec.ts](/e:/GitHub/smart-erp/src/backend/src/core/settings/settings.service.spec.ts) pass under Jest

- the customer, stock, and payment list shells now use app-context feedback instead of legacy static message calls:
  - [src/frontend/src/pages/customers/CustomerList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/customers/CustomerList.tsx), [src/frontend/src/pages/inventory/StockList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/inventory/StockList.tsx), and [src/frontend/src/pages/payments/PaymentList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/payments/PaymentList.tsx) now pull `message` from `App.useApp()`
  - this removes another cluster of theme/context debt from core business list pages without changing the user-facing workflows
- focused browser verification for the list-shell batch is clean:
  - a real login flow was used to open `/dashboard/customers`, `/dashboard/inventory`, and `/dashboard/payments`
  - those three routes rendered with no console warnings, no console errors, and no failed requests after the modernization pass

- local runtime bootstrap is now deterministic instead of depending on half-initialized state:
  - [tools/runtime-start.mjs](/e:/GitHub/smart-erp/tools/runtime-start.mjs) now brings up `postgres` and `redis`, runs `db:init`, and reseeds demo credentials before checking app liveness
  - [src/backend/scripts/seed-data.ts](/e:/GitHub/smart-erp/src/backend/scripts/seed-data.ts), [src/backend/src/utilities/seed/seed.service.ts](/e:/GitHub/smart-erp/src/backend/src/utilities/seed/seed.service.ts), and [src/backend/package.json](/e:/GitHub/smart-erp/src/backend/package.json) now keep demo credentials stable at `admin@demo.com / admin123`
- backend schema drift that was breaking live dashboard access has been repaired at the source:
  - [src/backend/src/app.module.ts](/e:/GitHub/smart-erp/src/backend/src/app.module.ts) now resolves migrations from the actual runtime directory instead of a broken relative glob
  - [src/backend/src/migrations/1761003600000-AlignPaymentsTableWithEntity.ts](/e:/GitHub/smart-erp/src/backend/src/migrations/1761003600000-AlignPaymentsTableWithEntity.ts) and [src/backend/src/migrations/1761004200000-AlignStockTableWithInventoryEntity.ts](/e:/GitHub/smart-erp/src/backend/src/migrations/1761004200000-AlignStockTableWithInventoryEntity.ts) align legacy local tables with the current entity contract
  - Postgres now has the columns and indexes required by both `payments` and `stock`, and the migration ledger records both recovery steps
- stock and dashboard now agree on one inventory model:
  - [src/backend/src/domains/inventory/stock/entities/inventory.entity.ts](/e:/GitHub/smart-erp/src/backend/src/domains/inventory/stock/entities/inventory.entity.ts) now maps to the real `stock` table with correct column names and numeric transformers
  - [src/backend/src/domains/inventory/stock/stock.service.ts](/e:/GitHub/smart-erp/src/backend/src/domains/inventory/stock/stock.service.ts) now maps DTO thresholds into stock fields consistently instead of leaking mismatched `minQuantity` / `minStockLevel` semantics
  - [src/backend/src/platform/dashboard/dashboard.service.ts](/e:/GitHub/smart-erp/src/backend/src/platform/dashboard/dashboard.service.ts) and its specs now use stock-aware queries instead of relying on the nonexistent `inventory` table or legacy `payments.tenant_id` filters
- live runtime verification is back to green on the active local environment:
  - `runtime:smoke` passes with frontend, backend live/ready, and database checks green
  - `runtime:browser-smoke` passes across public auth/legal routes plus dashboard, users, search, and ecommerce product routes
  - direct authenticated calls to `/api/dashboard/overview`, `/api/stock/count`, `/api/stock/low-stock`, and `/api/stock/total-value` now return `200`
- current database log review shows the old `payments.tenant_id` and `relation "inventory"` errors are historical, not still reproducing after the recovery batch:
  - current backend stderr is back to dependency-owned `DEP0169` noise only
  - Postgres tail still contains earlier failures from before the schema repair, but no fresh recurrence after the clean restart and smoke run
- next frontend modernization queue is clearer thanks to a fresh scan:
  - the highest-value remaining user-facing pages still carrying static `message` / `Modal.confirm` debt are currently concentrated in invoices, payments, stock, customers, warehouses, and purchasing/production list pages
  - `InstallationWizard.tsx` is the clearest remaining copy/localization review target in the marketplace cluster

- sales order detail no longer ships broken copy in the live UI:
  - [src/frontend/src/pages/orders/OrderDetail.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/orders/OrderDetail.tsx) was rewritten to remove mojibake labels and to use app-context feedback/confirmation flows
  - frontend type-check and runtime smoke remained green after the rewrite
- invoice and payment detail pages now follow the app-context confirmation pattern:
  - [src/frontend/src/pages/invoices/InvoiceDetail.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/invoices/InvoiceDetail.tsx) and [src/frontend/src/pages/payments/PaymentDetail.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/payments/PaymentDetail.tsx) now use `App.useApp()` for feedback/confirm flows instead of relying on static antd modal/message surfaces
  - frontend type-check and runtime smoke remained green after the batch
- user management now uses the same context-aware confirmation pattern as the rest of the modernized shell:
  - [src/frontend/src/pages/users/UserList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/users/UserList.tsx) now routes reset-password and delete confirmations through `App.useApp().modal.confirm`
  - [src/frontend/src/pages/users/UserList.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/users/UserList.test.tsx) now covers the reset-password confirmation path directly instead of only create/search happy paths
- marketplace module browser has been realigned with its intended UI contract:
  - [src/frontend/src/components/marketplace/ModuleBrowser.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/marketplace/ModuleBrowser.tsx) now uses clean Vietnamese copy and `App.useApp().modal.confirm` instead of mojibake text plus static modal calls
  - the existing focused suite in [src/frontend/src/components/marketplace/ModuleBrowser.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/marketplace/ModuleBrowser.test.tsx) now matches the modern app context contract rather than the deprecated static modal surface
- document version history is no longer carrying broken encoding or legacy modal usage:
  - [src/frontend/src/components/documents/VersionHistory.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/documents/VersionHistory.tsx) was rewritten to remove mojibake Vietnamese copy and to use `App.useApp().modal.confirm` instead of static `Modal.confirm`
  - its focused Vitest suite now asserts the corrected copy and the context-aware rollback confirmation flow
- system settings shell has been brought closer to the current frontend standard:
  - [src/frontend/src/pages/settings/SystemSettingsPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/settings/SystemSettingsPage.tsx) now uses `App.useApp().message` and `Tabs.items` instead of legacy static `message` and `Tabs.TabPane`
  - the settings route remains healthy after the batch: frontend type-check passes and runtime smoke stayed green
- database log noise from `openpg` is currently classified as external to the repo:
  - a targeted repository scan found no `openpg` references under the project source/config paths
  - Postgres continues to report intermittent failed logins for user `openpg`, but the SmartERP runtime itself remains healthy and unaffected
  - this should be treated as environment noise unless a future trace ties it back to a local tool or extension
- reporting shell has been modernized and locked with focused coverage:
  - [src/frontend/src/pages/reports/ReportsPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/reports/ReportsPage.tsx) now uses `App.useApp().message` and the modern `Tabs.items` API instead of legacy static `message` and `Tabs.TabPane`
  - a focused Vitest suite now covers report loading feedback, PDF export feedback, and tab switching in [src/frontend/src/pages/reports/ReportsPage.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/reports/ReportsPage.test.tsx)
  - sales summary display no longer leaks mojibake currency suffixes into the UI
- ecommerce product-catalog runtime has been reconfirmed as healthy in the live browser flow:
  - `runtime:browser-smoke` now reaches both `/dashboard/ecommerce/products` and `/dashboard/ecommerce/products/new` without failed requests
  - the old `relation "product_catalog" does not exist` entries still present in raw backend stderr are now confirmed to be stale incident history, not a currently reproducible runtime failure
- production list feedback is now aligned with the modern frontend shell:
  - [src/frontend/src/pages/production/WorkCenterList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/production/WorkCenterList.tsx) and [src/frontend/src/pages/production/WorkOrderList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/production/WorkOrderList.tsx) now use `App.useApp().message` instead of the legacy static `message` API
  - their colocated Vitest suites were updated to mock the app context rather than the deprecated static surface
  - focused verification now passes for both production list pages, and runtime smoke stayed green after the batch
- migration ledger catch-up is now recovered on the active local database:
  - `npm run db:migrate` in `src/backend` now completes successfully against the existing `erp_production` schema
  - the root cause was historical migration drift: the database already contained later tables, while the `migrations` ledger was missing several intermediate records
  - the notification and legacy project-table migrations have been made safe to re-run by short-circuiting when their target tables already exist
  - this removes a real operational trap: future local runtime recovery no longer depends on one-off manual SQL for already-provisioned schema state
- database runtime status is now clearer:
  - local table smoke confirms `41` tables currently exist, including `product_catalog`
  - the ecommerce runtime recovery is now backed by both application code and reproducible migration history
  - `src/backend/scripts/init-db-schema.ts` now runs pending migrations whenever TypeORM reports them, instead of skipping schema initialization just because the database already has some tables
  - a smaller follow-up remains: the migration runner still emits a `pg` deprecation warning that should be traced separately, but it no longer blocks boot or schema updates
- runtime smoke reporting is now more trustworthy for day-to-day operations:
  - `tools/runtime-smoke.mjs` no longer reports stale backend/frontend error tails from hours-old incidents as if they were current runtime failures
  - the smoke check now surfaces only recent stderr activity, which makes the launcher report usable for ongoing project operations instead of incident archaeology
- auth bootstrap noise has been tightened at the source:
  - frontend session-restore logic now clears stale `session_hint` cookies when `/auth/refresh` fails or returns an unusable payload
  - this keeps SmartERP from retrying pointless refresh requests on every new page load after a dead session hint is left behind
  - browser verification now shows the intended behavior: a stale hint causes at most one `401` refresh attempt, the cookie is removed, and the next reload makes no refresh request at all
- ecommerce product catalog UX is now more complete and properly localized:
  - the catalog list now exposes an explicit edit action that leads into the existing product form route instead of leaving edit mode hidden behind a dead-end list
  - Vietnamese ecommerce copy has been restored from mojibake into readable product, order, and form labels
  - browser smoke confirms the ecommerce routes still render cleanly after the localization and list-action changes
- browser smoke execution is now more resilient in daily operations:
  - `tools/browser-smoke.mjs` no longer depends exclusively on `networkidle` for every route, which reduces the chance of the whole smoke run hanging on one noisy page
  - each route now uses explicit navigation and idle timeouts and reports a route-level failure instead of stalling the entire command
- a transient local infrastructure incident was observed and recovered during verification:
  - Docker Desktop restarted around `11:41`, which brought down `postgres` and `redis` and caused a temporary `503` on `/api/health`
  - the data stack was brought back with the compose development infrastructure, and both `runtime:smoke` and `runtime:browser-smoke` returned to green afterward

- ecommerce product catalog runtime has now been recovered end-to-end:
  - frontend list and form pages now use the shared API client instead of bypassing auth with raw `axios`
  - backend product-catalog controller now uses the standard auth/tenant/roles guard stack
  - local database now includes the missing `product_catalog` table required by the ecommerce catalog module
- root cause of the live `/dashboard/ecommerce/products` failure was layered, not singular:
  - frontend was calling `/api/ecommerce/products` outside the shared auth client path
  - backend `ProductCatalogController` did not apply `JwtAuthGuard` or `TenantGuard`, so authenticated requests still arrived with `req.user` missing
  - after auth wiring was corrected, backend runtime exposed the next real failure: Postgres schema drift because relation `product_catalog` did not exist
- guard rails for this recovery are now in place:
  - focused frontend page tests for catalog list/form pass against the new API-client contract
  - focused backend controller integration tests pass with explicit auth-context coverage
  - browser smoke now exercises both `/dashboard/ecommerce/products` and `/dashboard/ecommerce/products/new`
  - a real login browser flow now reaches the ecommerce catalog list without failed requests
- there is one follow-up operational debt now clearly identified:
  - the remaining migration concern is no longer failed schema catch-up, but the `pg` deprecation warning emitted during migration execution
  - this no longer blocks ecommerce catalog runtime or local schema recovery, but it should still be handled as a separate tooling-cleanup batch rather than ignored

- public registration flow is now aligned with the real backend contract:
  - the page no longer asks users to submit a custom `slug` that backend `POST /api/auth/register` ignores
  - signup now shows a derived workspace URL preview generated from company name instead
  - `fullName` is labeled correctly instead of reusing `firstName`
  - confirm-password validation copy is specific to the confirm field
- authentication localization is cleaner and more trustworthy:
  - [src/frontend/src/i18n/locales/vi/auth.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/auth.json) was rewritten from mojibake into valid Vietnamese
  - English auth copy now includes explicit `fullName`, `workspaceUrl`, and confirm-password validation keys
- public legal routes now exist and are monitored:
  - `/terms` and `/privacy` now render dedicated public pages instead of falling through to unmatched routes
  - runtime browser smoke now exercises both routes alongside login/register/dashboard flows
  - the pages use the same public shell, theme controls, and localization-aware copy as the rest of the public surface
- public password recovery routes now exist and are monitored:
  - `/forgot-password` now sends reset requests through the existing backend endpoint
  - `/reset-password?token=...` now supports a real frontend reset form instead of a dead route
  - runtime browser smoke now exercises both pages with the rest of the public auth flow
  - dedicated Playwright coverage now verifies forgot-password success/error and reset-password invalid-token/success states
- `/register` browser smoke is now clean again:
  - no console warnings
  - no console errors
  - no failed requests
  - body preview reflects the corrected Vietnamese copy and workspace URL preview
- the remaining backend stderr `DEP0169` warning has been traced to the dependency chain:
  - `bcrypt` -> `@mapbox/node-pre-gyp` -> `url.parse()`
  - this is currently dependency-owned noise, not repo-owned app code
- runtime is healthy again through the managed local launcher:
  - frontend `http://127.0.0.1:5173`
  - backend `http://127.0.0.1:3000/api/health`
  - database smoke for `erp_production`
- the search stack has been corrected end-to-end:
  - backend now exposes frontend-compatible search routes
  - backend search supports suppliers and purchase orders
  - frontend search unwraps the standard backend response envelope
- browser smoke for `/dashboard/search?q=demo` runs without failed requests or console errors
- a real cache-layer bug was fixed:
  - `cacheManager.get()` returning `null` on cache miss was being treated as a hit
  - this caused runtime responses like `{ success: true, data: null }`
  - the fix is now covered by backend cache specs
- dashboard and user-list runtime warnings were cleaned up:
  - deprecated Ant Design `Card` sizing and `Statistic.valueStyle` usage removed
  - shared list shell no longer relies on deprecated `List`/`bordered` APIs
  - browser smoke for `/dashboard` and `/dashboard/users` now reports no console warnings or errors
- browser smoke is now codified as a repo tool:
  - `npm run runtime:browser-smoke`
  - covers login, register, dashboard, users, and search with a real demo session
  - reports console warnings, console errors, failed requests, and a body preview per route
- public demo credentials are now consistent between frontend UI and backend seed logs:
  - login page now shows `admin@demo.com / admin123`

## Current Status Snapshot

As of this checkpoint:

- frontend `type-check`: passing
- frontend `lint`: passing
- backend `type-check`: passing
- backend lint: passing

Smoke verification completed:

- frontend Vitest smoke run: `19` tests passing across `2` representative suites
- backend Jest smoke run: auth controller integration suite passing (`37/37`)
- frontend service-layer aggregate run: `41` files passing, `223` tests passing

Test inventory currently visible in the repo:

- frontend test files: `18`
- backend test files: `139`

This changes the nature of the work.

We are no longer primarily dealing with broken baseline checks. We are now dealing with meaningful test drift, outdated assumptions, and code structure quality.

## Executive Summary

SmartERP has a solid foundation:

- broad ERP domain coverage
- backend and frontend already separated cleanly at a high level
- meaningful test investment
- working E2E infrastructure

The codebase is now in a meaningfully better engineering state than when this report started.

The main problem is no longer a broken baseline. The main problem is that several parts of the test suite and some larger frontend modules still reflect historical contracts and mixed responsibilities.

This report defines the working direction we will follow together.

## Decisions Already Made

### Testing Stack

- **Frontend:** `Vitest`
- **Backend:** `Jest`

Rationale:

- `Vitest` is the best fit for a React + Vite frontend
- `Jest` remains the best fit for a NestJS backend
- we will not mix `jest` APIs inside frontend tests going forward

### Immediate Priority

We are still **not** optimizing for more features right now.

We are optimizing for:

1. meaningful TDD readiness
2. predictable quality checks
3. lower test drift
4. cleaner module boundaries

## Current Assessment

### Strengths

- Backend architecture is generally understandable and service-oriented.
- Frontend has enough coverage points to support future refactoring.
- E2E coverage exists for important user journeys.
- The project is not blocked by missing tooling; it is blocked by inconsistent execution.

### Weaknesses

- Frontend still has several large page-level files that mix rendering, state, data loading, validation, and orchestration.
- Backend test suite still has contract drift in some specs, even though the baseline checks are now healthy.
- Some infrastructure is green but dated, for example the backend Jest stack still emits `ts-jest` deprecation warnings.
- Documentation and working state have not always matched each other.

### Practical Conclusion

The project is worth investing in, and stabilization has paid off. The right move now is controlled correction of drift and complexity before broad feature acceleration resumes.

## Working Plan

## Phase 1: Stabilize The Workspace

Goal:

- remove ambiguity from the current working tree
- confirm what changes are intentional
- make the repo safe to iterate on

Status:

- in progress
- the repo still contains a noisy working tree and many intentional edits
- decisions about deleted docs and screenshots are still separate from code recovery

## Phase 2: Restore Green Baseline

Goal:

- make quality checks trustworthy again

Scope:

- frontend `type-check`
- frontend test consistency
- backend `type-check`
- backend lint execution path

Status:

- completed

Completed outcomes:

- frontend type-check passes
- frontend lint passes
- backend type-check passes
- backend lint runs successfully
- frontend tests no longer mix `jest` APIs with Vitest

## Phase 3: Frontend Test Standardization

Goal:

- fully standardize frontend testing around `Vitest`

Scope:

- replace `jest.fn`, `jest.mock`, and Jest-specific patterns in frontend tests
- normalize test setup and mocks
- ensure examples and future code follow one standard only

Status:

- mostly completed

Completed outcomes:

- frontend tests use `vi` consistently
- frontend test utilities are runner-consistent

Remaining expectation:

- no new frontend test files should introduce Jest APIs

## Phase 4: Reduce Frontend Complexity

Goal:

- make the frontend easier to test, review, and extend

Priority targets:

- `src/frontend/src/routes/index.tsx`
- large form pages under orders, payments, invoices, settings
- utility-heavy UI pages with repeated `any` casts

Status:

- not completed
- partially improved through typing cleanup, but structural simplification is still needed

## Phase 5: Repair Test Drift

Goal:

- bring test expectations back in line with current models and contracts

Scope:

- backend specs with outdated fixtures
- frontend tests with stale assumptions
- mock factories that no longer match real entity shapes

Status:

- now the highest-priority engineering phase

Recent evidence:

- the auth controller integration suite failed for legitimate contract drift, not tooling failure
- `/auth/login` now returns the access token in body and refresh token via httpOnly cookie
- `/auth/refresh` without a token currently returns `401`, not `400`
- after aligning the test to the controller's real contract, the suite passed (`37/37`)

Done when:

- spec failures reflect real regressions rather than outdated mocks
- fixture creation becomes easier and more consistent
- controller and service contracts are asserted the same way tests and application code use them

## Phase 6: TDD Readiness Review

Goal:

- judge the project on actual TDD health now that the baseline is no longer masking problems

Scope:

- check whether new changes are forced through failing tests first
- identify modules where tests lead design versus merely trail implementation
- distinguish healthy test coverage from stale or duplicated coverage

Done when:

- we can name which modules are TDD-ready
- we can name which modules only have test quantity, not test discipline
- we have a practical cleanup queue based on those findings

## Evidence-Based TDD Readiness

This section is based on actual smoke and representative suite runs, not assumptions.

### TDD-Ready or Close To TDD-Ready

These areas currently show a good combination of:

- green baseline
- stable contracts
- tests that still match current implementation
- failures that tend to be meaningful when they occur

Modules with strong signals so far:

- backend auth
  - `auth.controller.spec.ts`
  - `auth.service.spec.ts`
- backend onboarding
  - `onboarding.service.spec.ts`
- backend sales order service
  - `src/domains/sales/order/order.service.spec.ts`
- backend inventory product service
  - `src/domains/inventory/product/product.service.spec.ts`
- backend accounting/reporting services
  - `src/domains/accounting/reports/reports.service.spec.ts`
  - `src/platform/report/report.service.spec.ts`
- backend workflow and notification platform modules
  - `src/platform/workflow/workflow.service.spec.ts`
  - `src/platform/notification/notification.controller.spec.ts`
- backend purchasing purchase-order service
  - now stable after aligning security-related mocks to the current repository contract
- backend HR employee service
  - now stable after the same security-contract alignment
- frontend E2E auth, dashboard, and product list flows
  - these are currently some of the most trustworthy frontend signals because they test the application closer to how users use it

### Has Test Coverage But Drift Risk Is Higher

These areas can still be useful, but the test signal is easier to distort:

- frontend unit tests around complex Ant Design rendering
  - count badges, drawers, and portal behavior can make tests brittle if they assert DOM details too literally
- frontend hooks with timers or async orchestration
  - fake timer strategies can create false negatives if they do not match the hook's lifecycle precisely
- backend service specs that depend on shared infrastructure contracts
  - especially modules using `SecureRepository` and `PermissionService`
  - these tests drift quickly when mock contracts are not updated with the abstraction

### Coverage Gaps, Not Just Drift

There are also areas where the right conclusion is not "tests are stale" but "frontend unit coverage is still thin":

- current visible frontend service test files: `41`
- current visible frontend component test files: `4`
- current visible frontend hook test files: `2`

This means some frontend layers are not under-tested rather than merely drift-prone.

Progress already made:

- notification frontend service layer now has a dedicated unit suite
- report frontend service layer now has a dedicated unit suite
- audit frontend service layer now has a dedicated unit suite
- supplier frontend service layer now has a dedicated unit suite
- dashboard frontend service layer now has a dedicated unit suite
- search frontend service layer now has a dedicated unit suite
- workflow frontend service layer now has a dedicated unit suite
- customer frontend service layer now has a dedicated unit suite
- order frontend service layer now has a dedicated unit suite
- inventory frontend service layer now has a dedicated unit suite
- payment frontend service layer now has a dedicated unit suite
- user frontend service layer now has a dedicated unit suite
- warehouse frontend service layer now has a dedicated unit suite
- document frontend service layer now has a dedicated unit suite
- email frontend service layer now has a dedicated unit suite
- integration frontend service layer now has a dedicated unit suite
- config frontend service layer now has a dedicated unit suite
- settings frontend service layer now has a dedicated unit suite
- category frontend service layer now has a dedicated unit suite
- permission frontend service layer now has a dedicated unit suite
- HR frontend service layer now has a dedicated unit suite
- role frontend service layer now has a dedicated unit suite
- import-export frontend service layer now has a dedicated unit suite
- invoice frontend service layer now has a dedicated unit suite
- product frontend service layer now has a dedicated unit suite
- purchase-order frontend service layer now has a dedicated unit suite
- payment-gateway frontend service layer now has a dedicated unit suite
- reporting frontend service layer now has a dedicated unit suite
- offline-services mapping now has a dedicated unit suite
- platform offline service layer now has a dedicated unit suite
- sales offline service layer now has a dedicated unit suite
- purchasing offline service layer now has a dedicated unit suite
- project offline service layer now has a dedicated unit suite
- inventory offline service layer now has a dedicated unit suite
- manufacturing offline service layer now has a dedicated unit suite
- API client/interceptor layer now has a dedicated unit suite

Remaining interpretation:

- service and offline-service coverage on the frontend is now broad enough that the main frontend risk is no longer missing service tests
- the next thin spots are page orchestration, large forms, shared UI complexity, and drift in older suites outside the service layer

This matters because TDD readiness depends on having fast feedback at the right layer, not just having E2E coverage elsewhere.

### Notable Drift Patterns Found

The same patterns have repeated several times:

1. Security/repository abstraction drift
   - service specs mocked old permission APIs
   - actual implementation now expects `canRead`, `canWrite`, `canDelete`, and `buildSecureQuery`

2. Frontend architectural drift
   - older tests expected `fetch`-based loading or modal-based create flows
   - actual pages moved to offline services and route navigation

3. UI assertion drift
   - tests matched plain text too literally for Ant Design structures
   - current UI often needs role/title/attribute-based assertions instead

4. Error-contract drift
   - tests expected old generic messages
   - implementation now exposes more precise behavior such as network-specific errors or cookie-based auth flows

### Practical Interpretation

The codebase is no longer in the state where "many tests" should be read as "strong TDD".

A more accurate interpretation now is:

- some backend domain modules are already disciplined enough for TDD-led work
- frontend E2E is more trustworthy than several frontend unit suites
- the weakest area is not total lack of testing, but stale assumptions around shared abstractions and UI details

## Final Classification

This is the current working classification for planning.

### 1. TDD-Ready

These modules currently have the strongest evidence that tests are reliable enough to guide change:

- backend auth
- backend onboarding
- backend sales order service
- backend inventory product service
- backend purchase-order service
- backend HR employee service
- backend accounting reports
- backend platform report service
- backend workflow service
- backend notification controller
- frontend E2E auth
- frontend E2E dashboard
- frontend E2E product list

Practical meaning:

- safe candidates for incremental refactor with test-first or test-guided changes
- failures in these areas are increasingly likely to mean something real

### 2. Has Tests But Drift-Prone

These areas have real test value, but the tests are easier to destabilize or misread:

- frontend component tests built on Ant Design-heavy DOM details
- frontend hooks with timers and async state transitions
- backend service specs that depend on `SecureRepository` and `PermissionService` contracts

Practical meaning:

- still useful
- but when they fail, first ask whether the contract, mock shape, or UI structure changed before assuming a product bug

### 3. Coverage Gap / Refactor-First

These areas need more direct fast-feedback tests or better module boundaries before TDD will feel natural:

- large frontend page-level modules under orders, payments, invoices, settings, and routes
- frontend shared UI where E2E covers outcomes but unit-level feedback is still thin
- frontend service and orchestration layers beyond the first batch now covered

Practical meaning:

- do not rely only on E2E here
- add unit/integration tests at the service or page orchestration layer before heavy refactors

## Short-Term Action Queue

This is the recommended queue for the next stretch of work.

### Queue A: Keep Repairing Meaningful Drift

Priority:

- continue backend suite cleanup where smoke runs still expose mock-contract drift
- prefer fixes that align tests to current shared abstractions instead of weakening assertions

Why:

- this produces the fastest improvement in trustworthiness across the widest surface area

### Queue B: Shift Frontend Fast-Feedback Tests Up One Layer

Priority:

- page orchestration, shared UI behaviors, and complex form flows that still rely too heavily on E2E

Why:

- the service layer is now heavily covered
- the next frontend TDD gap is above the service layer, where rendering and orchestration still create slower feedback loops

Current status:

- notification service tests added
- report service tests added
- audit service tests added
- supplier service tests added
- dashboard service tests added
- search service tests added
- workflow service tests added
- customer service tests added
- order service tests added
- inventory service tests added
- payment service tests added
- user service tests added
- warehouse service tests added
- document service tests added
- email service tests added
- integration service tests added
- config service tests added
- settings service tests added
- category service tests added
- permission service tests added
- HR service tests added
- role service tests added
- import-export service tests added
- invoice service tests added
- product service tests added
- purchase-order service tests added
- payment-gateway service tests added
- reporting service tests added
- offline-services test added
- platform offline service tests added
- sales offline service tests added
- purchasing offline service tests added
- project offline service tests added
- inventory offline service tests added
- manufacturing offline service tests added
- API client tests added
- aggregate verification now passes for `src/services`: `41` files, `223` tests
- first page-orchestration batch added for `NotificationListPage` (`3/3` passing)
- second page-orchestration batch added for `NotificationPreferencesPage` (`3/3` passing)
- third page-orchestration batch added for offline-first `NotificationList` (`3/3` passing)
- shared UI batch added for `NotificationBell` (`3/3` passing)
- shared list primitives covered: `ListPageHeader` (`2/2`) and `ListPageFilters` (`3/3`)
- shared list shell covered: `StandardListPage` (`2/2`)
- shared form shell covered: `StandardFormPage` (`3/3`)
- shared page primitives covered: `PageHeader` (`3/3`) and `EmptyState` (`3/3`)
- detail/action primitives covered: `ExpandableContent` (`3/3`) and `ListItemActions` (`2/2`)
- lazy loading primitives covered: `LazyDataLoader` and `InfiniteScroll` (`5/5`)
- media/loading primitives covered: `LazyImage` (`4/4`) and `LoadingSpinner` (`3/3`)
- mobile card primitives covered: `MobileListCard` (`2/2`) and `MobileFormItemCard` (`2/2`)
- mobile list shell covered: `MobileListView` (`4/4`)
- desktop table shell covered: `DesktopTableView` (`2/2`)
- theme/i18n primitives covered: `LanguageSwitcher` (`1/1`) and `ThemeToggle` (`1/1`)
- error recovery primitive covered: `common/ErrorBoundary` (`3/3`)
- notification center orchestration covered: `NotificationCenter` (`3/3`)
- search filter orchestration covered: `AdvancedFilterPanel` (`3/3`)
- workflow approval UI covered: `WorkflowApproval` (`3/3`)
- tenant selection UI covered: `TenantSelector` (`2/2`)
- collaboration comments UI covered: `CommentSection` (`3/3`)
- workflow builder UI covered: `WorkflowBuilder` (`3/3`)
- document version history UI covered: `VersionHistory` (`3/3`)
- dashboard builder UI covered: `DashboardBuilder` (`3/3`)
- document browser UI covered: `DocumentBrowser` (`3/3`)
- custom field builder UI covered: `FormBuilder` (`3/3`)
- locale hook covered: `useLocale` (`3/3`)
- lazy image hooks covered: `useLazyImage` and `useLazyImages` (`3/3`)
- performance utility covered: `performanceMonitor` (`4/4`)
- responsive utilities covered: `responsive` (`3/3`)
- service worker utility covered: `serviceWorkerRegistration` (`3/3`)
- settings orchestration hooks covered: `useSettings` (`3/3`)
- invoice orchestration hooks covered: `useInvoices` (`3/3`)
- reporting orchestration hooks covered: `useReports` (`3/3`)
- mobile table utilities covered: `mobileTableHelper` (`3/3`)
- frontend test harness covered: `test-utils` (`3/3`)
- user list orchestration covered: `UserList` (`3/3`)
- product offline demo covered: `ProductOfflineDemo` (`3/3`)
- offline demo covered: `OfflineDemo` (`3/3`)
- tenant management placeholder covered: `TenantManagement` (`1/1`)
- work center list orchestration covered: `WorkCenterList` (`3/3`)
- work order list orchestration covered: `WorkOrderList` (`3/3`)
- testing this shell also exposed a design nuance: cancel fallback logic exists internally, but the cancel button only renders when an explicit `onCancel` is provided
- browser smoke on local dev server confirmed Vite boots on `http://localhost:5173/`; current UX blockers are backend-unavailable `auth/refresh` calls and UI deprecation warnings, not startup crashes
- real production bug fixed in `NotificationBell`: notification click no longer passes a fake mouse event into `handleMarkAsRead`
- root cause in the first page batch was test-harness drift: deep Ant Design mocks were less reliable than using real components with thin service/router mocks
- aggregate verification now passes for `src/pages/notifications/NotificationListPage.test.tsx src/services`: `42` files, `226` tests
- next additions should target page orchestration and shared UI hotspots rather than continuing CRUD-style service test expansion

### Queue C: Refactor Only After Guard Rails Exist

Priority:

- `routes/index.tsx`
- large forms in orders, invoices, payments, settings

Why:

- these are still the largest complexity hotspots
- but they should be broken apart only after their behavior is covered by stable tests

## Team Guidance

Use the following rule of thumb:

- if the module is in the TDD-ready group, changes can be pushed through tests confidently
- if the module is in the drift-prone group, check mocks and contracts first
- if the module is in the coverage-gap group, add tests before attempting deeper redesign

## Updated Next Recommended Step

The next best move is:

1. continue backend drift cleanup in modules that use shared security/repository abstractions
2. add frontend tests around page orchestration and complex shared UI flows
3. only then start splitting the worst frontend god files

## Manual Registration Incident

Latest finding:

- manual registration was failing because the backend monolith never bound port `3000`, so both `/api/auth/refresh` and `/api/auth/register` died with connection-refused errors from the frontend
- the backend bootstrap failure was caused by HR role wiring drift:
  - `Role` pointed at a different `Permission` entity than `PermissionModule`
  - `RoleModule` was not imported into `AppModule`
  - `RoleModule` also imported `CacheModule` without `register()`

Verification:

- backend now boots successfully and serves `http://localhost:3000/api/health`
- direct registration API smoke returns `201`
- `npx playwright test tests/e2e/public/register.spec.ts --project=chromium` passes `6/6`

## Playwright UI Incident

Latest finding:

- Playwright UI was not usable from Windows PowerShell because `npx.ps1` is blocked by Execution Policy on this machine
- even when bypassing that with `npx.cmd`, Playwright fails in the current restricted environment with `spawn EPERM` because its runner needs child-process IPC
- this second problem is environmental rather than a test-spec regression, but the repo previously surfaced it as an opaque stack trace

Fix applied:

- added root launchers:
  - `run-playwright.cjs`
  - `playwright-ui.cmd`
  - `playwright-test.cmd`
  - `playwright-headed.cmd`
- added root package scripts:
  - `test:e2e`
  - `test:e2e:headed`
  - `test:e2e:ui`
- the launcher now detects blocked IPC early and prints a clear operator-facing message instead of crashing with raw `EPERM`

Verification:

- `node run-playwright.cjs test --ui` now fails with a clear environment diagnosis
- `playwright-ui.cmd` and `npm.cmd run test:e2e:ui` both route through the same launcher successfully on Windows PowerShell

## Documents Runtime Incident

Latest finding:

- `GET /api/documents` and `POST /api/documents/folders` were failing in live smoke because the `documents` table did not exist in the local database
- document creation also bypassed `SecureRepository`, so `tenantId` and owner assignment were not guaranteed to follow the same rules as the rest of the secure write path

Fix applied:

- added `src/backend/src/migrations/1710850000000-CreateDocumentTable.ts`
- updated `DocumentService` create flows to go through `SecureRepository`
- tightened `document.service.spec.ts` to lock the secure create path

Verification:

- backend `type-check` passes
- `npx jest src/platform/document/document.service.spec.ts --runInBand` passes `10/10`
- live smoke now returns:
  - `GET /api/documents` -> `200`
  - `POST /api/documents/folders` -> `201`

## Project Runtime Incident

Latest finding:

- `GET /api/projects`, `GET /api/tasks`, and `GET /api/time-tracking` were all failing with `500` because the project schema family was missing from the local database

Fix applied:

- added `src/backend/src/migrations/1710860000000-CreateProjectTables.ts`
- the migration creates:
  - `projects`
  - `tasks`
  - `task_dependencies`
  - `time_entries`
  - the related enum types and supporting indexes

Verification:

- live smoke now returns:
  - `GET /api/projects` -> `200`
  - `GET /api/tasks` -> `200`
  - `GET /api/time-tracking` -> `200`

## Backend Startup Log Cleanup

Latest finding:

- backend startup logs were still showing duplicate Swagger DTO warnings for:
  - `VerifyPaymentDto`
  - `CreateProductDto`
  - `UpdateProductDto`

Fix applied:

- renamed the conflicting DTO classes in:
  - payment gateway DTOs
  - ecommerce product-catalog DTOs
- updated controller/service imports accordingly

Verification:

- backend `type-check` passes
- backend `build` passes
- duplicate Swagger DTO warnings no longer appear in the latest backend startup log tail

That is the most practical path from “green and cleaner” to “consistently TDD-friendly”.

## Rules For Ongoing Work

While we work through the plan:

- do not add broad new features before the baseline is green
- do not introduce a second frontend test style
- do not accept “temporary” fixes that increase inconsistency
- prefer small, verifiable steps over large theoretical refactors
- every cleanup step should end with a concrete verification command

## First Execution Queue

This is the recommended order of attack:

1. Audit and clean the current working tree.
2. Continue repairing backend spec drift, starting with auth-adjacent and domain controller suites.
3. Review frontend tests for stale behavioral assumptions, especially around offline data contracts.
4. Split the worst frontend god files after their current behavior is protected by tests.
5. Perform a focused TDD readiness review by module instead of by repo-wide intuition.

## Success Criteria

We will consider this recovery effort on track when:

- quality checks stay reliable
- test failures are meaningful instead of infrastructural
- frontend files become easier to reason about
- adding new tests no longer requires framework guesswork
- new feature work can resume without increasing chaos

## Collaboration Model

How we will work from this report:

- use it as the source for prioritization
- handle one phase at a time
- verify each phase before moving on
- keep decisions explicit when there is a tradeoff

## Next Recommended Step

Start with **Phase 5 + Phase 6 together**:

- continue repairing test drift where smoke runs expose contract mismatch
- keep validating fixes with real test commands, not assumptions
- then summarize which modules are genuinely ready for TDD-led work

That gives the fastest path to a repo we can trust for the next round of engineering decisions.

## Manual Registration Runtime Incident

Latest finding:

- manual registration looked broken from the browser because frontend requests to `/api/auth/register` and `/api/auth/refresh` were hitting a backend that was not actually booting cleanly on port `3000`
- the backend root cause was a manufacturing-era wiring problem that prevented the monolith from reaching a healthy startup path reliably in the local runtime environment

Fix applied:

- restored backend runtime health by wiring manufacturing modules and controllers correctly
- verified backend health on `http://127.0.0.1:3000/api/health`
- hardened frontend registration guard rails with unit coverage in [src/frontend/src/pages/public/RegisterPage.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/public/RegisterPage.test.tsx)

Verification:

- backend health returns `200`
- direct registration POST returns `201`
- `npx playwright test tests/e2e/public/register.spec.ts --project=chromium` passed earlier in the recovery flow
- `npx vitest run src/pages/public/RegisterPage.test.tsx` now passes `5/5`

## Runtime Snapshot

Current live state after the latest smoke:

- frontend Vite server is healthy on `http://localhost:5173`
- backend monolith is healthy on `http://127.0.0.1:3000/api/health`
- local Postgres `erp_production` contains the manufacturing tables:
  - `work_centers`
  - `boms`
  - `bom_lines`
  - `work_orders`
- manufacturing runtime smoke now returns `200` for:
  - `GET /api/manufacturing/work-centers`
  - `GET /api/manufacturing/bom`
  - `GET /api/manufacturing/work-orders`

## Tooling Runtime Notes

Latest finding:

- backend Jest config had been left in a broken intermediate state during a previous ts-jest cleanup attempt
- the remaining backend deprecation warning is not from project code; it traces to `bcrypt` via `@mapbox/node-pre-gyp` calling Node's deprecated `url.parse()`
- Playwright UI launcher is functioning correctly now for normal terminals; when it still fails, the remaining blocker is environment-level child-process IPC, not a broken repo script

Fix applied:

- cleaned `src/backend/jest.config.js` and moved `isolatedModules` ownership to `src/backend/tsconfig.json`
- verified the wrapper path for `node run-playwright.cjs test --ui --help`

Verification:

- `npx.cmd jest src/domains/manufacturing/bom/bom.controller.spec.ts --runInBand` passes without the previous ts-jest warning
- `node run-playwright.cjs test --ui --help` prints Playwright help successfully
- the remaining backend deprecation is currently classified as dependency noise, not an app bug
- `npm run runtime:smoke` now provides a single health snapshot for frontend, backend, database, and current error-log tails

## 2026-03-19 Runtime Build Hygiene
- Reproduced a backend runtime failure where `dist/main.js` booted with `MODULE_NOT_FOUND` for `common/logger` and `common/metrics` even though source files existed.
- Root cause was build artifact hygiene on Windows: stale `dist` plus `tsconfig.build.tsbuildinfo` could leave runtime-critical files missing from the emitted tree.
- Added `src/backend/scripts/clean-build.cjs` and changed the backend `build` script to clean `dist` and `tsconfig.build.tsbuildinfo` before `nest build`.
- Verified with `npm.cmd run build`, `npx.cmd jest src/common/interceptors/query-performance.interceptor.spec.ts --runInBand`, and `npm.cmd run runtime:smoke`.
- Runtime status after the fix: frontend `200`, backend health `200`, database reachable, manufacturing tables present.

## 2026-03-19 Frontend UI Polish Batch
- Modernized Ant Design `Space` usage in several user-facing components by replacing deprecated `direction` with `orientation`.
- Preserved proper Vietnamese copy in the landing hero, tenant selector, and warehouse location picker instead of keeping ASCII-only placeholders.
- Verified targeted frontend lint cleanly for the edited files.

## 2026-03-19 Offline Demo Feedback Batch
- Completed the pending Ant Design feedback refactor in [src/frontend/src/pages/OfflineDemo.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/OfflineDemo.tsx) and [src/frontend/src/pages/ProductOfflineDemo.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/ProductOfflineDemo.tsx) by replacing static `message` usage with `App.useApp().message`.
- Repaired the corresponding test harnesses in [src/frontend/src/pages/OfflineDemo.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/OfflineDemo.test.tsx) and [src/frontend/src/pages/ProductOfflineDemo.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/ProductOfflineDemo.test.tsx) so mocked `antd` shape matches the new runtime contract.
- Verified with `npx.cmd vitest run src/pages/OfflineDemo.test.tsx src/pages/ProductOfflineDemo.test.tsx` and targeted `eslint` on the four files.

## 2026-03-19 Runtime Round
- Re-ran `npm.cmd run runtime:smoke` after the offline-demo batch.
- Current live status:
  - frontend `http://127.0.0.1:5173` returns `200`
  - backend `http://127.0.0.1:3000/api/health` returns `200`
  - local Postgres `erp_production` remains reachable
- Current backend error tail remains limited to dependency/tooling noise:
  - `Sentry DSN not provided. Error tracking disabled.`
  - Node deprecation `[DEP0169]` from dependency code using `url.parse()`
- Queried Postgres through the backend Node runtime to avoid depending on a missing `psql` CLI in `PATH`.
- Latest DB snapshot:
  - active connections: `1`
  - total connections: `1`
  - top user tables by live rows: `permissions` `12`, `role_permissions` `12`, `documents` `5`, `tenants` `3`, `users` `3`, `roles` `1`

## 2026-03-19 Playwright UI Check
- Re-validated the local Playwright wrapper with `node run-playwright.cjs test --ui --help`.
- Result: the repository wrapper is healthy and exposes standard Playwright UI options correctly.
- Current conclusion:
  - if Playwright UI still fails in a given terminal/app shell, the remaining blocker is environment-level process/IPC behavior rather than a broken repo command
  - the repo-side fallback command path is currently professional enough to keep using while runtime work continues

## 2026-03-19 Import Export Runtime Hygiene
- Reduced one more frontend runtime warning source by replacing deprecated Ant Design `Space direction` usage with `orientation` in [src/frontend/src/components/import-export/ImportWizard.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/import-export/ImportWizard.tsx).
- Added focused guard rails for the import/export feedback paths:
  - [src/frontend/src/components/import-export/ImportWizard.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/import-export/ImportWizard.test.tsx)
  - [src/frontend/src/components/import-export/ExportDialog.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/import-export/ExportDialog.test.tsx)
- Verified:
  - `npx.cmd vitest run src/components/import-export/ImportWizard.test.tsx`
  - `npx.cmd vitest run src/components/import-export/ExportDialog.test.tsx`
  - targeted `eslint` for the edited import/export files
- Net effect:
  - import/export UI feedback is less brittle
  - one more known deprecation source is removed from the user-facing frontend path

## 2026-03-19 Backend Health Log Hygiene
- Reduced backend success-path log noise for `/api/health` in:
  - [src/backend/src/common/logger/logging.interceptor.ts](/e:/GitHub/smart-erp/src/backend/src/common/logger/logging.interceptor.ts)
  - [src/backend/src/common/middleware/logging.middleware.ts](/e:/GitHub/smart-erp/src/backend/src/common/middleware/logging.middleware.ts)
- Added/updated tests in:
  - [src/backend/src/common/logger/logging.interceptor.spec.ts](/e:/GitHub/smart-erp/src/backend/src/common/logger/logging.interceptor.spec.ts)
  - [src/backend/src/common/middleware/logging.middleware.spec.ts](/e:/GitHub/smart-erp/src/backend/src/common/middleware/logging.middleware.spec.ts)
- Verified with:
  - `npx.cmd jest src/common/logger/logging.interceptor.spec.ts src/common/middleware/logging.middleware.spec.ts --runInBand`
  - `npm.cmd run build` in `src/backend`
- Current remaining backend runtime noise is down to dependency-level deprecation from `bcrypt/@mapbox/node-pre-gyp` and query logging for `SELECT 1`, not app-layer request logging.

## 2026-03-19 Frontend Space Deprecation Cleanup
- Replaced remaining user-facing `Space direction` usage with `orientation` across audit, customer, inventory, invoice, order, payment, product, report, search, supplier, user, and warehouse pages.
- Verified the edited page set with targeted frontend lint.
- This batch is intentionally logic-neutral: it removes an Ant Design deprecation source from runtime logs without changing business behavior.

## 2026-03-19 Workflow Approval UI Cleanup
- Rebuilt [src/frontend/src/components/workflow/WorkflowApproval.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/workflow/WorkflowApproval.tsx) to remove mojibake Vietnamese copy and replace static `message` usage with `App.useApp().message`.
- Updated [src/frontend/src/components/workflow/WorkflowApproval.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/workflow/WorkflowApproval.test.tsx) so the test harness matches the new Ant Design context contract and asserts clean Vietnamese content directly.
- Verified with:
  - `npx.cmd vitest run src/components/workflow/WorkflowApproval.test.tsx`
  - targeted `eslint` for the component and its test

## 2026-03-20 Tenant Selector Locale Cleanup
- Cleaned mojibake in [src/frontend/src/components/tenancy/TenantSelector.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/tenancy/TenantSelector.tsx) so tenant names, headings, placeholder text, and currency/timezone display render valid Vietnamese.
- Rewrote [src/frontend/src/components/tenancy/TenantSelector.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/tenancy/TenantSelector.test.tsx) to assert the final clean strings directly instead of tolerating broken encodings with regex.
- Verified with:
  - `npx.cmd vitest run src/components/tenancy/TenantSelector.test.tsx`
  - `npx.cmd eslint src/components/tenancy/TenantSelector.tsx src/components/tenancy/TenantSelector.test.tsx`

## 2026-03-20 Frontend Test Encoding Cleanup
- Rewrote mojibake-tolerant tests so they now assert one correct user-facing string instead of passing on either broken or clean text:
  - [src/frontend/src/components/collaboration/CommentSection.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/collaboration/CommentSection.test.tsx)
  - [src/frontend/src/components/documents/VersionHistory.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/documents/VersionHistory.test.tsx)
  - [src/frontend/src/components/workflow/WorkflowBuilder.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/workflow/WorkflowBuilder.test.tsx)
- Verified with:
  - `npx.cmd vitest run src/components/collaboration/CommentSection.test.tsx src/components/documents/VersionHistory.test.tsx src/components/workflow/WorkflowBuilder.test.tsx`
  - targeted `eslint` on the three updated test files

## 2026-03-20 Database Logging Hygiene
- Introduced opt-in TypeORM query logging in:
  - [src/backend/src/config/database.config.ts](/e:/GitHub/smart-erp/src/backend/src/config/database.config.ts)
  - [src/backend/src/app.module.ts](/e:/GitHub/smart-erp/src/backend/src/app.module.ts)
- Added focused coverage in [src/backend/src/config/database.config.spec.ts](/e:/GitHub/smart-erp/src/backend/src/config/database.config.spec.ts) for:
  - development default without query logs
  - production-style minimal logging
  - explicit `DB_LOGGING=true|minimal|false`
- Verified with:
  - `npx.cmd jest src/config/database.config.spec.ts --runInBand`
  - targeted backend `eslint`
  - `npm.cmd run build` in `src/backend`
  - fresh backend restart plus `npm.cmd run runtime:smoke`
- Current conclusion:
  - app-layer SQL `query:` noise is gone from the fresh backend runtime log
  - backend stderr is down to dependency-level `DEP0169`, not repository code

## 2026-03-20 Common Locale and Dashboard Feedback Cleanup
- Repaired baseline localization quality in:
  - [src/frontend/src/i18n/locales/vi/common.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/common.json)
  - [src/frontend/src/i18n/locales/en/common.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/en/common.json)
- Reason for reprioritization:
  - the Vietnamese common locale file was mojibake across the entire file, which is a higher-severity professionalism/localization issue than individual page warnings
- Modernized dashboard feedback in [src/frontend/src/pages/Dashboard.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/Dashboard.tsx):
  - replaced static `message.error(...)` with `App.useApp().message`
  - removed manual string concatenation for error feedback
- Added focused regression coverage in [src/frontend/src/pages/Dashboard.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/Dashboard.test.tsx) for:
  - successful dashboard shell render
  - contextual error message rendering on failed data load
- Verified with:
  - `npx.cmd vitest run src/pages/Dashboard.test.tsx`
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:smoke`
- Current runtime snapshot after the batch:
  - frontend `127.0.0.1:5173` healthy
  - backend health healthy on port `3000`
  - database smoke healthy against `erp_production`
  - frontend error log empty

## 2026-03-20 Auth Refresh Log Downgrade
- Kept public-route session restoration behavior intact, but reclassified missing refresh-cookie bootstrap traffic as expected-noise instead of warning/error in:
  - [src/backend/src/common/logger/logging.interceptor.ts](/e:/GitHub/smart-erp/src/backend/src/common/logger/logging.interceptor.ts)
  - [src/backend/src/common/middleware/logging.middleware.ts](/e:/GitHub/smart-erp/src/backend/src/common/middleware/logging.middleware.ts)
  - [src/backend/src/common/interceptors/query-performance.interceptor.ts](/e:/GitHub/smart-erp/src/backend/src/common/interceptors/query-performance.interceptor.ts)
  - [src/backend/src/common/filters/http-exception.filter.ts](/e:/GitHub/smart-erp/src/backend/src/common/filters/http-exception.filter.ts)
- Added/updated focused tests in:
  - [src/backend/src/common/logger/logging.interceptor.spec.ts](/e:/GitHub/smart-erp/src/backend/src/common/logger/logging.interceptor.spec.ts)
  - [src/backend/src/common/middleware/logging.middleware.spec.ts](/e:/GitHub/smart-erp/src/backend/src/common/middleware/logging.middleware.spec.ts)
  - [src/backend/src/common/interceptors/query-performance.interceptor.spec.ts](/e:/GitHub/smart-erp/src/backend/src/common/interceptors/query-performance.interceptor.spec.ts)
  - [src/backend/src/common/filters/http-exception.filter.spec.ts](/e:/GitHub/smart-erp/src/backend/src/common/filters/http-exception.filter.spec.ts)
- Verified with:
  - `npx.cmd jest src/common/logger/logging.interceptor.spec.ts src/common/middleware/logging.middleware.spec.ts src/common/interceptors/query-performance.interceptor.spec.ts src/common/filters/http-exception.filter.spec.ts --runInBand`
  - targeted backend `eslint`
  - `npm.cmd run build` in `src/backend`
  - direct `POST /api/auth/refresh` probe after restart
  - `npm.cmd run runtime:smoke`
- Net effect:
  - backend still restores sessions when a refresh cookie exists
  - missing-cookie bootstrap hits now land as info/expected logs instead of warning noise
  - backend stderr remains limited to dependency-level `DEP0169`

## 2026-03-20 Auth Locale Cleanup
- Cleaned authentication localization assets in:
  - [src/frontend/src/i18n/locales/vi/auth.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/auth.json)
  - [src/frontend/src/i18n/locales/en/auth.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/en/auth.json)
- Removed hardcoded English error messages from [src/frontend/src/pages/auth/LoginPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/auth/LoginPage.tsx) by routing malformed-response and server-error feedback through i18n keys.
- Verified with:
  - `npx.cmd vitest run src/pages/public/RegisterPage.test.tsx src/pages/auth/LoginPage.test.tsx`
  - targeted frontend `eslint` on `src/pages/auth/LoginPage.tsx`
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:smoke`
- Current runtime snapshot after the batch:
  - frontend dev server still healthy on `127.0.0.1:5173`
  - frontend stderr still empty
  - backend/database smoke unchanged and healthy

## 2026-03-20 User Management Locale Cleanup
- Cleaned the Vietnamese user-management locale file in [src/frontend/src/i18n/locales/vi/users.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/users.json).
- Replaced static `antd` message usage with `App.useApp().message` in [src/frontend/src/pages/users/UserList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/users/UserList.tsx).
- Updated [src/frontend/src/pages/users/UserList.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/users/UserList.test.tsx) so the mocked Ant Design shape matches the context-based message contract.
- Verified with:
  - `npx.cmd vitest run src/pages/users/UserList.test.tsx`
  - targeted frontend `eslint` on `src/pages/users/UserList.tsx` and `src/pages/users/UserList.test.tsx`
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:smoke`
- Current runtime snapshot after the batch:
  - frontend/backend/database smoke remains green
  - frontend stderr remains empty
  - backend stderr remains limited to dependency-level `DEP0169`

## 2026-03-20 Session Hint Bootstrap Cleanup
- Root cause:
  - frontend bootstrap was probing `POST /api/auth/refresh` on public entry routes even when no refresh session could exist
  - backend login/register flows did not expose a non-sensitive session hint, and logout did not clear auth cookies
- Fixed backend session cookie handling in:
  - [src/backend/src/core/auth/auth.controller.ts](/e:/GitHub/smart-erp/src/backend/src/core/auth/auth.controller.ts)
  - [src/backend/src/core/auth/auth.controller.spec.ts](/e:/GitHub/smart-erp/src/backend/src/core/auth/auth.controller.spec.ts)
- Fixed frontend bootstrap/refresh guard in:
  - [src/frontend/src/App.tsx](/e:/GitHub/smart-erp/src/frontend/src/App.tsx)
  - [src/frontend/src/App.test.ts](/e:/GitHub/smart-erp/src/frontend/src/App.test.ts)
  - [src/frontend/src/services/api/client.ts](/e:/GitHub/smart-erp/src/frontend/src/services/api/client.ts)
  - [src/frontend/src/services/api/client.test.ts](/e:/GitHub/smart-erp/src/frontend/src/services/api/client.test.ts)
- Implementation details:
  - backend now sets both `refreshToken` and `session_hint=1` on `login`, `register`, and `register-tenant`
  - backend now clears both cookies on `logout`
  - frontend now skips public-route refresh bootstrap when no `session_hint` cookie exists
  - frontend clears `session_hint` locally if token refresh fails
- Verified with:
  - `npx.cmd jest src/core/auth/auth.controller.spec.ts --runInBand`
  - `npx.cmd vitest run src/App.test.ts src/services/api/client.test.ts`
  - `npm.cmd run build` in `src/backend`
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:smoke`
- Net effect:
  - anonymous `/api/auth/refresh` bootstrap noise is no longer required for public-entry loads
  - login/register/logout cookie behavior is now coherent across frontend and backend

## 2026-03-20 Frontend Build Chunk Recovery
- Root cause:
  - `manualChunks` in [src/frontend/vite.config.ts](/e:/GitHub/smart-erp/src/frontend/vite.config.ts) was grouping by page names and under-matching Ant Design transitive packages
  - this caused misleading giant route chunks first, then a monolithic `ui-vendor` chunk
- Fixed chunk strategy in [src/frontend/vite.config.ts](/e:/GitHub/smart-erp/src/frontend/vite.config.ts):
  - removed feature/page-based manual chunking
  - split vendor families by dependency ecosystem instead:
    - `react-vendor`
    - `redux-vendor`
    - `axios`
    - `chart-vendor`
    - `icons-vendor`
    - `style-vendor`
    - `rc-vendor`
    - `ui-vendor`
- Verified with:
  - targeted frontend `eslint` on `vite.config.ts`
  - `npm.cmd run build` in `src/frontend`
- Net effect:
  - `StockReceiptForm` route chunk dropped from ~1.2 MB to ~8 kB
  - frontend build no longer emits the chunk-size warning
  - the remaining large vendor chunks are now intentional dependency-family chunks instead of route-level accidents

## 2026-03-20 Invoice List Runtime Warning Cleanup
- Root cause:
  - [src/frontend/src/pages/invoices/InvoiceList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/invoices/InvoiceList.tsx) was still using static `antd` `message` plus deprecated `Space` prop `direction`
  - the page also had hardcoded English runtime labels for sync state, which was inconsistent with the rest of the localized UI
- Fixed in:
  - [src/frontend/src/pages/invoices/InvoiceList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/invoices/InvoiceList.tsx)
  - [src/frontend/src/pages/invoices/InvoiceList.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/invoices/InvoiceList.test.tsx)
  - [src/frontend/src/i18n/locales/en/invoices.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/en/invoices.json)
  - [src/frontend/src/i18n/locales/vi/invoices.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/invoices.json)
- Implementation details:
  - switched the page to `App.useApp().message` so feedback is theme/context-safe under Ant Design 6
  - replaced `direction` with `orientation`
  - localized sync status labels (`online`, `offline`, `pending queue`, `sync now`, `syncing`)
  - added a focused regression test to lock both orientation behavior and message-context usage
- Verified with:
  - `npx.cmd vitest run src/pages/invoices/InvoiceList.test.tsx`
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:smoke`
- Current runtime snapshot after the batch:
  - frontend `127.0.0.1:5173` healthy
  - backend health on `3000` healthy
  - database smoke healthy against `erp_production`
  - backend stderr still only shows dependency-owned `DEP0169` from the `bcrypt` toolchain

## 2026-03-20 Import Export Localization Cleanup
- Root cause:
  - [src/frontend/src/components/import-export/ImportWizard.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/import-export/ImportWizard.tsx) and [src/frontend/src/components/import-export/ExportDialog.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/import-export/ExportDialog.tsx) still shipped hardcoded English copy in a user-facing workflow
  - the import/export flow had tests, but it was not actually connected to the i18n resource graph yet
- Fixed in:
  - [src/frontend/src/components/import-export/ImportWizard.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/import-export/ImportWizard.tsx)
  - [src/frontend/src/components/import-export/ExportDialog.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/import-export/ExportDialog.tsx)
  - [src/frontend/src/components/import-export/ImportWizard.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/import-export/ImportWizard.test.tsx)
  - [src/frontend/src/components/import-export/ExportDialog.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/import-export/ExportDialog.test.tsx)
  - [src/frontend/src/i18n/locales/en/importExport.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/en/importExport.json)
  - [src/frontend/src/i18n/locales/vi/importExport.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/importExport.json)
  - [src/frontend/src/i18n/config.ts](/e:/GitHub/smart-erp/src/frontend/src/i18n/config.ts)
- Implementation details:
  - introduced a dedicated `importExport` namespace instead of leaving these flows on hardcoded strings
  - localized wizard steps, validation/import result summaries, export format copy, and user-facing success/error messages
  - kept the existing component tests as regression guards and updated them to use translated copy through a mocked `useTranslation`
- Verified with:
  - `npx.cmd vitest run src/components/import-export/ImportWizard.test.tsx src/components/import-export/ExportDialog.test.tsx`
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:smoke`
- Current runtime snapshot after the batch:
  - frontend/backend/database smoke remains green
  - frontend stderr remains empty
  - backend stderr remains limited to dependency-owned `DEP0169`

## 2026-03-20 Stable Runtime Launcher
- Root cause:
  - managed local runtime was still implicitly relying on `nest start --watch` through backend `start:dev`
  - on Windows, Nest CLI watch mode was crashing on restart because `treeKillSync` failed during `taskkill`, which made `runtime:smoke` unreliable even when app code was healthy
- Fixed in:
  - [package.json](/e:/GitHub/smart-erp/package.json)
  - [tools/runtime-start.mjs](/e:/GitHub/smart-erp/tools/runtime-start.mjs)
  - [tools/runtime-stop.mjs](/e:/GitHub/smart-erp/tools/runtime-stop.mjs)
- Implementation details:
  - added root `runtime:start` and `runtime:stop`
  - `runtime:start` now:
    - keeps the frontend Vite dev server if already healthy
    - builds the backend once
    - starts backend in stable mode via `node dist/main.js` instead of watch mode
    - writes pid/log files under `output/`
  - `runtime:stop` now stops only the runtime processes owned by these pid files
  - repeated `runtime:start` runs are idempotent and report `already-running` when services are already healthy
- Verified with:
  - `npm.cmd run runtime:stop`
  - `npm.cmd run runtime:start`
  - `npm.cmd run runtime:start` again for idempotency
  - `npm.cmd run runtime:smoke`
- Current runtime snapshot after the batch:
  - frontend `127.0.0.1:5173` healthy
  - backend health on `3000` healthy
  - database smoke healthy against `erp_production`
  - backend stderr reduced to dependency-level `DEP0169`
  - frontend stderr empty

## 2026-03-20 Search Localization and Namespace Cleanup
- Root cause:
  - [src/frontend/src/pages/search/SearchResultsPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/search/SearchResultsPage.tsx) was using the wrong translation access pattern for the `search` namespace
  - [src/frontend/src/components/search/GlobalSearchBar.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/search/GlobalSearchBar.tsx) still contained hardcoded English placeholder, empty-state, and tag labels
  - [src/frontend/src/i18n/locales/vi/search.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/search.json) contained mojibake instead of clean Vietnamese copy
- Fixed in:
  - [src/frontend/src/components/search/AdvancedFilterPanel.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/search/AdvancedFilterPanel.tsx)
  - [src/frontend/src/components/search/AdvancedFilterPanel.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/search/AdvancedFilterPanel.test.tsx)
  - [src/frontend/src/components/search/GlobalSearchBar.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/search/GlobalSearchBar.tsx)
  - [src/frontend/src/components/search/GlobalSearchBar.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/search/GlobalSearchBar.test.tsx)
  - [src/frontend/src/pages/search/SearchResultsPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/search/SearchResultsPage.tsx)
  - [src/frontend/src/i18n/locales/en/search.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/en/search.json)
  - [src/frontend/src/i18n/locales/vi/search.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/search.json)
- Implementation details:
  - kept `AdvancedFilterPanel` on the `search` namespace and localized all saved-filter user messages/labels
  - moved `GlobalSearchBar` onto search translations for placeholder, empty state, and entity tags
  - switched `SearchResultsPage` to `useTranslation('search')` and corrected all key lookups to match the namespace shape
  - replaced mojibake Vietnamese search copy with clean localized strings
- Verified with:
  - `npx.cmd vitest run src/components/search/AdvancedFilterPanel.test.tsx src/components/search/GlobalSearchBar.test.tsx` in `src/frontend`
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:smoke`
- Current runtime snapshot after the batch:
  - frontend/backend/database smoke remains green
  - frontend stderr remains empty
  - backend stderr remains limited to dependency-owned `DEP0169`

## 2026-03-20 Search Routing Recovery
- Root cause:
  - search UI was building routes that do not exist in the current router tree:
    - global search submit used `/search?q=...`
    - search result items used `/products/:id`, `/customers/:id`, `/suppliers/:id`, `/orders/:id`
  - the real protected app lives under `/dashboard/*`, so the live browser emitted `No routes matched location "/search?q=test"` even after the search page itself was cleaned up
- Fixed in:
  - [src/frontend/src/components/search/searchRoutes.ts](/e:/GitHub/smart-erp/src/frontend/src/components/search/searchRoutes.ts)
  - [src/frontend/src/components/search/searchRoutes.test.ts](/e:/GitHub/smart-erp/src/frontend/src/components/search/searchRoutes.test.ts)
  - [src/frontend/src/components/search/GlobalSearchBar.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/search/GlobalSearchBar.tsx)
  - [src/frontend/src/components/search/GlobalSearchBar.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/search/GlobalSearchBar.test.tsx)
  - [src/frontend/src/pages/search/SearchResultsPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/search/SearchResultsPage.tsx)
- Implementation details:
  - introduced a shared route builder for search flows instead of hardcoding paths in multiple components
  - mapped entity detail navigation to `/dashboard/products/:id`, `/dashboard/customers/:id`, `/dashboard/suppliers/:id`
  - mapped orders by order type to `/dashboard/orders/sales/:id` or `/dashboard/orders/purchase/:id`
  - mapped full search submit to `/dashboard/search?q=...`
- Verified with:
  - `npx.cmd vitest run src/components/search/AdvancedFilterPanel.test.tsx src/components/search/GlobalSearchBar.test.tsx src/components/search/searchRoutes.test.ts` in `src/frontend`
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:smoke`
  - browser smoke with injected E2E session and mocked search API on `http://127.0.0.1:5173/dashboard/search?q=test`
- Current browser/runtime snapshot after the batch:
  - route mismatch warning is gone
  - tenant context error is gone when the injected token is structurally valid
  - remaining browser warnings now point to Ant Design deprecations in layout/search shells rather than broken search navigation

## 2026-03-20 Search Shell Deprecation Cleanup
- Root cause:
  - browser smoke on the live search flow was still emitting Ant Design deprecations from shell components, not business logic:
    - `Drawer.bodyStyle`
    - `Drawer.width`
    - `Spin.tip`
    - `Tabs.TabPane`
- Fixed in:
  - [src/frontend/src/components/layout/MainLayout.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/layout/MainLayout.tsx)
  - [src/frontend/src/components/layout/MainLayout.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/layout/MainLayout.test.tsx)
  - [src/frontend/src/pages/search/SearchResultsPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/search/SearchResultsPage.tsx)
  - [src/frontend/src/routes/index.tsx](/e:/GitHub/smart-erp/src/frontend/src/routes/index.tsx)
- Implementation details:
  - migrated mobile drawer body padding to `styles.body`
  - replaced drawer sizing with `size`
  - replaced route loader `Spin.tip` with `description`
  - migrated search result tabs from legacy `TabPane` children to `items`
  - hardened `MainLayout` tests with an explicit Ant Design mock so Vitest no longer emits jsdom drawer noise
- Verified with:
  - `npx.cmd vitest run src/components/layout/MainLayout.test.tsx src/components/search/AdvancedFilterPanel.test.tsx src/components/search/GlobalSearchBar.test.tsx src/components/search/searchRoutes.test.ts` in `src/frontend`
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:smoke`
  - browser smoke with injected E2E session and mocked search API on `http://127.0.0.1:5173/dashboard/search?q=test`
- Current browser/runtime snapshot after the batch:
  - no Ant Design deprecation warnings remain on the exercised search flow
  - frontend stderr remains empty
  - backend/database smoke remains green

## 2026-03-20 Telemetry Bootstrap Noise Cleanup
- Root cause:
  - public-entry browser smoke on `/login` and `/register` was still producing avoidable warning noise on every page load when telemetry was intentionally unconfigured in development
  - the frontend monitoring bootstrap was treating missing Sentry DSN and missing GA4 ID as warnings even in development, where those omissions are normal
- Fixed in:
  - [src/frontend/src/lib/monitoring/sentry.ts](/e:/GitHub/smart-erp/src/frontend/src/lib/monitoring/sentry.ts)
  - [src/frontend/src/lib/monitoring/sentry.test.ts](/e:/GitHub/smart-erp/src/frontend/src/lib/monitoring/sentry.test.ts)
  - [src/frontend/src/lib/monitoring/analytics.ts](/e:/GitHub/smart-erp/src/frontend/src/lib/monitoring/analytics.ts)
  - [src/frontend/src/lib/monitoring/analytics.test.ts](/e:/GitHub/smart-erp/src/frontend/src/lib/monitoring/analytics.test.ts)
- Implementation details:
  - missing telemetry configuration is now silent in development
  - missing telemetry configuration still warns in production, where it is operationally relevant
  - GA4 no longer logs a redundant “disabled in development” info message
- Verified with:
  - `npx.cmd vitest run src/lib/monitoring/sentry.test.ts src/lib/monitoring/analytics.test.ts` in `src/frontend`
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:smoke`
  - browser smoke on `http://127.0.0.1:5173/login` and `http://127.0.0.1:5173/register`
- Current browser/runtime snapshot after the batch:
  - `/login` and `/register` no longer emit telemetry warnings in dev
  - frontend stderr remains empty
  - backend/database smoke remains green

## 2026-03-20 Playwright UI Launcher Recovery
- Root cause:
  - `npm run test:e2e:ui` and [playwright-ui.cmd](/e:/GitHub/smart-erp/playwright-ui.cmd) were hardcoding `127.0.0.1:9323`
  - if a Playwright UI instance was already running, the launcher crashed with `EADDRINUSE` instead of reusing the existing UI or choosing a safe fallback
- Fixed in:
  - [run-playwright.cjs](/e:/GitHub/smart-erp/run-playwright.cjs)
  - [package.json](/e:/GitHub/smart-erp/package.json)
  - [playwright-ui.cmd](/e:/GitHub/smart-erp/playwright-ui.cmd)
- Implementation details:
  - the wrapper now owns default UI host/port injection instead of the npm/cmd shims
  - when the target port is already serving Playwright UI, the launcher exits cleanly and points users to the running UI instead of crashing
  - when the default port is busy with some other process, the wrapper can pick the next available port automatically
  - explicit custom `--ui-port` values still fail fast with a clear message if they are unavailable
- Verified with:
  - `npm.cmd run test:e2e:ui`
  - direct HTTP probe to `http://127.0.0.1:9323`
- Current runtime snapshot after the batch:
  - Playwright UI launcher is now reusable during day-to-day dev workflows
  - the default local UI endpoint remains `http://127.0.0.1:9323`

## 2026-03-20 Landing Page Localization Recovery
- Root cause:
  - the public landing page `/` still contained mojibake and hardcoded copy in the marketing surface even after public auth and legal flows were cleaned up
  - [tools/browser-smoke.mjs](/e:/GitHub/smart-erp/tools/browser-smoke.mjs) was not exercising `/`, so the regression was easy to miss in routine smoke runs
- Fixed in:
  - [src/frontend/src/pages/public/LandingPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/public/LandingPage.tsx)
  - [src/frontend/src/components/marketing/Hero.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/marketing/Hero.tsx)
  - [src/frontend/src/components/marketing/Features.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/marketing/Features.tsx)
  - [src/frontend/src/components/marketing/CTA.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/marketing/CTA.tsx)
  - [src/frontend/src/components/marketing/Pricing.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/marketing/Pricing.tsx)
  - [src/frontend/src/constants/landing-page.ts](/e:/GitHub/smart-erp/src/frontend/src/constants/landing-page.ts)
  - [src/frontend/src/i18n/locales/en/landing.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/en/landing.json)
  - [src/frontend/src/i18n/locales/vi/landing.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/landing.json)
  - [tests/e2e/public/landing.spec.ts](/e:/GitHub/smart-erp/tests/e2e/public/landing.spec.ts)
  - [tools/browser-smoke.mjs](/e:/GitHub/smart-erp/tools/browser-smoke.mjs)
- Implementation details:
  - marketing copy now comes from the `landing` namespace instead of corrupted hardcoded strings
  - testimonial and FAQ content are localized through i18n rather than embedded mojibake constants
  - the landing page footer now uses internal links for legal routes
  - browser smoke now covers `/` so the public marketing surface is checked with the rest of the public/auth routes
  - landing E2E assertions were updated to be locale-aware because Playwright runs with `en-US`
- Verified with:
  - `npm.cmd run build` in `src/frontend`
  - `npm.cmd run runtime:browser-smoke`
  - `npx.cmd playwright test tests/e2e/public/landing.spec.ts --project=chromium`
  - targeted `eslint` in `src/frontend` for landing and marketing files
- Current browser/runtime snapshot after the batch:
  - `/` now renders clean localized marketing copy
  - browser smoke shows no warnings, errors, or failed requests on the landing page
  - the landing E2E suite passes again on Chromium

## 2026-03-20 Session Timeout UX Cleanup
- Root cause:
  - authenticated route protection was still wired to a legacy inactivity hook that used static `antd` message APIs, duplicated timeout logic, and redirected with `window.location.href`
  - a newer [useSessionTimeout.ts](/e:/GitHub/smart-erp/src/frontend/src/hooks/useSessionTimeout.ts) already existed, but it was not the hook protecting live routes
  - session expiry also redirected users back to `/login` without any explicit UI explanation on the page itself
- Fixed in:
  - [src/frontend/src/hooks/useSessionTimeout.ts](/e:/GitHub/smart-erp/src/frontend/src/hooks/useSessionTimeout.ts)
  - [src/frontend/src/hooks/useSessionTimeout.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/hooks/useSessionTimeout.test.tsx)
  - [src/frontend/src/hooks/useInactivityLogout.ts](/e:/GitHub/smart-erp/src/frontend/src/hooks/useInactivityLogout.ts)
  - [src/frontend/src/components/auth/ProtectedRoute.tsx](/e:/GitHub/smart-erp/src/frontend/src/components/auth/ProtectedRoute.tsx)
  - [src/frontend/src/pages/auth/LoginPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/auth/LoginPage.tsx)
  - [src/frontend/src/pages/auth/LoginPage.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/auth/LoginPage.test.tsx)
  - [src/frontend/src/i18n/locales/vi/common.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/common.json)
- Implementation details:
  - protected routes now use a single session-timeout hook instead of the legacy duplicate inactivity hook
  - the timeout hook supports authenticated-only enablement and optional warning callbacks
  - auto-logout no longer relies on static Ant Design message APIs or `window.location.href`
  - timed-out users are redirected back to `/login` with a session-expired reason and the login page now renders a clear warning alert
  - common Vietnamese language labels were normalized so the locale surface stays consistent with the cleaned auth/public UX
- Verified with:
  - `npx.cmd vitest run src/hooks/useSessionTimeout.test.tsx src/pages/auth/LoginPage.test.tsx` in `src/frontend`
  - `npm.cmd run type-check` in `src/frontend`
  - `npm.cmd run runtime:browser-smoke`
- Current browser/runtime snapshot after the batch:
  - public auth routes remain clean in browser smoke
  - no new frontend warnings or failed requests were introduced by the timeout cleanup
  - session expiry logic is now testable at hook level instead of living only in route side effects

## 2026-03-20 Runtime Probe Separation
- Root cause:
  - runtime tooling was still treating `/api/health` as the single signal for “backend up”
  - that endpoint is a deep readiness probe, so a short database wobble could make local runtime workflows look broken even when the HTTP process itself was alive
  - the backend already exposed a lightweight liveness route, but the launcher and smoke tooling were not using it
- Fixed in:
  - [tools/runtime-start.mjs](/e:/GitHub/smart-erp/tools/runtime-start.mjs)
  - [tools/runtime-smoke.mjs](/e:/GitHub/smart-erp/tools/runtime-smoke.mjs)
- Implementation details:
  - runtime start now waits on `/api/health/live` for backend liveness
  - runtime smoke reports both backend `live` and backend `ready`
  - smoke exit status now keys off frontend liveness, backend liveness, and direct database connectivity instead of treating deep readiness as the only “backend alive” signal
- Verified with:
  - `npm.cmd run runtime:start`
  - `npm.cmd run runtime:smoke`
- Current runtime snapshot after the batch:
  - local runtime tooling is less noisy during transient DB turbulence
  - readiness is still visible in reports without being conflated with process liveness

## 2026-03-20 Notification Shell Modernization
- Root cause:
  - the notification center still used static `antd` message APIs outside the app context
  - the notification list page still rendered tabs through the legacy `Tabs.TabPane` pattern
- Fixed in:
  - [src/frontend/src/pages/notifications/NotificationCenter.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/notifications/NotificationCenter.tsx)
  - [src/frontend/src/pages/notifications/NotificationCenter.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/notifications/NotificationCenter.test.tsx)
  - [src/frontend/src/pages/notifications/NotificationListPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/notifications/NotificationListPage.tsx)
- Implementation details:
  - notification feedback now goes through `App.useApp().message`, which is compatible with theme/context-aware Ant Design usage
  - the notification list page now uses `Tabs.items` instead of `Tabs.TabPane`
- Verified with:
  - `npx.cmd vitest run src/pages/notifications/NotificationCenter.test.tsx src/pages/notifications/NotificationListPage.test.tsx` in `src/frontend`
  - `npm.cmd run type-check` in `src/frontend`
- Current frontend snapshot after the batch:
  - notifications shell is aligned with the newer feedback pattern used across recently cleaned pages
  - no TypeScript regressions were introduced

## 2026-03-20 Manufacturing Runtime Contract Recovery
- Root cause:
  - production list pages for work centers and work orders assumed `manufacturingService` returned arrays directly
  - the real backend contract for `/api/manufacturing/work-centers` and `/api/manufacturing/work-orders` is the standard envelope `{ success, data, message }`
  - [manufacturing.service.ts](/e:/GitHub/smart-erp/src/frontend/src/services/manufacturing/manufacturing.service.ts) was returning `response.data` raw, so the pages received envelope objects and crashed on `.filter(...)`
- Fixed in:
  - [src/frontend/src/services/manufacturing/manufacturing.service.ts](/e:/GitHub/smart-erp/src/frontend/src/services/manufacturing/manufacturing.service.ts)
  - [src/frontend/src/services/manufacturing/manufacturing.service.test.ts](/e:/GitHub/smart-erp/src/frontend/src/services/manufacturing/manufacturing.service.test.ts)
  - [src/frontend/src/pages/production/WorkCenterList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/production/WorkCenterList.tsx)
  - [src/frontend/src/pages/production/WorkCenterList.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/production/WorkCenterList.test.tsx)
  - [src/frontend/src/pages/production/WorkOrderList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/production/WorkOrderList.tsx)
  - [src/frontend/src/pages/production/WorkOrderList.test.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/production/WorkOrderList.test.tsx)
- Implementation details:
  - manufacturing service now unwraps the standard API envelope before returning list and detail payloads
  - service tests now lock the envelope contract for BOM, work center, and work order list endpoints
  - the two production list pages were also modernized to use `App.useApp().modal.confirm` instead of static `Modal.confirm`
- Verified with:
  - `npx.cmd vitest run src/services/manufacturing/manufacturing.service.test.ts src/pages/production/WorkCenterList.test.tsx src/pages/production/WorkOrderList.test.tsx` in `src/frontend`
  - `npm.cmd run type-check` in `src/frontend`
  - direct backend probes confirmed both endpoints return `{ success, data, message }`
  - browser smoke via Playwright/Chromium against `/dashboard/production/work-centers` and `/dashboard/production/work-orders`
- Current browser/runtime snapshot after the batch:
  - both production routes now render successfully with no console errors
  - frontend stderr remains empty after exercising the pages
  - backend stderr still only shows the known dependency-owned `DEP0169` warning from the bcrypt toolchain

## 2026-03-20 Auth Bootstrap Refresh Noise Cleanup
- Root cause:
  - app bootstrap still relied on the `session_hint` cookie alone to decide whether to call `/api/auth/refresh`
  - when the refresh-token cookie had already disappeared but `session_hint` remained, public route visits could still trigger useless refresh calls and backend log noise
  - the public-route guard list was also incomplete, so some public pages were not treated consistently by the auth bootstrap helpers
- Fixed in:
  - [src/frontend/src/lib/auth/sessionRefresh.ts](/e:/GitHub/smart-erp/src/frontend/src/lib/auth/sessionRefresh.ts)
  - [src/frontend/src/App.tsx](/e:/GitHub/smart-erp/src/frontend/src/App.tsx)
  - [src/frontend/src/App.test.ts](/e:/GitHub/smart-erp/src/frontend/src/App.test.ts)
  - [src/frontend/src/services/auth/authService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/auth/authService.ts)
  - [src/frontend/src/services/auth/authService.test.ts](/e:/GitHub/smart-erp/src/frontend/src/services/auth/authService.test.ts)
  - [src/frontend/src/services/api/client.ts](/e:/GitHub/smart-erp/src/frontend/src/services/api/client.ts)
- Implementation details:
  - the session-refresh helper now recognizes all public auth/legal routes instead of only `/`, `/login`, and `/register`
  - a small session-scoped negative cache now records recent refresh failures so stale `session_hint` cookies do not keep retriggering `/auth/refresh`
  - successful login, register, and token refresh flows clear that failure cache so valid sessions still restore normally
  - app bootstrap now marks failed refresh attempts explicitly and stops retrying the same stale session hint during the same browser session
- Verified with:
  - `npx.cmd vitest run src/App.test.ts src/services/auth/authService.test.ts src/services/api/client.test.ts` in `src/frontend`
  - `npm.cmd run type-check` in `src/frontend`
  - `npm.cmd run runtime:browser-smoke`
  - targeted Playwright/Chromium public-route probe with a forced stale `session_hint` cookie, followed by backend log inspection
- Current browser/runtime snapshot after the batch:
  - public auth and legal routes remain clean in browser smoke
  - forced stale `session_hint` probes no longer produced new `/api/auth/refresh` entries in the backend runtime log
  - backend runtime log noise is now dominated by real backend drift rather than repeated anonymous refresh misses

## 2026-03-20 BOM Route Standardization
- Root cause:
  - the manufacturing BOM cluster used singular route segments (`/dashboard/production/bom`) while adjacent manufacturing modules used plural resources
  - browser validation against plural URLs showed blank pages with `No routes matched location`, which exposed the inconsistency
  - BOM pages also still relied on static Ant Design feedback APIs, and the form table used `rowKey` based on the deprecated `index` parameter
- Fixed in:
  - [src/frontend/src/routes/index.tsx](/e:/GitHub/smart-erp/src/frontend/src/routes/index.tsx)
  - [src/frontend/src/pages/production/BOMList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/production/BOMList.tsx)
  - [src/frontend/src/pages/production/BOMForm.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/production/BOMForm.tsx)
- Implementation details:
  - canonical manufacturing BOM routes now use `/dashboard/production/boms`, `/boms/new`, and `/boms/:id/edit`
  - legacy singular aliases remain mounted so older links and bookmarks still work during the transition
  - BOM list feedback now uses `App.useApp().message` and `App.useApp().modal.confirm`
  - BOM form line items now carry stable local keys, so the embedded table no longer depends on deprecated index-based row keys
- Verified with:
  - `npx.cmd vitest run src/pages/production/BOMList.test.tsx` in `src/frontend`
  - `npm.cmd run type-check` in `src/frontend`
  - browser smoke via Playwright/Chromium against `/dashboard/production/boms`, `/dashboard/production/boms/new`, `/dashboard/production/bom`, and `/dashboard/production/bom/new`
- Current browser/runtime snapshot after the batch:
  - both canonical and legacy BOM URLs render successfully
  - BOM form no longer emits the Ant Design `rowKey(index)` deprecation warning
  - no new frontend stderr output was introduced by the route standardization

## 2026-03-20 Settings Runtime Recovery
- Root cause:
  - backend `core/settings` bound [Setting](/e:/GitHub/smart-erp/src/backend/src/core/settings/entities/setting.entity.ts) to a tenant-scoped `settings` table that did not exist in the local database
  - the database only had the older global `system_settings` table, which belongs to a different module and schema contract
  - after the backend schema was repaired, frontend settings utilities were still returning the raw `{ success, data, message }` envelope, so [SettingsPage](/e:/GitHub/smart-erp/src/frontend/src/pages/settings/SettingsPage.tsx) crashed inside Ant Design `Table`
- Fixed in:
  - [src/backend/src/migrations/1761004800000-CreateSettingsTable.ts](/e:/GitHub/smart-erp/src/backend/src/migrations/1761004800000-CreateSettingsTable.ts)
  - [src/frontend/src/services/utils/settingsService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/utils/settingsService.ts)
  - [src/frontend/src/services/utils/settingsService.test.ts](/e:/GitHub/smart-erp/src/frontend/src/services/utils/settingsService.test.ts)
  - [src/frontend/src/pages/settings/SettingsPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/settings/SettingsPage.tsx)
- Implementation details:
  - added a migration that creates the tenant-scoped `settings` table with the columns expected by the current entity and indexes used by the settings service
  - optional backfill from `system_settings` only runs when that table actually exposes `tenant_id`, avoiding unsafe fake tenant mapping on older schemas
  - frontend settings service now unwraps the standard API envelope before returning list/detail payloads
  - settings page feedback now uses `App.useApp().message` instead of static Ant Design message APIs
- Verified with:
  - `npm.cmd run db:init` in `src/backend`
  - `npm.cmd run type-check` in `src/backend`
  - direct authenticated probes to `/api/settings/public` and `/api/settings?category=GENERAL`
  - `npx.cmd vitest run src/services/utils/settingsService.test.ts src/hooks/useSettings.test.ts` in `src/frontend`
  - `npm.cmd run type-check` in `src/frontend`
  - browser smoke via Playwright/Chromium against `/dashboard/settings`
- Current browser/runtime snapshot after the batch:
  - backend settings endpoints now return `200` with empty arrays instead of `500`
  - `/dashboard/settings` now renders instead of crashing in the error boundary
  - backend error log tail still contains older pre-fix `settings` failures, but fresh probes after the migration are clean

## 2026-03-20 Settings Localization Cleanup
- Root cause:
  - after the settings runtime contract was fixed, `/dashboard/settings` still surfaced raw `systemSettings.*` translation keys
  - [src/frontend/src/i18n/locales/en/settings.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/en/settings.json) and especially [src/frontend/src/i18n/locales/vi/settings.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/settings.json) were missing the nested `table`, `form`, `messages`, and modal title keys used by [SettingsPage](/e:/GitHub/smart-erp/src/frontend/src/pages/settings/SettingsPage.tsx)
  - the Vietnamese locale file also had pervasive mojibake, so patching a few keys would have left the page partially corrupted
- Fixed in:
  - [src/frontend/src/i18n/locales/en/settings.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/en/settings.json)
  - [src/frontend/src/i18n/locales/vi/settings.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/settings.json)
- Implementation details:
  - added the missing `systemSettings.table`, `systemSettings.form`, `systemSettings.messages`, `addTitle`, `editTitle`, and `addButton` keys used by the settings page
  - rewrote the Vietnamese settings locale file as clean UTF-8 instead of leaving mojibake fragments in place
  - kept the existing settings namespace structure so the rest of the settings surfaces remain compatible
- Verified with:
  - `npm.cmd run type-check` in `src/frontend`
  - browser smoke via Playwright/Chromium against `/dashboard/settings`
- Current browser/runtime snapshot after the batch:
  - `/dashboard/settings` now renders localized Vietnamese copy instead of raw translation keys
  - no frontend warnings or page errors were emitted during the smoke run

## 2026-03-20 Audit Runtime Recovery
- Root cause:
  - [src/frontend/src/services/audit/auditService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/audit/auditService.ts) had drifted from the current backend contract in two different ways
  - the frontend assumed audit endpoints returned raw arrays/objects, while the backend wraps payloads in the standard `{ success, data, message }` envelope
  - local runtime also lacked the tenant-scoped `audit_logs` table, and once the table was created the entity still mapped camelCase property names to snake_case columns incorrectly
- Fixed in:
  - [src/backend/src/migrations/1761006000000-CreateAuditLogsTable.ts](/e:/GitHub/smart-erp/src/backend/src/migrations/1761006000000-CreateAuditLogsTable.ts)
  - [src/backend/src/platform/audit/entities/audit-log.entity.ts](/e:/GitHub/smart-erp/src/backend/src/platform/audit/entities/audit-log.entity.ts)
  - [src/backend/src/platform/audit/audit.service.ts](/e:/GitHub/smart-erp/src/backend/src/platform/audit/audit.service.ts)
  - [src/frontend/src/services/audit/auditService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/audit/auditService.ts)
  - [src/frontend/src/services/audit/auditService.test.ts](/e:/GitHub/smart-erp/src/frontend/src/services/audit/auditService.test.ts)
  - [src/frontend/src/pages/audit/AuditLogPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/audit/AuditLogPage.tsx)
  - [tools/browser-smoke.mjs](/e:/GitHub/smart-erp/tools/browser-smoke.mjs)
- Implementation details:
  - added the missing `audit_logs` migration with the columns and indexes expected by the current audit module
  - mapped `tenantId`, `userId`, `entityType`, `entityId`, `oldValue`, `newValue`, `ipAddress`, `userAgent`, and `createdAt` explicitly onto the snake_case database columns
  - restored `tenantId` persistence when writing audit log entries
  - frontend audit service now unwraps the standard API envelope before building logs, statistics, and timeline data
  - `/dashboard/audit` is now part of browser smoke so future runtime drift is caught automatically
- Verified with:
  - `npm.cmd run db:init` in `src/backend`
  - `npx.cmd jest src/platform/audit/audit.service.spec.ts src/platform/audit/audit.controller.spec.ts --runInBand` in `src/backend`
  - `npx.cmd vitest run src/services/audit/auditService.test.ts` in `src/frontend`
  - direct authenticated probes to `/api/audit/logs` and `/api/audit/summary?startDate=...&endDate=...`
  - Playwright/Chromium browser probe against `/dashboard/audit`
- Current browser/runtime snapshot after the batch:
  - `/dashboard/audit` renders cleanly with no failed requests, warnings, or page errors
  - audit API endpoints now return `200` with empty-state payloads instead of `500`
  - backend runtime stderr is back to the single dependency-owned `DEP0169` deprecation warning

## 2026-03-20 Accounting Runtime Recovery
- Root cause:
  - the accounting accounts and journal routes had two separate drifts at once: frontend pages were bypassing the shared API client with raw `axios`, and the local database did not have the `accounts`, `journal_entries`, or `journal_lines` tables required by the backend entities
  - after the schema gap was repaired, journal filtering still broke because [src/backend/src/domains/accounting/account/account.service.ts](/e:/GitHub/smart-erp/src/backend/src/domains/accounting/account/account.service.ts) queried a non-existent `entryDate` property instead of the entity field `date`
  - the accounting locale namespace also still contained mojibake and missing keys around update/cancel flows
- Fixed in:
  - [src/backend/src/migrations/1761006600000-CreateAccountingTables.ts](/e:/GitHub/smart-erp/src/backend/src/migrations/1761006600000-CreateAccountingTables.ts)
  - [src/backend/src/domains/accounting/account/account.service.ts](/e:/GitHub/smart-erp/src/backend/src/domains/accounting/account/account.service.ts)
  - [src/backend/src/domains/accounting/account/account.service.spec.ts](/e:/GitHub/smart-erp/src/backend/src/domains/accounting/account/account.service.spec.ts)
  - [src/frontend/src/services/accounting/accountService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/accounting/accountService.ts)
  - [src/frontend/src/services/accounting/accountService.test.ts](/e:/GitHub/smart-erp/src/frontend/src/services/accounting/accountService.test.ts)
  - [src/frontend/src/services/accounting/journalEntryService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/accounting/journalEntryService.ts)
  - [src/frontend/src/services/accounting/journalEntryService.test.ts](/e:/GitHub/smart-erp/src/frontend/src/services/accounting/journalEntryService.test.ts)
  - [src/frontend/src/pages/accounting/ChartOfAccounts.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/accounting/ChartOfAccounts.tsx)
  - [src/frontend/src/pages/accounting/AccountForm.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/accounting/AccountForm.tsx)
  - [src/frontend/src/pages/accounting/JournalEntryList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/accounting/JournalEntryList.tsx)
  - [src/frontend/src/i18n/locales/en/accounting.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/en/accounting.json)
  - [src/frontend/src/i18n/locales/vi/accounting.json](/e:/GitHub/smart-erp/src/frontend/src/i18n/locales/vi/accounting.json)
  - [tools/browser-smoke.mjs](/e:/GitHub/smart-erp/tools/browser-smoke.mjs)
- Implementation details:
  - added the missing accounting tables with the columns expected by the current entities and local multi-tenant sync metadata conventions
  - switched accounting pages from raw `axios` to shared accounting services backed by the standard API client, so auth headers and refresh behavior are handled consistently
  - frontend services now unwrap the standard `{ success, data }` envelope before returning account and journal data to pages
  - rewrote the accounting locale files as clean UTF-8 and added the missing `income`, `updateError`, `postError`, and cancel-action keys used by the current UI
  - `/dashboard/accounting/accounts`, `/dashboard/accounting/accounts/new`, and `/dashboard/accounting/journal-entries` are now covered by browser smoke
- Verified with:
  - `npm.cmd run db:init` in `src/backend`
  - `npm.cmd run build` in `src/backend`
  - `npx.cmd jest src/domains/accounting/account/account.service.spec.ts src/domains/accounting/account/account.controller.spec.ts --runInBand` in `src/backend`
  - `npx.cmd vitest run src/services/accounting/accountService.test.ts src/services/accounting/journalEntryService.test.ts` in `src/frontend`
  - `npm.cmd run type-check` in both `src/frontend` and `src/backend`
  - direct authenticated probes to `/api/accounting/accounts` and `/api/accounting/journal-entries`
  - Playwright/Chromium browser probes against the three accounting routes
- Current browser/runtime snapshot after the batch:
  - the accounting list/form routes render clean empty states with no failed requests or console noise
  - authenticated backend probes for accounts and journal entries now return `200`
  - runtime log noise remains limited to the known dependency-owned `DEP0169` warning

## 2026-03-20 Ecommerce Order Runtime Recovery
- Root cause:
  - the ecommerce order list route was failing for two real reasons at the same time: [src/backend/src/domains/ecommerce/order/order.controller.ts](/e:/GitHub/smart-erp/src/backend/src/domains/ecommerce/order/order.controller.ts) was missing auth guards on the controller, and the local database schema still reflected the older snake_case `orders` table without the `order_items` relation table expected by the current entities
  - after the controller was protected, the runtime still failed because the service queried camelCase column names in raw QueryBuilder clauses against a snake_case PostgreSQL schema
  - the frontend order list also depended on a slightly different payload shape (`totalAmount`) than the current backend entity (`total`)
- Fixed in:
  - [src/backend/src/domains/ecommerce/order/order.controller.ts](/e:/GitHub/smart-erp/src/backend/src/domains/ecommerce/order/order.controller.ts)
  - [src/backend/src/domains/ecommerce/order/order.controller.spec.ts](/e:/GitHub/smart-erp/src/backend/src/domains/ecommerce/order/order.controller.spec.ts)
  - [src/backend/src/domains/ecommerce/order/entities/order.entity.ts](/e:/GitHub/smart-erp/src/backend/src/domains/ecommerce/order/entities/order.entity.ts)
  - [src/backend/src/domains/ecommerce/order/entities/order-item.entity.ts](/e:/GitHub/smart-erp/src/backend/src/domains/ecommerce/order/entities/order-item.entity.ts)
  - [src/backend/src/domains/ecommerce/order/order.service.ts](/e:/GitHub/smart-erp/src/backend/src/domains/ecommerce/order/order.service.ts)
  - [src/backend/src/domains/ecommerce/order/order.service.spec.ts](/e:/GitHub/smart-erp/src/backend/src/domains/ecommerce/order/order.service.spec.ts)
  - [src/backend/src/migrations/1761007200000-RecoverEcommerceOrderTables.ts](/e:/GitHub/smart-erp/src/backend/src/migrations/1761007200000-RecoverEcommerceOrderTables.ts)
  - [src/frontend/src/services/order/orderService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/order/orderService.ts)
  - [src/frontend/src/services/order/orderService.test.ts](/e:/GitHub/smart-erp/src/frontend/src/services/order/orderService.test.ts)
  - [src/frontend/src/pages/ecommerce/EcommerceOrderList.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/ecommerce/EcommerceOrderList.tsx)
  - [tools/browser-smoke.mjs](/e:/GitHub/smart-erp/tools/browser-smoke.mjs)
- Implementation details:
  - added guard protection back onto the order controller so `CurrentUser` is always available on protected ecommerce order routes
  - mapped ecommerce order entities explicitly onto the local snake_case schema instead of pretending the database had camelCase columns
  - added a recovery migration that creates `order_items`, adds the missing ecommerce order columns, and backfills line items from the legacy JSONB `orders.items` payload when possible
  - updated raw QueryBuilder filters/order clauses in the backend service to use the actual snake_case column names
  - normalized the frontend order service so list/detail consumers can safely use `totalAmount` while the backend keeps `total_amount` mapped to the entity field `total`
  - added `/dashboard/ecommerce/orders` to browser smoke to keep this route under ongoing runtime watch
- Verified with:
  - `npm.cmd run db:init` in `src/backend`
  - `npm.cmd run build` in `src/backend`
  - `npx.cmd jest src/domains/ecommerce/order/order.service.spec.ts src/domains/ecommerce/order/order.controller.spec.ts --runInBand` in `src/backend`
  - `npx.cmd vitest run src/services/order/orderService.test.ts` in `src/frontend`
  - `npm.cmd run type-check` in `src/frontend`
  - direct authenticated probes to `/api/orders` and `/api/orders/statistics`
  - `npm.cmd run runtime:browser-smoke`
- Current browser/runtime snapshot after the batch:
  - authenticated ecommerce order APIs now return `200` instead of `500`
  - `/dashboard/ecommerce/orders` is part of browser smoke coverage alongside the broader ecommerce surfaces
  - backend stderr remains clean apart from the known dependency-owned `DEP0169` deprecation warning

## 2026-03-20 Reporting Runtime Recovery
- Root cause:
  - [src/frontend/src/pages/reports/ReportsPage.tsx](/e:/GitHub/smart-erp/src/frontend/src/pages/reports/ReportsPage.tsx) was mounting a report dashboard that depended on the `/api/reporting/*` namespace, but the backend only exposed `accounting/reports/*`, so the page immediately generated a wall of `404` requests on load
  - even once routes existed, [src/frontend/src/services/report/reportingService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/report/reportingService.ts) still assumed raw payloads instead of the standard `{ success, data }` API envelope
- Fixed in:
  - [src/backend/src/domains/accounting/reports/reporting.controller.ts](/e:/GitHub/smart-erp/src/backend/src/domains/accounting/reports/reporting.controller.ts)
  - [src/backend/src/domains/accounting/reports/reports.module.ts](/e:/GitHub/smart-erp/src/backend/src/domains/accounting/reports/reports.module.ts)
  - [src/backend/src/domains/accounting/reports/reports.controller.spec.ts](/e:/GitHub/smart-erp/src/backend/src/domains/accounting/reports/reports.controller.spec.ts)
  - [src/frontend/src/services/report/reportingService.ts](/e:/GitHub/smart-erp/src/frontend/src/services/report/reportingService.ts)
  - [src/frontend/src/services/report/reportingService.test.ts](/e:/GitHub/smart-erp/src/frontend/src/services/report/reportingService.test.ts)
  - [tools/browser-smoke.mjs](/e:/GitHub/smart-erp/tools/browser-smoke.mjs)
- Implementation details:
  - added a backend reporting facade under `/reporting/*` that maps the existing accounting report service into the contract already expected by the current dashboard UI
  - preserved richer reports where the backend already had enough data, and returned safe empty-state payloads for the dashboard surfaces that do not yet have a full analytics engine behind them
  - kept export endpoints available for the frontend by returning downloadable payloads rather than leaving broken links behind
  - updated the frontend reporting service to unwrap the standard API envelope before exposing data to hooks and pages
  - added `/dashboard/reports` to browser smoke so future route drift shows up immediately
- Verified with:
  - `npx.cmd vitest run src/services/report/reportingService.test.ts` in `src/frontend`
  - `npx.cmd jest src/domains/accounting/reports/reports.controller.spec.ts src/domains/accounting/reports/reports.service.spec.ts --runInBand` in `src/backend`
  - `npm.cmd run build` in `src/backend`
  - `npm.cmd run type-check` in `src/frontend`
  - direct authenticated probes to `/api/reporting/sales`, `/api/reporting/inventory`, `/api/reporting/customers`, and `/api/reporting/financial`
  - Playwright/Chromium browser probe against `/dashboard/reports`
- Current browser/runtime snapshot after the batch:
  - `/dashboard/reports` now renders cleanly with no failed requests or console errors
  - the reporting namespace returns `200` empty-state payloads instead of `404`
  - backend stderr remains limited to the known dependency-owned `DEP0169` warning
