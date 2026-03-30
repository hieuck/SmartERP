# SmartERP Product Goal

Date: 2026-03-30
Owner: Codex
Status: Superseded

Superseded on 2026-03-30 by `docs/SMARTERP_NEXT_FOUNDATION.md` after the rewrite decision.

## Purpose

This document defines the product goal that controls all SmartERP work until launch.

If a task conflicts with this document, the task is wrong unless this document is explicitly revised.

## Product Mission

SmartERP is a focused operations product for Vietnamese SMEs that need one practical system to manage customers, products, orders, inventory, invoices, and basic business visibility without the weight of a full enterprise suite.

## Launch Objective

Launch a focused v1 on Friday, April 17, 2026.

The goal is not to present a broad ERP catalog. The goal is to ship a narrow product that works end-to-end for a small business operator.

## Who We Serve

Primary users in v1:

- Business owner or tenant admin
- Sales operator
- Warehouse operator
- Accounting or back-office operator

We are not optimizing v1 for large-enterprise customization, deep manufacturing control, or broad HR workflows.

## Core User Promise

A new tenant must be able to do the following in under one hour with seeded guidance or basic onboarding:

- Sign in and access the app
- Create or configure the tenant
- Add customers
- Add products
- Create orders
- Review and update stock-relevant inventory data
- Create invoices
- View a simple dashboard and basic reports

If these flows are not reliable, the product has failed even if other modules exist.

## Must-Win Scenarios

### Tenant Setup

The tenant admin can create and configure a tenant and reach a usable application shell without manual developer intervention.

### Sales Flow

The sales operator can create, view, edit, and track customers and orders without broken navigation or hidden dependency on cut modules.

### Stock Flow

The warehouse or operations user can view products and inventory state needed to support order execution.

### Billing Flow

The accounting or back-office user can create and manage invoices required for the order flow.

### Management Flow

The owner can open the dashboard and basic reports and understand the current operational picture.

## What v1 Is Not

v1 is not a complete ERP platform.

v1 is not a multi-product suite.

v1 is not a showcase of every domain already present in the repository.

v1 is a controlled release of the smallest valuable operational core.

## Explicitly Cut From v1

The following areas are out of scope unless they directly block a must-win scenario:

- HR
- Project
- Issue tracking
- Support
- Advanced manufacturing flows
- Ecommerce
- Offline sync
- Public showcase pages beyond login and core app
- Non-critical integrations
- Nice-to-have analytics and AI-assisted surfaces

## Product Shape

SmartERP v1 is a focused operational control center:

- One tenant
- One authenticated app
- One coherent daily workflow from customer to order to stock to invoice
- One simple management view for core metrics

Breadth is intentionally sacrificed to protect reliability.

## Success Metrics

The launch is considered successful if the following are true:

- A clean environment can run the product with seeded or demo-ready data
- The must-win scenarios complete without manual patching
- The product can be demoed end-to-end without entering cut modules
- Core navigation is coherent and free from dead ends
- The release can be deployed and health-checked in a real environment

## Failure Conditions

The release is considered a failure if any of the following are true:

- Users are exposed to broken or unfinished cut modules
- Core flows depend on hidden admin fixes or direct database intervention
- Orders, inventory, or invoices cannot be demonstrated reliably
- The app builds but cannot be deployed and verified in a production-like path
- Work continues to expand horizontally instead of stabilizing the launch surface

## Product Discipline Rules

- Every task must map to at least one must-win scenario.
- No new domain is added before launch.
- No non-v1 UI is visible by default.
- No engineering effort is spent on aesthetic breadth while core flows are unstable.
- Narrower and more reliable execution beats broader and less reliable presentation.

## Decision Rule

When there is doubt, choose the option that increases the probability of a reliable April 17, 2026 launch for the focused operational core.
