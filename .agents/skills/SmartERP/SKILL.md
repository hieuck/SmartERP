# SmartERP Development Patterns

> Auto-generated skill from repository analysis

## Overview

SmartERP is a TypeScript-based enterprise resource planning system with a multi-platform architecture (backend, frontend, mobile). The codebase emphasizes offline-first capabilities, comprehensive testing, and maintainable code through consistent refactoring patterns. The project follows conventional commit standards and implements IndexedDB-based offline synchronization for business entities.

## Coding Conventions

### File Naming
- Use **camelCase** for all files
- Test files: `*.spec.ts` or `*.test.ts`
- Services: `*.service.ts`
- Controllers: `*.controller.ts`
- Entities: `*.entity.ts`

### Import/Export Style
```typescript
// Use relative imports
import { UserService } from '../services/user.service';
import { SyncManager } from '../../lib/offline/sync-manager';

// Use named exports
export { UserController };
export { OfflineUserService };
```

### Commit Messages
Follow conventional commit format with these prefixes:
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `test:` - Testing additions/changes
- `docs:` - Documentation updates
- `chore:` - Maintenance tasks

Average commit message length: ~62 characters

## Workflows

### Dependency Updates
**Trigger:** When dependabot alerts or manual dependency updates are needed
**Command:** `/update-deps`

1. Update `package.json` files in all directories (backend, frontend, mobile)
2. Update corresponding `package-lock.json` files
3. Verify compatibility across all modules
4. Test critical functionality after updates
5. Commit with format: `chore: update dependencies across modules`

### Mass Refactoring
**Trigger:** When implementing code quality standards or architectural improvements
**Command:** `/mass-refactor`

1. Create refactoring scripts in `src/backend/`:
   ```javascript
   // fix-lint-errors.js
   // fix-unused-vars.js
   // remove-unused-imports.js
   ```
2. Run automated fixes across codebase
3. Update package.json dependencies if needed
4. Refactor controllers, services, and entities systematically
5. Update tests to match refactored code
6. Update documentation to reflect changes
7. Commit with format: `refactor: large-scale code quality improvements`

### Testing Suite Addition
**Trigger:** When adding testing to new modules or platforms
**Command:** `/add-tests`

1. Install testing dependencies (vitest/jest)
2. Create test configuration files:
   ```typescript
   // vitest.config.ts
   // jest.config.js
   ```
3. Setup test infrastructure:
   ```
   src/__mocks__/
   src/__tests__/
   src/test/
   ```
4. Write comprehensive test files with `.spec.ts` extension
5. Create mock utilities for external dependencies
6. Commit with format: `test: add comprehensive test suite for [module]`

### Offline Service Implementation
**Trigger:** When implementing offline support for new business entities
**Command:** `/add-offline`

1. Update IndexedDB schema in `src/frontend/src/lib/offline/db.ts`:
   ```typescript
   // Add new entity table to schema
   entityName: '++id, field1, field2, lastModified'
   ```
2. Create offline service:
   ```typescript
   // src/frontend/src/services/offline/entity-offline.service.ts
   export class EntityOfflineService {
     async create(entity: Entity): Promise<Entity> { /* IndexedDB logic */ }
     async sync(): Promise<void> { /* Sync with backend */ }
   }
   ```
3. Update sync-manager to include new entity
4. Add to offline-services index exports
5. Update `docs/OFFLINE_FIRST_IMPLEMENTATION_STATUS.md`
6. Commit with format: `feat: add offline support for [entity]`

### Documentation Updates
**Trigger:** When documenting new features, completing phases, or providing guides
**Command:** `/update-docs`

1. Create markdown files in `docs/` directory
2. Update existing documentation files
3. Add implementation guides and coding standards
4. Update project status and feature completion
5. Ensure documentation matches current codebase state
6. Commit with format: `docs: update [specific documentation area]`

### TypeScript Error Fixing
**Trigger:** When TypeScript compilation errors are found in test suites
**Command:** `/fix-typescript`

1. Identify TypeScript errors in test files
2. Fix missing properties in mock objects:
   ```typescript
   const mockEntity = {
     id: 1,
     name: 'test',
     // Add all required properties
     createdAt: new Date(),
     updatedAt: new Date()
   };
   ```
3. Fix import paths and add proper type assertions
4. Update enum usage to match current definitions
5. Ensure all test files compile successfully
6. Commit with format: `fix: resolve TypeScript errors in tests`

### Page Refactoring to Offline-First
**Trigger:** When converting existing pages to work offline
**Command:** `/refactor-offline`

1. Remove React Query hooks and replace with offline services:
   ```typescript
   // Before
   const { data } = useQuery(['entities'], fetchEntities);
   
   // After
   const [data, setData] = useState([]);
   const offlineService = new EntityOfflineService();
   ```
2. Replace API service calls with IndexedDB operations
3. Add auto-sync and manual sync capabilities
4. Add network status indicators to UI
5. Replace console.log with Logger service calls
6. Test offline functionality thoroughly
7. Commit with format: `refactor: convert [page] to offline-first`

### Broken Page Cleanup
**Trigger:** When cleaning up frontend code that doesn't match backend implementation
**Command:** `/cleanup-broken`

1. Identify pages calling non-existent backend APIs
2. Delete broken page files and components
3. Delete associated service files
4. Update index files to remove exports:
   ```typescript
   // Remove from src/frontend/src/services/index.ts
   // export { BrokenService } from './broken.service';
   ```
5. Update routing configuration
6. Update documentation to reflect removed features
7. Commit with format: `chore: cleanup broken pages and services`

## Testing Patterns

### Test Structure
- Use vitest as the primary testing framework
- Test files follow pattern: `*.spec.ts`
- Create comprehensive mocks in `src/__mocks__/`
- Write unit tests for services, controllers, and entities

### Example Test Pattern
```typescript
// entity.service.spec.ts
describe('EntityService', () => {
  let service: EntityService;
  
  beforeEach(() => {
    service = new EntityService();
  });
  
  it('should create entity', async () => {
    const mockEntity = { name: 'test' };
    const result = await service.create(mockEntity);
    expect(result).toBeDefined();
  });
});
```

## Commands

| Command | Purpose |
|---------|---------|
| `/update-deps` | Update npm dependencies across all modules |
| `/mass-refactor` | Perform large-scale code refactoring |
| `/add-tests` | Add comprehensive test suites |
| `/add-offline` | Implement offline support for entities |
| `/update-docs` | Create or update documentation |
| `/fix-typescript` | Fix TypeScript compilation errors |
| `/refactor-offline` | Convert pages to offline-first |
| `/cleanup-broken` | Remove broken pages and services |