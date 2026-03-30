# SmartERP Focused v1 Launch Plan

Date: 2026-03-30
Owner: Codex
Status: Superseded

Superseded on 2026-03-30 by `docs/SMARTERP_NEXT_FOUNDATION.md` after the rewrite decision.

## Control Documents

All release work must follow these normative documents:

- `docs/PRODUCT_GOAL.md`
- `docs/TECHNICAL_SPEC_V1.md`

## Hard Decision

We will not try to launch the full ERP surface.

We will launch a focused v1 on Friday, April 17, 2026.

This is the only release shape that is realistic given the current repo state and the market pressure.

## Release Goal

Ship a stable, demoable, usable SME core operations product:

- Auth and tenant onboarding
- Dashboard
- Customers
- Products
- Orders
- Inventory
- Invoices
- Basic reports

Everything else is secondary unless it directly blocks those flows.

## Audit Snapshot

As of 2026-03-30:

- Backend type-check: passing
- Backend build: passing
- Frontend type-check: passing
- Frontend build: passing
- Backend full test suite: failing
- Frontend full test suite: failing
- Production deploy workflow: not production-ready yet

Key evidence from rapid audit:

- Backend had tenant/onboarding compile drift and is now building again.
- Backend full test suite still reports broad contract drift across multiple non-core areas.
- Frontend full suite still has failures in offline sync and ecommerce test setup.
- Production deployment workflow still contains placeholder deploy and health-check steps.

## Ship Scope

### Must Ship

- Login and authenticated app shell
- Tenant creation and tenant settings
- Customer CRUD
- Product CRUD
- Order CRUD
- Inventory list and stock flows needed by orders
- Invoice list and create/edit basics
- Dashboard with core KPI cards only
- Basic report pages that work with seeded/demo data
- Docker-based local production-like runbook
- Production deployment workflow with real deploy and health check

### Cut From v1

- HR
- Project
- Issue tracking
- Support
- Advanced manufacturing flows
- Ecommerce module
- Offline sync
- Public showcase pages beyond login and core app
- Non-critical integrations
- Nice-to-have analytics and AI-assisted surfaces

If a module is in this cut list, we do not spend release time on it unless it blocks a must-ship flow.

## Milestones

### Phase 1: Scope Lock

Deadline: Tuesday, March 31, 2026

- Freeze release scope
- Hide or feature-flag non-v1 routes
- Define the exact happy-path demo for launch

### Phase 2: Core Stabilization

Deadline: Sunday, April 5, 2026

- Fix release-blocking backend and frontend regressions in must-ship modules
- Make seeded/demo data reliable
- Remove or disable broken menu entries into cut modules

### Phase 3: Quality Gate Recovery

Deadline: Friday, April 10, 2026

- Green targeted tests for must-ship flows
- Green smoke E2E for login, customer, product, order, inventory, invoice
- Verify Docker compose production-like startup

### Phase 4: Release Candidate

Deadline: Tuesday, April 14, 2026

- Deploy RC to staging
- Run manual acceptance script
- Fix only P0 and P1 defects

### Phase 5: Launch

Deadline: Friday, April 17, 2026

- Production deploy
- Health check
- Smoke verification
- Release notes

## First 72 Hours

### Day 1: 2026-03-30 to 2026-03-31

- Lock scope
- Disable cut modules in navigation and routing
- Fix the current frontend failing tests that sit in or touch release-critical flows
- Identify the minimum backend test subset for must-ship modules

### Day 2: 2026-04-01

- Make auth, tenant, customers, products, orders stable end-to-end
- Run seeded demo and fix obvious demo blockers

### Day 3: 2026-04-02

- Stabilize inventory, invoices, dashboard
- Wire production deploy workflow with real target environment and real health checks

## Go / No-Go Gates

We launch only if all of the following are true:

- Backend build is green
- Frontend build is green
- Must-ship smoke E2E is green
- Demo seed works from clean environment
- Production deploy and health-check workflow is real, not placeholder
- No open P0 defects in auth, customer, product, order, inventory, invoice flows

We do not block launch on:

- Full backend suite being fully green across cut modules
- HR, project, issue tracking, support, ecommerce, or offline sync
- Nice-to-have dashboards or advanced reports

## Release Principle

Survival comes from shipping a narrow product that works, not from preserving the illusion that the whole repository is launchable.

The April 17, 2026 date is achievable only if scope remains frozen and every task is judged against this document.


