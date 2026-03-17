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

- Average message length: ~63 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
refactor(frontend): implement i18n, dark mode, and upgrade to Ant Design 6.0
```

*Commit message example*

```text
feat(frontend): add dark mode support with theme toggle
```

*Commit message example*

```text
fix(frontend): fix TypeScript errors in MobileListView component
```

*Commit message example*

```text
docs: xóa các báo cáo out date và duplicate
```

*Commit message example*

```text
test(frontend): add testing infrastructure and autonomous testing report
```

*Commit message example*

```text
refactor(frontend): use theme tokens in LanguageSwitcher component
```

*Commit message example*

```text
refactor(frontend): integrate ThemeToggle and use theme tokens in layout components
```

*Commit message example*

```text
refactor(frontend): integrate i18n, extract components, and add responsive theme
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

### Database Migration

Database schema changes with migration files

**Frequency**: ~4 times per month

**Steps**:
1. Create migration file
2. Update schema definitions
3. Generate/update types

**Files typically involved**:
- `migrations/*`
- `**/schema.*`

**Example commit sequence**:
```
chore: Clean up 90+ outdated MD files (testing reports, old analysis, patches, fixes, archive)
Complete Day 1: Install dependencies and verify builds
feat(monitoring): Add Sentry error tracking (Day 4-7)
```

### Feature Development

Standard feature implementation workflow

**Frequency**: ~18 times per month

**Steps**:
1. Add feature implementation
2. Add tests for feature
3. Update documentation

**Files typically involved**:
- `src/backend/src/config/*`
- `src/frontend/src/components/error/*`
- `src/frontend/src/lib/monitoring/*`
- `**/*.test.*`
- `**/api/**`

**Example commit sequence**:
```
docs: Add PRODUCTION_READY_ASSESSMENT.md - Complete evaluation for MVP launch
chore: Clean up 90+ outdated MD files (testing reports, old analysis, patches, fixes, archive)
Complete Day 1: Install dependencies and verify builds
```

### Test Driven Development

Test-first development workflow (TDD)

**Frequency**: ~3 times per month

**Steps**:
1. Write failing test
2. Implement code to pass test
3. Refactor if needed

**Files typically involved**:
- `**/*.test.*`
- `**/*.spec.*`
- `src/**/*`

**Example commit sequence**:
```
test: add tests for user validation
feat: implement user validation
```

### Refactoring

Code refactoring and cleanup workflow

**Frequency**: ~7 times per month

**Steps**:
1. Ensure tests pass before refactor
2. Refactor code structure
3. Verify tests still pass

**Files typically involved**:
- `src/**/*`

**Example commit sequence**:
```
feat(monitoring): Complete Day 4-7 monitoring integration
feat(ci-cd): Complete Day 8-10 CI/CD workflows (Day 8-10)
chore(security): Security audit and project cleanup
```

### Add Or Update Database Migration

Adds or updates database schema via migration scripts and ensures migrations are runnable via scripts and npm scripts.

**Frequency**: ~2 times per month

**Steps**:
1. Create or update migration script in src/backend/src/migrations/
2. Add or update migration runner script in src/backend/scripts/
3. Update src/backend/package.json to add or update migration npm scripts
4. Run migration and verify schema changes

**Files typically involved**:
- `src/backend/src/migrations/*.ts`
- `src/backend/scripts/run-migrations.ts`
- `src/backend/package.json`

**Example commit sequence**:
```
Create or update migration script in src/backend/src/migrations/
Add or update migration runner script in src/backend/scripts/
Update src/backend/package.json to add or update migration npm scripts
Run migration and verify schema changes
```

### Frontend List Page Standardization

Refactors or creates list pages to use a standardized component pattern (StandardListPage), improving code reuse, mobile UX, and design consistency.

**Frequency**: ~3 times per month

**Steps**:
1. Refactor or create StandardListPage and supporting subcomponents in src/frontend/src/components/common/
2. Update entity list page (e.g. ProductList.tsx, CustomerList.tsx) to use StandardListPage
3. Remove custom table/card logic from the entity list page
4. Ensure mobile card view and dropdown actions are supported
5. Apply design tokens for spacing and typography consistency

**Files typically involved**:
- `src/frontend/src/components/common/StandardListPage.tsx`
- `src/frontend/src/components/common/*.tsx`
- `src/frontend/src/pages/*/EntityList.tsx`

**Example commit sequence**:
```
Refactor or create StandardListPage and supporting subcomponents in src/frontend/src/components/common/
Update entity list page (e.g. ProductList.tsx, CustomerList.tsx) to use StandardListPage
Remove custom table/card logic from the entity list page
Ensure mobile card view and dropdown actions are supported
Apply design tokens for spacing and typography consistency
```

### Implement Or Enhance I18n

Adds or improves internationalization support for modules or components, including translation keys and replacing hardcoded text.

**Frequency**: ~2 times per month

