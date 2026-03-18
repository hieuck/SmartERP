# Project Structure

## Monorepo Layout

```
src/
  backend/   # NestJS monolithic API
  frontend/  # React SPA
  mobile/    # React Native / Expo app
  shared/    # Shared TS types, enums, interfaces, constants
config/      # Docker, Kubernetes, Nginx, monitoring configs
database/    # TypeORM migrations (also at src/backend/src/migrations/)
tests/       # Playwright E2E tests
scripts/     # Dev/ops utility scripts
```

## Backend Structure (`src/backend/src/`)

```
app.module.ts
main.ts
core/
  auth/          # JWT + Passport auth, guards, strategies
  user/          # User entity + service
  tenant/        # Multi-tenancy
  permission/    # RBAC
  settings/
domains/         # Business domain modules (co-located entity+service+controller+module)
  accounting/
  ecommerce/
  hr/
  inventory/
  manufacturing/
  project/
  purchasing/
  sales/
platform/        # Cross-cutting platform services
  audit/
  dashboard/
  document/
  email/
  notification/
  report/
  search/
  support/
  system-admin/
  workflow/
common/          # Shared backend utilities
  database/      # SecureRepository base, DB helpers
  decorators/
  dto/
  entities/      # Base entities
  filters/       # Exception filters
  guards/
  interceptors/
  pagination/
  security/
config/          # database.config.ts, cache.config.ts, sentry.config.ts
migrations/      # TypeORM migration files
utilities/       # Health, import/export, scheduled jobs, seed
```

## Frontend Structure (`src/frontend/src/`)

```
App.tsx
main.tsx
pages/           # Route-level page components (one folder per domain)
components/      # Reusable UI components (co-located with tests)
services/        # API service layer (one folder per domain)
store/
  slices/        # Redux Toolkit slices
hooks/           # Custom React hooks
lib/
  offline/       # Dexie DB schema, sync-manager.ts
  monitoring/
  logger/
contexts/        # React contexts (ThemeContext, etc.)
i18n/
  config.ts      # Namespace registration — add new namespaces here
  locales/
    en/          # English translation JSON files
    vi/          # Vietnamese translation JSON files
routes/          # react-router-dom route definitions
theme/           # Ant Design theme tokens
utils/           # Pure utility functions
constants/       # App-wide constants
```

## Naming Conventions

- Files: `kebab-case` (e.g., `purchase-order.service.ts`)
- React components: `PascalCase` (e.g., `PurchaseOrderList.tsx`)
- i18n namespaces: `camelCase` (e.g., `purchaseOrders`)
- Co-locate related files: entity + service + controller + module in the same folder

## Key Patterns

- **SecureRepository**: always use instead of raw TypeORM repo for tenant-scoped queries
- **DB queries**: filter by `tenantId` via `user: User` context — never pass raw `tenantId: string`
- **DTOs**: use `class-validator` decorators for all input validation
- **Offline**: write to Dexie (IndexedDB) first; sync manager handles backend sync
- **i18n**: all user-facing strings via `useTranslation`; register namespace in `i18n/config.ts`; both EN + VI required

## Templates

`templates/` contains starter templates for new backend modules:

- `controller.template.ts`
- `service.template.ts`
- `module.template.ts`
