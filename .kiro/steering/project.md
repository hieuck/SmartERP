# Project Steering - SmartERP

## Overview

SmartERP is a monolithic ERP system with offline-first architecture for uninterrupted business operations.
Built with NestJS (backend) and React (frontend) in a Turborepo monorepo.

**Status:** ~75% complete — core modules done, expanding offline coverage and features.

## Tech Stack

### Backend (`src/backend`)

- NestJS 10 + TypeScript
- PostgreSQL 15 + TypeORM 0.3 (migrations only, `synchronize: false`)
- Redis 7 + ioredis (caching)
- JWT + Passport (auth)
- Swagger/OpenAPI (auto-generated docs at `/api/docs`)
- Sentry (error tracking), Winston (logging), Prometheus (metrics)
- MinIO (file storage)

### Frontend (`src/frontend`)

- React 18 + TypeScript + Vite
- Ant Design 6 (UI components)
- Redux Toolkit (global state)
- TanStack Query v5 (server state)
- Dexie.js + IndexedDB (offline storage)
- Workbox (service worker / background sync)
- i18next (EN + VI translations)
- Recharts (charts)
- Vitest + Playwright (testing)

### Shared (`src/shared`)

- Common types, enums, interfaces, constants

### Infrastructure

- Docker Compose (dev/prod)
- Kubernetes configs (`config/kubernetes/`)
- GitHub Actions CI/CD (`.github/workflows/`)
- Prometheus + Grafana monitoring

## Architecture

**Monolithic backend** — NOT microservices. All domains in one NestJS app.

Domain structure: `src/backend/src/domains/{accounting,ecommerce,hr,inventory,manufacturing,project,purchasing,sales}`

Platform services: `src/backend/src/platform/{audit,dashboard,document,email,notification,report,search,support,system-admin,workflow}`

**Offline-first frontend** — IndexedDB as primary store, sync to backend when online.
Sync manager: `src/frontend/src/lib/offline/sync-manager.ts`
Offline services: `src/frontend/src/services/offline-services.ts`

## Coding Standards

- Meaningful variable and function names
- Small, focused functions (single responsibility)
- Self-documenting code; comments only for non-obvious logic
- Prefer explicit over implicit
- No `any` types unless absolutely necessary
- Always use `SecureRepository` pattern for tenant-scoped queries (not raw TypeORM repo)
- All DB queries must filter by `tenantId` — use `user: User` context, not raw `tenantId: string`

## File Structure

- kebab-case for files, PascalCase for React components
- Co-locate related files (entity + service + controller + module in same folder)
- i18n translations: `src/frontend/src/i18n/locales/{en,vi}/{namespace}.json`
- One namespace per domain/feature (e.g., `products`, `orders`, `hr`, `purchaseOrders`)

## i18n Conventions

- All user-facing strings must use `useTranslation` — no hardcoded text
- Namespace must be registered in `src/frontend/src/i18n/config.ts`
- Use camelCase namespace names (e.g., `purchaseOrders`, not `purchase-orders`)
- Both EN and VI translations required for every key

## Testing

- Backend: Jest (`src/backend`)
- Frontend: Vitest (`src/frontend`)
- E2E: Playwright (`tests/`)
- Run single pass: `vitest run` (not watch mode)
- Focus on business logic and edge cases, not 100% coverage

## Git Conventions

- Commit messages: `type(scope): short description`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`
- Examples:
  - `feat(hr): add attendance list page`
  - `fix(i18n): register missing namespaces`
  - `chore(env): remove outdated microservices port vars`

## Environment Variables

- Backend reads from `.env` (root level)
- Key vars: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`, `PORT`
- Never commit real secrets — use `.env.example` as template
- Microservices port vars are removed — this is a monolith, use `PORT` only

## Security

- Never hardcode secrets or credentials
- All tenant-scoped queries use `SecureRepository`
- Input validation via `class-validator` DTOs
- JWT access tokens (15m) + refresh tokens (7d httpOnly cookie)
