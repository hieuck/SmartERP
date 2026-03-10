```markdown
# SmartERP Development Patterns

> Auto-generated skill from repository analysis

## Overview

SmartERP is a TypeScript-based enterprise resource planning system built with a domain-driven architecture. The codebase emphasizes security through a SecureRepository pattern that enforces tenant isolation and permission-based access control. The system follows conventional commit standards and maintains comprehensive test coverage using Vitest.

## Coding Conventions

### File Naming
- Use camelCase for all TypeScript files
- Test files follow pattern: `*.spec.ts`
- Entity files: `*.entity.ts`
- DTO files: `*.dto.ts`
- Service files: `*.service.ts`
- Controller files: `*.controller.ts`

### Import/Export Style
```typescript
// Use relative imports
import { UserService } from './user.service';
import { CreateUserDto } from '../dto/createUser.dto';

// Use named exports
export class UserService {
  // implementation
}

export { UserController } from './user.controller';
```

### Commit Conventions
- Format: `type: description` (average 57 characters)
- Types: `feat`, `fix`, `refactor`, `docs`, `test`
- Example: `feat: add user permission validation to SecureRepository`

## Workflows

### Secure Repository Migration
**Trigger:** When refactoring a service to comply with architecture standards
**Command:** `/migrate-to-secure-repository`

1. Add SecureRepository and PermissionService injection to the service constructor
2. Update method signatures from `tenantId: string` parameter to `user: User` parameter
3. Replace direct TypeORM repository calls with SecureRepository methods
4. Update all corresponding test files to mock SecureRepository methods
5. Remove the service from `.kiro/architecture-exceptions.json`

```typescript
// Before
constructor(
  @InjectRepository(User)
  private readonly userRepository: Repository<User>
) {}

async findUser(tenantId: string, id: string) {
  return this.userRepository.findOne({ where: { tenantId, id } });
}

// After
constructor(
  private readonly secureRepository: SecureRepository<User>,
  private readonly permissionService: PermissionService
) {}

async findUser(user: User, id: string) {
  return this.secureRepository.findOne(user, { where: { id } });
}
```

### Test Fixing for Secure Repository
**Trigger:** When tests fail after SecureRepository migration
**Command:** `/fix-secure-repository-tests`

1. Add PermissionService mock with `canRead`, `canWrite`, `canDelete` methods
2. Fix controller method signatures to use `User` type instead of `string`
3. Add mockQueryBuilder with `orderBy`, `select`, `getMany`, `getOne` methods
4. Update repository mock `createQueryBuilder` methods
5. Verify DTO field names match actual DTOs

```typescript
// Test setup example
const mockPermissionService = {
  canRead: jest.fn().mockResolvedValue(true),
  canWrite: jest.fn().mockResolvedValue(true),
  canDelete: jest.fn().mockResolvedValue(true)
};

const mockQueryBuilder = {
  orderBy: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getOne: jest.fn().mockResolvedValue(null)
};
```

### Module Creation
**Trigger:** When adding a new domain module to the system
**Command:** `/create-module`

1. Create entity with tenant isolation and audit fields (createdAt, updatedAt, tenantId)
2. Create DTOs for create, update, and query operations
3. Implement service using SecureRepository pattern
4. Create controller with role-based access control decorators
5. Write comprehensive unit tests for service and controller
6. Register new module in `src/backend/app.module.ts`

```typescript
// Entity template
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Compilation Error Fixing
**Trigger:** When there are multiple TypeScript compilation errors to resolve
**Command:** `/fix-compilation-errors`

1. Run TypeScript compiler to identify and document errors
2. Create Python script to fix specific error patterns automatically
3. Execute script to fix parameter mismatches and type alignment issues
4. Update method signatures to align with SecureRepository pattern
5. Verify successful compilation and run tests

### Kiro Hook Configuration
**Trigger:** When updating development automation and workflow rules
**Command:** `/update-kiro-hooks`

1. Update hook configuration files in `.kiro/hooks/`
2. Modify hook triggers and automated actions
3. Update architecture compliance rules
4. Enable or disable hooks based on current project phase
5. Update steering documentation with new automation rules

### Documentation Update
**Trigger:** When documenting progress, decisions, or architectural changes
**Command:** `/update-docs`

1. Update `CHANGELOG.md` with recent changes using conventional commit format
2. Update `ROADMAP.md` with completed milestones and next priorities
3. Create or update architectural decision records in `docs/`
4. Update implementation guides and developer documentation
5. Archive outdated documentation to maintain clarity

## Testing Patterns

### Test Framework
- Use Vitest as the testing framework
- Test files use `.spec.ts` extension
- Place test files alongside source files

### Mock Patterns
```typescript
// Service mocking
const mockUserService = {
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

// Repository mocking with SecureRepository
const mockSecureRepository = {
  findOne: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};
```

### Test Structure
```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<SecureRepository<User>>;

  beforeEach(async () => {
    // Setup test module
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      // Test implementation
    });
  });
});
```

## Commands

| Command | Purpose |
|---------|---------|
| `/migrate-to-secure-repository` | Refactor service to use SecureRepository pattern with permission checks |
| `/fix-secure-repository-tests` | Fix test files after SecureRepository migration with proper mocks |
| `/create-module` | Create new backend module with complete CRUD functionality |
| `/fix-compilation-errors` | Batch fix TypeScript compilation errors using automated scripts |
| `/update-kiro-hooks` | Configure Kiro hooks for autonomous development workflow |
| `/update-docs` | Update project documentation, roadmaps, and architectural decisions |
```