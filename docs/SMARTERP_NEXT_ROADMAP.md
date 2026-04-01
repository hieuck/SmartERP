# SmartERP Next Roadmap

Date: 2026-03-31
Owner: Codex
Status: Active

## Current Checkpoint

SmartERP Next is currently at `CP3+`.

Meaning:

- the operational core is real and runs end-to-end
- the rewrite is no longer a scaffold or mock-only shell
- the product is still below pilot-ready depth

Current verified flow:

- auth
- tenant
- customers
- suppliers
- products
- purchase orders
- inventory adjustments
- orders
- invoices
- payments
- receivables reporting
- collection worklist
- ledger posting
- financial audit trail
- founder operations monitoring

Verification baseline:

- `npm run type-check:next`
- `npm run build:next`
- `npm run runtime:next:smoke`
- direct browser verification with Playwright

## Checkpoint Scale

- `CP1`: scaffold
- `CP2`: vertical slices exist
- `CP3`: operational core works
- `CP4`: pilot-ready product
- `CP5`: commercial-grade platform

## Strategic Position

### Against Viet-ERP

- SmartERP Next is cleaner, more disciplined, and more provable in the current rewrite slice
- SmartERP Next is still behind in breadth, platform optics, and surface area

### Against Odoo and ERPNext

- SmartERP Next is far behind in module depth, accounting maturity, ecosystem, and deployment readiness

### Against Nhanh.vn and KiotViet

- SmartERP Next is far behind in retail/POS, omnichannel commerce, logistics, and operator tooling

## Target Path

The next target is not `CP5`.

The next target is `CP4`: a pilot-ready operating product for one narrow commercial lane.

That means:

- reliable tenant-scoped daily operation
- clear receivables control
- usable commercial reporting
- business controls and traceability
- data import/export and operator setup path

## Phase Order

### Phase A: Finish the Cash Collection Control Loop

Goal:

- collection work is not only assigned, but also completed, tracked, and reviewed

Deliverables:

- collection worklist
- work item completion loop
- recent activity timeline
- customer statement visibility
- dashboard action queue

Checkpoint effect:

- raises the AR layer from passive records to active operations

### Phase B: Finance Backbone

Goal:

- stop treating invoices as isolated documents and start treating them as accounting events

Deliverables:

- chart of accounts
- journal entries
- double-entry posting for invoice and payment events
- AR balance traceability

Checkpoint effect:

- required to move from `CP3-` to `CP4`

### Phase C: Control Layer

Goal:

- make actions reviewable, attributable, and governable

Deliverables:

- RBAC beyond founder-only access
- audit log
- approval hooks for sensitive actions

Checkpoint effect:

- required before real operator pilots

Progress update:

- founder approval hooks for sensitive finance and stock mutations completed on 2026-03-31

### Phase D: Purchasing and Supply

Goal:

- close the loop between inventory demand and replenishment

Deliverables:

- suppliers
- purchase orders
- receiving flow
- stock valuation baseline

Checkpoint effect:

- required before broader commercial rollout

### Phase E: Operator Readiness

Goal:

- make the product installable and operable by a real customer

Deliverables:

- import/export
- seed/setup flows
- backup and restore path
- deployment and monitoring baseline

Progress update:

- import/export for pilot onboarding completed on 2026-03-31
- backup and restore baseline completed on 2026-03-31
- deployment and monitoring baseline completed on 2026-04-01 via the founder-only `Operations` module, runtime health checks, and operational artifact visibility

Checkpoint effect:

- turns a strong rewrite into a pilotable product

## Immediate Execution Queue

1. completed: seed/setup flows for first-time pilot operators
2. completed: tenant-scoped deployment packaging and handoff runbook
3. completed: tighter role-specific onboarding for non-founder users
4. next: polish pilot recovery drills on top of restore baseline

## Non-Goals Right Now

Do not open these tracks yet:

- HR
- support desk
- issue tracking
- ecommerce storefront
- advanced manufacturing
- POS
- marketplace connectors

Those tracks increase breadth before the core is defensible.

## Success Condition For CP4

SmartERP Next reaches `CP4` only when all of the following are true:

- one tenant can run daily order-to-cash operations without legacy fallback
- receivables are visible, actionable, and auditable
- accounting events are traceable into a ledger
- operator roles exist beyond founder-only access
- data onboarding and export are possible
- deployment and recovery path are documented and runnable

## Execution Rule

The roadmap is binding.

New work should advance the highest unfinished item in the immediate execution queue unless a blocker forces a lower-level dependency first.
