# Tech Stack

## Backend (`src/backend`)

- NestJS 10 + TypeScript 5
- PostgreSQL 15 + TypeORM 0.3 (`synchronize: false` — migrations only)
- Redis 7 + ioredis (caching)
- JWT + Passport (auth — 15m access tokens, 7d refresh via httpOnly cookie)
- Swagger/OpenAPI (auto-generated at `/api/docs`)
- Winston + winston-daily-rotate-file (logging)
- prom-client (Prometheus metrics)
- Sentry (error tracking)
- MinIO (file storage)
- Helmet, CORS, throttler (security)
- class-validator + class-transformer (DTO validation)
- Multer (file uploads), Sharp (image processing)

## Frontend (`src/frontend`)

- React 18 + TypeScript 5 + Vite 5
- Ant Design 6 (UI components)
- Redux Toolkit (global state)
- TanStack Query v5 (server state)
- Dexie.js v4 + IndexedDB (offline storage)
- Workbox 7 (service worker, background sync)
- react-router-dom v6 (routing)
- react-hook-form + Zod (forms + validation)
- i18next + react-i18next (EN + VI translations)
- Recharts (charts)
- Axios (HTTP client)

## Mobile (`src/mobile`)

- React Native + Expo
- Redux Toolkit, React Navigation
- expo-sqlite (local storage)
- Jest (testing)

## Shared (`src/shared`)

- Common TypeScript types, enums, interfaces, constants

## Build System

- Turborepo (`turbo.json`) orchestrates builds across packages
- Each package manages its own `node_modules` and scripts

## Commands

### Backend (`cd src/backend`)

```bash
npm run start:dev          # dev server with watch
npm run build              # production build (nest build)
npm run test               # Jest single run
npm run test:cov           # Jest with coverage
npm run lint               # ESLint --fix
npm run type-check         # tsc --noEmit
npm run migration:run      # run pending TypeORM migrations
npm run migration:generate # generate new migration from entity changes
npm run migration:revert   # revert last migration
npm run db:drop-create     # drop and recreate database
npm run seed               # seed demo data
```

### Frontend (`cd src/frontend`)

```bash
npm run dev                # Vite dev server (port 5173)
npm run build              # production build
npm run test               # Vitest single run
npm run test:coverage      # Vitest with coverage
npm run lint               # ESLint
npm run type-check         # tsc --noEmit
npm run storybook          # Storybook dev (port 6006)
```

### Root / Docker

```bash
docker-compose up -d       # start all services (recommended)
docker-compose -f docker-compose.dev.yml up -d
```

## Key Config Files

- `src/backend/src/config/database.config.ts` — TypeORM datasource
- `src/backend/src/config/cache.config.ts` — Redis cache
- `src/frontend/vite.config.ts` — Vite config
- `src/frontend/vitest.config.ts` — Vitest config
- `.env` (root) — backend env vars (`DB_*`, `REDIS_*`, `JWT_SECRET`, `PORT`)
- `src/frontend/.env` — frontend env vars
