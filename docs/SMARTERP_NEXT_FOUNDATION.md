# SmartERP Next Foundation

Date: 2026-03-30
Owner: Codex
Status: Active

## Rewrite Decision

SmartERP is no longer pursuing the focused-v1 launch plan as the primary track.

As of 2026-03-30, the project has entered a controlled rewrite.

The existing code under `src/` is now legacy reference code. It may be read, mined, and migrated from, but it is no longer the default foundation for new development.

## Objective

Build a stronger product and a stronger codebase than the current repository shape can support.

The rewrite target is not a cosmetic clone of large ERP repositories. The target is a disciplined business platform with:

- a coherent product thesis
- a clean monorepo structure
- enforced domain boundaries
- reusable contracts and UI primitives
- a predictable migration path from legacy modules

## Product Thesis

SmartERP Next is a business operating system for Vietnamese SMEs.

The first complete product shape will cover:

- identity and tenant administration
- CRM and customer operations
- product catalog
- sales and order management
- inventory and stock movement
- billing and invoicing
- reporting and admin controls

Modules such as HR, support, issue tracking, ecommerce, and advanced manufacturing remain later-phase concerns until the operational core is credible.

## Technical Thesis

SmartERP Next will be built as a monorepo with shared packages and explicit app boundaries.

Initial target topology:

- `apps/api`: backend application
- `apps/web`: frontend application
- `packages/contracts`: shared types and API contracts
- `packages/ui`: shared UI tokens and primitives

Legacy topology:

- `src/backend`
- `src/frontend`
- `src/mobile`
- `src/shared`

Legacy code stays available for migration reference only.

## Architecture Direction

The rewrite is opinionated:

- backend-first domain boundaries
- shared contracts before integration
- app shell and design system before page sprawl
- migrations, not copy-paste porting
- stable workspace tooling at the root

The new repo does not inherit the old module graph automatically. Each migrated capability must be re-accepted into the new structure.

## System Decisions

### Backend

- TypeScript service under `apps/api`
- modular architecture by business capability
- clear separation between transport, application logic, and domain logic
- health endpoint and bootstrap path from day one

### Frontend

- React application under `apps/web`
- shared visual primitives from `packages/ui`
- feature work organized by product area, not by random page accumulation

### Shared Layer

- contracts and shared value objects live in `packages/contracts`
- app-specific code does not leak into shared packages

## Domain Map

The rewrite domain order is fixed:

1. identity
2. tenant
3. customers
4. products
5. orders
6. inventory
7. invoices
8. reporting

No later domain starts before the earlier domain has an accepted vertical slice.

## Migration Rules

- Do not copy legacy folders wholesale into the new foundation.
- Migrate behavior, not structure.
- Reuse only code that survives review against the new contracts and new boundaries.
- If a legacy feature conflicts with the new domain model, the legacy feature loses.
- The new apps must remain cleaner than the old codebase at every step.

## Execution Phases

### Phase 1: Foundation

- establish monorepo workspaces
- scaffold the new apps and shared packages
- make the new workspace installable and buildable
- mark old launch-first documents as superseded

### Phase 2: Core Vertical Slices

- identity
- tenant
- customers
- products

Each slice must include contracts, backend path, frontend path, and basic test coverage.

### Phase 3: Operations Core

- orders
- inventory
- invoices

### Phase 4: Control Layer

- dashboard
- reporting
- admin controls

## Definition of Done

A module is not done when a page exists.

A module is done only when all of the following are true:

- contract exists in shared packages
- backend path exists and is tested
- frontend flow exists and is usable
- the UI uses shared primitives
- the module does not depend on legacy-only wiring

## Command Rule

From this point forward, new implementation work targets `apps/` and `packages/`.

The legacy `src/` tree is reference material unless a migration task explicitly says otherwise.
