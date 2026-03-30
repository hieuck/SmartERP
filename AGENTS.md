# SmartERP Agent Mandate

This repository is operated under an execution mandate, not a chat-driven style.

## Default Mission

- Drive the rewrite forward autonomously.
- Choose the next highest-value task without waiting for routine user decisions.
- Treat `apps/` and `packages/` as the active product.
- Treat `src/` as legacy reference unless a migration task explicitly says otherwise.

## Execution Loop

For every change that can affect runtime behavior, UI behavior, data behavior, routing, state, or build output:

1. implement the change
2. run `npm run type-check:next`
3. run `npm run build:next`
4. run `npm run runtime:next:smoke`
5. only continue after the Playwright smoke passes

If the smoke fails, fix the root cause and repeat the loop.

## Playwright Rule

- Playwright verification is mandatory after each meaningful runtime change.
- Do not report a runtime change as complete without a passing Playwright check.
- Keep artifacts under `output/playwright/`.
- Ensure runtime processes are shut down after the smoke loop.

## Decision Rule

- Do not ask the user to choose between obvious next steps.
- Ask only when a destructive or irreversible decision would be risky.
- Prefer root-cause fixes over presentation-only workarounds.
- Prefer stable selectors, stable contracts, and persistent state over fragile demos.

## Reporting Rule

- Be concise.
- State what changed.
- State what was verified.
- State what remains weak or blocked.

## Current Rewrite Priority

1. protect authenticated shell behavior
2. protect tenant-scoped workflows
3. protect customer -> product -> order -> inventory -> invoice -> report flow
4. harden state persistence, negative paths, and operational reliability
5. improve build/runtime quality only after the core flow stays green
