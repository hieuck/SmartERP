# SmartERP

SmartERP is now being rebuilt on a new foundation.

## Active Target

All new work targets:

- `apps/api`
- `apps/web`
- `packages/contracts`
- `packages/ui`

The controlling rewrite document is [docs/SMARTERP_NEXT_FOUNDATION.md](/E:/GitHub/smart-erp/docs/SMARTERP_NEXT_FOUNDATION.md).

## Legacy Code

The existing implementation under `src/` is legacy reference code:

- `src/backend`
- `src/frontend`
- `src/mobile`
- `src/shared`

Legacy code may be mined for behavior and migration data, but it is no longer the default target for new features.

## Workspace Commands

- `npm run dev:api`
- `npm run dev:web`
- `npm run build:next`
- `npm run type-check:next`
- `npm run lint:next`

## Rewrite Rule

Do not grow the legacy tree.

Build the new system in `apps/` and `packages/`, then migrate capability by capability.