**Steps**:
1. Add or update translation keys in src/frontend/src/i18n/locales/{lang}/*.json
2. Replace hardcoded strings in components/pages with i18n function (useTranslation, t)
3. Update forms, lists, and UI elements to use translation keys
4. Test both languages for completeness

**Files typically involved**:
- `src/frontend/src/i18n/locales/en/*.json`
- `src/frontend/src/i18n/locales/vi/*.json`
- `src/frontend/src/pages/**/*.tsx`
- `src/frontend/src/components/**/*.tsx`

**Example commit sequence**:
```
Add or update translation keys in src/frontend/src/i18n/locales/{lang}/*.json
Replace hardcoded strings in components/pages with i18n function (useTranslation, t)
Update forms, lists, and UI elements to use translation keys
Test both languages for completeness
```

### Theme System And Dark Mode Integration

Implements or refactors the theme system, including dark mode, theme tokens, and responsive theming across components.

**Frequency**: ~2 times per month

**Steps**:
1. Add or update theme tokens in src/frontend/src/theme/index.ts
2. Implement or update theme hooks (useTheme, useResponsiveTheme)
3. Refactor components to use theme tokens instead of hardcoded values
4. Integrate theme provider in App.tsx and relevant layout components
5. Test light/dark mode and responsive breakpoints

**Files typically involved**:
- `src/frontend/src/theme/index.ts`
- `src/frontend/src/hooks/useTheme.ts`
- `src/frontend/src/hooks/useResponsiveTheme.ts`
- `src/frontend/src/components/**/*.tsx`
- `src/frontend/src/App.tsx`

**Example commit sequence**:
```
Add or update theme tokens in src/frontend/src/theme/index.ts
Implement or update theme hooks (useTheme, useResponsiveTheme)
Refactor components to use theme tokens instead of hardcoded values
Integrate theme provider in App.tsx and relevant layout components
Test light/dark mode and responsive breakpoints
```

### Comprehensive Type Error Fixing

Bulk fixes TypeScript errors across backend and frontend, especially in test files, services, and type definitions.

**Frequency**: ~2 times per month

**Steps**:
1. Identify files with type errors (often via type-check or CI)
2. Fix variable declarations, type assertions, and enum usages
3. Add missing properties to mock objects in test files
4. Add or update type definitions and interfaces
5. Re-run type-check and tests to verify fixes

**Files typically involved**:
- `src/backend/src/**/*.ts`
- `src/frontend/src/**/*.ts`
- `src/frontend/src/**/*.tsx`
- `docs/TYPE_ERRORS_FIX_REPORT.md`
- `docs/TYPE_ERRORS_FIX_PLAN.md`

**Example commit sequence**:
```
Identify files with type errors (often via type-check or CI)
Fix variable declarations, type assertions, and enum usages
Add missing properties to mock objects in test files
Add or update type definitions and interfaces
Re-run type-check and tests to verify fixes
```

### Ci Cd Workflow Standardization

Creates or refactors CI/CD workflows for monolithic deployment, including test, lint, build, and deploy jobs for backend and frontend.

**Frequency**: ~2 times per month

**Steps**:
1. Delete outdated or irrelevant workflow files
2. Create or update ci.yml, deploy-staging.yml, deploy-production.yml in .github/workflows/
3. Configure jobs for lint, type-check, build, test, and deployment
4. Add health checks and deployment monitoring
5. Document pipeline in docs/

**Files typically involved**:
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`
- `docs/CI_CD_GUIDE.md`

**Example commit sequence**:
```
Delete outdated or irrelevant workflow files
Create or update ci.yml, deploy-staging.yml, deploy-production.yml in .github/workflows/
Configure jobs for lint, type-check, build, test, and deployment
Add health checks and deployment monitoring
Document pipeline in docs/
```

### Add Or Improve E2e Tests

Adds or updates end-to-end (E2E) test suites for critical flows, often using Playwright or similar frameworks.

**Frequency**: ~2 times per month

**Steps**:
1. Create new E2E test files in tests/e2e/ or update existing ones
2. Implement test cases for core flows (auth, product management, offline sync, etc.)
3. Update or add test fixtures and page objects as needed
4. Run and verify E2E tests locally and in CI

**Files typically involved**:
- `tests/e2e/**/*.ts`
- `tests/pages/**/*.ts`
- `tests/fixtures/**/*.ts`

**Example commit sequence**:
```
Create new E2E test files in tests/e2e/ or update existing ones
Implement test cases for core flows (auth, product management, offline sync, etc.)
Update or add test fixtures and page objects as needed
Run and verify E2E tests locally and in CI
```

### Bulk Documentation Cleanup Or Update

Removes outdated, duplicate, or irrelevant documentation files and adds or updates strategic docs for project clarity.

**Frequency**: ~2 times per month

**Steps**:
1. Identify and delete outdated or duplicate documentation files
2. Add or update key strategic docs (e.g., completion reports, audit reports, guides)
3. Update README, CONTRIBUTING, LICENSE as needed
4. Summarize changes in commit message

**Files typically involved**:
- `docs/**/*.md`
- `README.md`
- `CONTRIBUTING.md`
- `LICENSE`

**Example commit sequence**:
```
Identify and delete outdated or duplicate documentation files
Add or update key strategic docs (e.g., completion reports, audit reports, guides)
Update README, CONTRIBUTING, LICENSE as needed
Summarize changes in commit message
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
