# SmartERP Technical Spec v1

Date: 2026-03-30
Owner: Codex
Status: Superseded

Superseded on 2026-03-30 by `docs/SMARTERP_NEXT_FOUNDATION.md` after the rewrite decision.

## Spec Intent

This document defines the technical contract for SmartERP v1.

It exists to stop architectural drift, scope drift, and agent drift between now and launch.

## Release Shape

SmartERP v1 is one focused product release with a narrow functional surface.

We do not try to make the full repository launchable.

We make the release-critical surface stable, testable, deployable, and demoable.

## Current Technical Base

### Backend

The backend is a NestJS modular monolith organized through a single application graph in [app.module.ts](E:/GitHub/smart-erp/src/backend/src/app.module.ts).

Persistence currently uses TypeORM with SQLite in the active local setup.

### Frontend

The frontend is a Vite React SPA with the authenticated shell and route composition rooted in [App.tsx](E:/GitHub/smart-erp/src/frontend/src/App.tsx).

### Delivery

The repository already supports local build flows, but the production deployment workflow is not release-ready yet.

## Architecture Decision

The v1 release architecture is fixed as:

- One backend modular monolith
- One frontend SPA
- One coherent authenticated product shell

We do not split into multiple deployable apps before launch.

We do not add new platform layers unless they directly unblock release-critical reliability.

## Release-Critical Backend Domains

The following areas are release-critical and may receive stabilization work:

- `core/auth`
- `core/tenant`
- `core/user`
- `domains/sales/customer`
- `domains/inventory/product`
- `domains/inventory`
- `domains/sales/order`
- `domains/accounting` limited to invoice-critical functionality
- `platform/dashboard`
- `platform/report`
- `utilities/health`
- `utilities/seed`

## Non-Critical Backend Domains

The following areas are non-critical for v1 and must not consume release capacity unless they block a release-critical flow:

- HR
- Project
- Issue tracking
- Support
- Advanced manufacturing
- Ecommerce
- Offline sync support paths
- Non-critical integrations

## Release-Critical Frontend Areas

The frontend work before launch is limited to:

- Auth entry and session restore
- Tenant onboarding and tenant settings
- Dashboard
- Customers
- Products
- Orders
- Inventory
- Invoices
- Basic reports

## Frontend Navigation Rule

Any route, menu entry, shortcut, dashboard tile, or visible navigation into a cut module must be removed, hidden, or feature-flagged before release.

A build that still exposes non-v1 paths is not release-ready.

## Data Rules

- Tenant isolation is mandatory.
- Entity, DTO, controller, service, and frontend contracts must remain consistent.
- Schema drift must be controlled through explicit migrations or explicit schema decisions, not accidental runtime mismatch.
- Demo and seed data must support the must-win scenarios from the product goal.

## API Rules

- APIs must support the focused v1 flows first.
- Response shapes used by the frontend must be stable across release-critical modules.
- Validation and authorization failures must be explicit and predictable.
- Release-critical APIs should not depend on unfinished cross-domain integrations.

## UI Rules

- The UI must privilege task completion over breadth.
- Cut modules must not appear as broken promises in the shell.
- Dashboard and reports remain intentionally basic if they are stable and truthful.
- No visual refactor is allowed if it puts release-critical behavior at risk.

## Test Strategy

We do not require the full repository test suite to be green before launch.

We do require the following:

- Backend type-check is green
- Backend build is green
- Frontend type-check is green
- Frontend build is green
- Targeted backend tests for release-critical modules are green
- Targeted frontend tests for release-critical modules are green
- Smoke E2E for login, customer, product, order, inventory, and invoice flows are green

## Deployment Rules

- The production deployment workflow must perform a real deploy.
- The production deployment workflow must perform a real health check.
- Placeholder deployment or placeholder health-check logic is not acceptable for release.
- A production-like local or staging runbook must exist before launch.

## Technical Constraints

- No new service split before launch
- No new domain expansion before launch
- No broad refactor across cut modules
- No dependency change that creates avoidable release risk without solving a direct blocker

## Agent Execution Rules

- Every implementation task must reference the product goal.
- Every implementation task must respect the release-critical boundaries in this spec.
- Agents must refuse scope growth that does not improve launch probability.
- Agents should prefer the smallest coherent change that materially improves launch readiness.
- Agents must not re-expose cut modules through routing, UI, seed data, or tests.

## Immediate Technical Priorities

1. Remove or hide cut-module navigation and routes.
2. Fix the current frontend failing tests that touch release quality.
3. Define and stabilize the minimum backend test subset for release-critical modules.
4. Make demo and seed data reliable for the must-win scenarios.
5. Replace placeholder production deployment and health-check steps with real execution.
6. Run smoke verification against the focused v1 flow only.

## Exit Criteria

SmartERP v1 is technically ready to launch only when all of the following are true:

- Release-critical flows work in staging or an equivalent production-like target
- Production deployment is real and repeatable
- Health-check validation is real and repeatable
- Smoke verification is green for the focused v1 flow
- The demo path never depends on cut modules
