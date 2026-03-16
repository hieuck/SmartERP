---
name: smarterp-conventions
description: Development conventions and patterns for SmartERP. TypeScript project with conventional commits.
---

# Smarterp Conventions

> Generated from [hieuck/SmartERP](https://github.com/hieuck/SmartERP) on 2026-03-16

## Overview

This skill teaches Claude the development patterns and conventions used in SmartERP.

## Tech Stack

- **Primary Language**: TypeScript
- **Architecture**: feature-based module organization
- **Test Location**: colocated
- **Test Framework**: vitest

## When to Use This Skill

Activate this skill when:
- Making changes to this repository
- Adding new features following established patterns
- Writing tests that match project conventions
- Creating commits with proper message format

## Commit Conventions

Follow these commit message conventions based on 8 analyzed commits.

### Commit Style: Conventional Commits

### Prefixes Used

- `test`
- `feat`
- `docs`
- `refactor`
- `fix`
- `chore`

### Message Guidelines

- Average message length: ~64 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
chore(deps): bump the npm_and_yarn group across 2 directories with 5 updates
```

*Commit message example*

```text
fix(deps): upgrade @typescript-eslint packages to fix 6 high severity vulnerabilities
```

*Commit message example*

```text
feat(frontend): Phase 17 - Landing Page i18n
```

*Commit message example*

```text
refactor(frontend): complete Phase 9 - Payments i18n (PaymentForm & PaymentDetail)
```

*Commit message example*

```text
docs: xóa các báo cáo out date và duplicate
```

*Commit message example*

```text
feat(frontend): Phase 16 - Offline Demo modules i18n
```

*Commit message example*

```text
feat(auth): complete i18n for RegisterPage - Phase 15B
```

*Commit message example*

```text
feat(frontend): refactor Tenancy module with i18n - Phase 15A
```

## Architecture

### Project Structure: Turborepo

This project uses **feature-based** module organization.

### Source Layout

```
src/
├── backend/
├── frontend/
├── mobile/
├── shared/
```

### Configuration Files

- `.eslintrc.js`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-production.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/reusable-build.yml`
- `.github/workflows/reusable-lint.yml`
- `.github/workflows/reusable-test.yml`
- `.prettierrc`
- `docker-compose.yml`
- `package.json`
- `playwright.config.ts`
- `src/backend/Dockerfile`
- `src/backend/jest.config.js`
- `src/backend/package.json`
- `src/backend/tsconfig.json`
- `src/frontend/Dockerfile`
- `src/frontend/package.json`
- `src/frontend/tsconfig.json`
- `src/frontend/vite.config.ts`
- `src/frontend/vitest.config.ts`
- `src/mobile/jest.config.js`
- `src/mobile/package.json`
- `src/mobile/tsconfig.json`
- `src/shared/src/package.json`
- `src/shared/src/tsconfig.json`

### Guidelines

- Group related code by feature/domain
- Each feature folder should be self-contained
- Shared utilities go in a common/shared folder

## Code Style

### Language: TypeScript

### Naming Conventions

| Element | Convention |
|---------|------------|
| Files | camelCase |
| Functions | camelCase |
| Classes | PascalCase |
| Constants | SCREAMING_SNAKE_CASE |

### Import Style: Relative Imports

### Export Style: Named Exports


*Preferred import style*

```typescript
// Use relative imports
import { Button } from '../components/Button'
import { useAuth } from './hooks/useAuth'
```

*Preferred export style*

```typescript
// Use named exports
export function calculateTotal() { ... }
export const TAX_RATE = 0.1
export interface Order { ... }
```

## Testing

### Test Framework: vitest

### File Pattern: `*.spec.ts`

### Test Types

- **Unit tests**: Test individual functions and components in isolation
- **Integration tests**: Test interactions between multiple components/services
- **E2e tests**: Test complete user flows through the application

### Mocking: jest.mock


*Test file structure*

```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should return expected result', () => {
    const result = myFunction(input)
    expect(result).toBe(expected)
  })
})
```

## Error Handling

### Error Handling Style: Try-Catch Blocks


*Standard error handling pattern*

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly message')
}
```

## Common Workflows

These workflows were detected from analyzing commit patterns.

### Feature Development

Standard feature implementation workflow

**Frequency**: ~23 times per month

**Steps**:
1. Add feature implementation
2. Add tests for feature
3. Update documentation

**Files typically involved**:
- `src/frontend/src/test/*`
- `tests/e2e/offline/*`
- `tests/e2e/products/*`
- `**/*.test.*`
- `**/api/**`

**Example commit sequence**:
```
test(frontend): add testing infrastructure and autonomous testing report
feat: Complete E2E tests and project summary
docs: xóa các báo cáo out date và duplicate
```

### Refactoring

Code refactoring and cleanup workflow

**Frequency**: ~17 times per month

**Steps**:
1. Ensure tests pass before refactor
2. Refactor code structure
3. Verify tests still pass

**Files typically involved**:
- `src/**/*`

**Example commit sequence**:
```
fix(backend): resolve lint errors and cleanup error logs
fix(docker): add tsconfig-paths to production dependencies
fix(tests): fix variable naming and duplicate declarations in test files
```

### Frontend Module I18n Refactor

Adds internationalization (i18n) support to a frontend module by creating translation files (en/vi) and refactoring React component(s) to use translation keys instead of hardcoded text.

**Frequency**: ~10 times per month

**Steps**:
1. Create or update translation files for the module in src/frontend/src/i18n/locales/en/{module}.json and src/frontend/src/i18n/locales/vi/{module}.json
2. Add or update translation keys as needed for all UI text in the module
3. Refactor the relevant React component(s) (e.g., pages/{module}/*.tsx) to replace hardcoded text with translation keys using the useTranslation hook
4. Ensure all UI labels, messages, buttons, and statuses use i18n
5. Test that both English and Vietnamese are fully supported and there are 0 TypeScript errors

**Files typically involved**:
- `src/frontend/src/i18n/locales/en/*.json`
- `src/frontend/src/i18n/locales/vi/*.json`
- `src/frontend/src/pages/*/*.tsx`

**Example commit sequence**:
```
Create or update translation files for the module in src/frontend/src/i18n/locales/en/{module}.json and src/frontend/src/i18n/locales/vi/{module}.json
Add or update translation keys as needed for all UI text in the module
Refactor the relevant React component(s) (e.g., pages/{module}/*.tsx) to replace hardcoded text with translation keys using the useTranslation hook
Ensure all UI labels, messages, buttons, and statuses use i18n
Test that both English and Vietnamese are fully supported and there are 0 TypeScript errors
```

### Standardize List Page With Component Pattern

Refactors list pages to use a centralized StandardListPage component pattern for consistent UI/UX, mobile card view, and reduced code duplication.

**Frequency**: ~3 times per month

**Steps**:
1. Create or update StandardListPage and its subcomponents (ListPageHeader, ListPageFilters, ListItemActions, DesktopTableView, MobileListView) in src/frontend/src/components/common/
2. Refactor the target list page (e.g., ProductList.tsx, CustomerList.tsx, SupplierList.tsx, InvoiceList.tsx, SalesOrderList.tsx, PaymentList.tsx) to use StandardListPage and subcomponents
3. Remove custom table/card logic and inline responsive code from the page
4. Ensure mobile and desktop views are handled by the new pattern
5. Test for consistent UI/UX and offline-first features

**Files typically involved**:
- `src/frontend/src/components/common/StandardListPage.tsx`
- `src/frontend/src/components/common/ListPageHeader.tsx`
- `src/frontend/src/components/common/ListPageFilters.tsx`
- `src/frontend/src/components/common/ListItemActions.tsx`
- `src/frontend/src/components/common/DesktopTableView.tsx`
- `src/frontend/src/components/common/MobileListView.tsx`
- `src/frontend/src/pages/*/*List.tsx`

**Example commit sequence**:
```
Create or update StandardListPage and its subcomponents (ListPageHeader, ListPageFilters, ListItemActions, DesktopTableView, MobileListView) in src/frontend/src/components/common/
Refactor the target list page (e.g., ProductList.tsx, CustomerList.tsx, SupplierList.tsx, InvoiceList.tsx, SalesOrderList.tsx, PaymentList.tsx) to use StandardListPage and subcomponents
Remove custom table/card logic and inline responsive code from the page
Ensure mobile and desktop views are handled by the new pattern
Test for consistent UI/UX and offline-first features
```

### Add Or Update Database Migration

Creates or updates database migration scripts and ensures migrations are run programmatically, updating the schema and related scripts.

**Frequency**: ~2 times per month

**Steps**:
1. Create a new migration script in src/backend/src/migrations/
2. Update or add scripts/run-migrations.ts to run migrations programmatically
3. Add or update npm scripts (e.g., db:migrate) in package.json
4. Run the migration and verify schema changes
5. Test health checks and core flows to ensure migration success

**Files typically involved**:
- `src/backend/src/migrations/*.ts`
- `src/backend/scripts/run-migrations.ts`
- `src/backend/package.json`

**Example commit sequence**:
```
Create a new migration script in src/backend/src/migrations/
Update or add scripts/run-migrations.ts to run migrations programmatically
Add or update npm scripts (e.g., db:migrate) in package.json
Run the migration and verify schema changes
Test health checks and core flows to ensure migration success
```

### Dependency Upgrade Across Multiple Packages

Upgrades one or more dependencies in multiple package.json/package-lock.json files, often across different directories (frontend, mobile, backend).

**Frequency**: ~2 times per month

**Steps**:
1. Update package.json and package-lock.json in affected directories (src/frontend/, src/mobile/, root, etc.)
2. Bump dependency versions as needed
3. Run install and verify build/tests
4. Document changes in commit message

**Files typically involved**:
- `package.json`
- `package-lock.json`
- `src/frontend/package.json`
- `src/frontend/package-lock.json`
- `src/mobile/package.json`
- `src/mobile/package-lock.json`

**Example commit sequence**:
```
Update package.json and package-lock.json in affected directories (src/frontend/, src/mobile/, root, etc.)
Bump dependency versions as needed
Run install and verify build/tests
Document changes in commit message
```


## Best Practices

Based on analysis of the codebase, follow these practices:

### Do

- Use conventional commit format (feat:, fix:, etc.)
- Keep feature code co-located in feature folders
- Write tests using vitest
- Follow *.spec.ts naming pattern
- Use camelCase for file names
- Prefer named exports

### Don't

- Don't write vague commit messages
- Don't skip tests for new features
- Don't deviate from established patterns without discussion

---

*This skill was auto-generated by [ECC Tools](https://ecc.tools). Review and customize as needed for your team.*
