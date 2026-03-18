# SmartERP - Product Overview

SmartERP is a monolithic, offline-first Enterprise Resource Planning system for uninterrupted business operations. It supports multi-tenant environments and covers the full ERP lifecycle.

## Core Modules

- Accounting (GL, AP/AR)
- Inventory (stock, warehouses)
- Sales (customers, orders, invoices, payments)
- Purchasing (suppliers, POs, receiving)
- Manufacturing (BOMs, work orders)
- HR (employees, attendance, payroll, leave)
- Project Management (tasks, time tracking)
- E-commerce (catalog, cart, online orders)

## Offline-First Architecture

Data is written to IndexedDB first, then synced to the backend when online. The sync manager handles conflict resolution via a service worker. Current offline coverage: ~17% of entities.

## Status

~75% complete. Core modules done; expanding offline coverage and features.

## Access Points

- Frontend: http://localhost:5173 (dev)
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
