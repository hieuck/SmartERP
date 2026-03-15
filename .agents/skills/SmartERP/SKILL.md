# SmartERP Development Patterns

> Auto-generated skill from repository analysis

## Overview

SmartERP is a TypeScript-based enterprise resource planning system with a focus on offline-first architecture. The codebase follows conventional commit patterns and emphasizes progressive migration from React Query to IndexedDB-based offline services across frontend, backend, and mobile platforms.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names
- Test files use `*.spec.ts` or `*.test.ts` extensions
- Configuration files follow standard naming (e.g., `vitest.config.ts`, `jest.config.js`)

### Import/Export Style
```typescript
// Use relative imports
import { OfflineService } from '../services/offline-services';
import { SyncManager } from './sync-manager';

// Use named exports
export { EntityService };
export const configuredService = new EntityService();
```

### Commit Messages
- Follow conventional commit format
- Prefixes: `test:`, `docs:`, `feat:`, `refactor:`, `fix:`, `chore:`
- Keep messages around 62 characters
- Example: `feat: add offline support for inventory entities`

## Workflows

### Dependency Update
**Trigger:** When dependabot detects outdated or vulnerable packages
**Command:** `/update-deps`

1. Navigate to each platform directory (backend, frontend, mobile)
2. Run `npm audit fix` to address security vulnerabilities
3. Update `package.json` and `package-lock.json` files
4. Verify builds still pass with `npm run build`
5. Document vulnerability fixes in commit message with `chore:` prefix

### Offline Entity Addition
**Trigger:** When adding offline support for a new business entity
**Command:** `/add-offline-entity`

1. Add entity interface to `src/frontend/src/lib/offline/db.ts`:
```typescript
export interface NewEntity {
  id: string;
  name: string;
  syncStatus: 'pending' | 'synced' | 'error';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

2. Update IndexedDB schema version in db.ts
3. Create offline service in `src/frontend/src/services/offline-services.ts`:
```typescript
export class NewEntityOfflineService extends BaseOfflineService<NewEntity> {
  constructor() {
    super('newEntities');
  }
}
```

4. Add entity to `src/frontend/src/lib/offline/sync-manager.ts`
5. Update documentation version in `docs/OFFLINE_FIRST_IMPLEMENTATION_STATUS.md`

### Test Suite Addition
**Trigger:** When implementing testing for a new module or platform
**Command:** `/add-tests`

1. Install testing dependencies:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

2. Create test configuration files (`vitest.config.ts` or `jest.config.js`)
3. Add mock files in `src/__mocks__/` directory:
```typescript
export const mockEntity = {
  id: '1',
  name: 'Test Entity',
  syncStatus: 'synced',
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

4. Create test files with `.spec.ts` extension
5. Setup test utilities in `src/test/setup.ts`

### Page Refactor to Offline-First
**Trigger:** When refactoring pages to work offline with IndexedDB
**Command:** `/refactor-offline`

1. Remove React Query imports and usage:
```typescript
// Remove these
import { useQuery, useMutation, useQueryClient } from 'react-query';

// Replace with
import { useOfflineService } from '../hooks/useOfflineService';
import { EntityOfflineService } from '../services/offline-services';
```

2. Replace React Query hooks with offline services:
```typescript
// Before
const { data, isLoading } = useQuery('entities', fetchEntities);

// After  
const { data, isLoading, sync } = useOfflineService(EntityOfflineService);
```

3. Add auto-sync on component mount when online
4. Add manual sync button with loading state
5. Add network status and sync queue indicators
6. Replace `console.log` with Logger Service calls

### Documentation Version Update
**Trigger:** When completing a phase or batch of offline-first implementation
**Command:** `/update-docs`

1. Update version number in `docs/OFFLINE_FIRST_IMPLEMENTATION_STATUS.md`
2. Document completed changes and entity counts
3. Update progress percentages
4. Add phase completion details in `docs/PROJECT_COMPLETION_SUMMARY.md`
5. Commit with `docs:` prefix

### TypeScript Error Batch Fix
**Trigger:** When TypeScript errors need to be resolved in bulk
**Command:** `/fix-ts-errors`

1. Add missing properties to mock objects:
```typescript
// Ensure all mocks include required properties
const mockEntity = {
  id: '1',
  name: 'Test',
  version: 1,           // Often missing
  syncStatus: 'synced', // Often missing
  createdAt: new Date(),
  updatedAt: new Date()
};
```

2. Fix enum imports and usage
3. Update type assertions and interface compliance
4. Ensure entity properties match backend schema
5. Run `npm run type-check` to verify fixes

## Testing Patterns

### Test File Structure
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockEntity } from '../__mocks__/entity.mock';

describe('EntityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle offline operations', async () => {
    // Test implementation
    expect(result).toBeDefined();
  });
});
```

### Mock Patterns
- Place mocks in `src/__mocks__/` directories
- Include all required entity properties (`version`, `syncStatus`)
- Use consistent mock data structure across tests

## Commands

| Command | Purpose |
|---------|---------|
| `/update-deps` | Update npm dependencies with security fixes |
| `/add-offline-entity` | Add offline support for new business entity |
| `/add-tests` | Setup comprehensive test suite for module |
| `/refactor-offline` | Convert React Query pages to offline-first |
| `/update-docs` | Update documentation with version and progress |
| `/fix-ts-errors` | Batch fix TypeScript compilation errors |