# Project Working Report

**Date:** 2026-03-19  
**Project:** SmartERP  
**Purpose:** Shared working report for stabilizing the codebase and creating a reliable plan of execution.

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
