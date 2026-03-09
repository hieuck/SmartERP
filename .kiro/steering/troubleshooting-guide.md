---
inclusion: manual
description: 'Troubleshooting guide for common architecture compliance issues, test failures, and SecureRepository migration problems. Includes solutions and workarounds.'
---

# Troubleshooting Guide

## Common Architecture Compliance Issues

### 1. Direct Repository Query Error

**Error:**

```
❌ VIOLATION: Direct repository query detected
Use SecureRepository instead
```

**Cause:** Service đang query trực tiếp TypeORM repository

**Bad Code:**

```typescript
const user = await this.userRepository.findOne({
  where: { id, tenantId },
});
```

**Solution:**

```typescript
// 1. Inject PermissionService
constructor(
  @InjectRepository(User)
  private readonly userRepository: Repository<User>,
  private readonly permissionService: PermissionService,
) {
  // 2. Create SecureRepository
  this.secureUserRepo = new SecureRepository(
    userRepository,
    permissionService,
    'User',
  );
}

// 3. Use SecureRepository
const user = await this.secureUserRepo.findOne(currentUser, {
  where: { id }
});
```

---

### 2. Missing PermissionService

**Error:**

```
❌ VIOLATION: Missing PermissionService in service
```

**Cause:** Service không inject PermissionService

**Solution:**

```typescript
import { PermissionService } from '@/core/security/permission.service';

@Injectable()
export class MyService {
  constructor(
    @InjectRepository(MyEntity)
    private readonly myRepository: Repository<MyEntity>,
    private readonly permissionService: PermissionService, // Add this
  ) {
    this.secureMyRepo = new SecureRepository(myRepository, permissionService, 'MyEntity');
  }
}
```

---

### 3. Test Failures After SecureRepository Migration

**Error:**

```
TypeError: Cannot read property 'findOne' of undefined
```

**Cause:** Tests đang mock raw TypeORM methods thay vì SecureRepository

**Bad Test:**

```typescript
jest.spyOn(service['userRepository'], 'findOne').mockResolvedValue(mockUser);
```

**Good Test:**

```typescript
// Mock SecureRepository methods
jest.spyOn(service['secureUserRepo'], 'findOne').mockResolvedValue(mockUser);
jest.spyOn(service['secureUserRepo'], 'find').mockResolvedValue([mockUser]);
```

**Complete Test Example:**

```typescript
describe('UserService', () => {
  let service: UserService;
  let secureUserRepo: SecureRepository<User>;
  let permissionService: PermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockResolvedValue(true),
            canWrite: jest.fn().mockResolvedValue(true),
            canDelete: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    permissionService = module.get<PermissionService>(PermissionService);

    // Mock SecureRepository methods
    jest.spyOn(service['secureUserRepo'], 'findOne').mockResolvedValue(mockUser);
  });

  it('should find user by id', async () => {
    const result = await service.findById(mockUser, 'user-id');
    expect(result).toEqual(mockUser);
    expect(service['secureUserRepo'].findOne).toHaveBeenCalledWith(mockUser, {
      where: { id: 'user-id' },
    });
  });
});
```

---

### 4. Tenant Isolation Not Working

**Error:**

```
User can see data from other tenants
```

**Cause:** Query không filter theo tenantId

**Bad Code:**

```typescript
// Missing tenant filter
const projects = await this.secureProjectRepo.find(user, {
  where: { status: 'active' },
});
```

**Solution:**

```typescript
// SecureRepository tự động thêm tenantId filter
// Chỉ cần pass user object
const projects = await this.secureProjectRepo.find(user, {
  where: { status: 'active' },
  // tenantId filter được thêm tự động
});
```

**For Complex Queries:**

```typescript
const projects = await this.secureProjectRepo
  .createSecureQueryBuilder(user, 'project')
  .where('project.status = :status', { status: 'active' })
  // tenantId filter được thêm tự động
  .getMany();
```

---

### 5. Permission Check Failing

**Error:**

```
ForbiddenException: User does not have permission to read Project
```

**Cause:** User không có quyền hoặc PermissionService chưa được config đúng

**Debug Steps:**

```typescript
// 1. Check user permissions
const canRead = await this.permissionService.canRead(user, 'Project');
console.log('Can read Project:', canRead);

// 2. Check user role
console.log('User role:', user.role);

// 3. Check permission configuration
// See: src/backend/core/security/permission.service.ts
```

**Solution:**

```typescript
// Grant permission in PermissionService
// Or bypass for admin users
if (user.role === 'admin') {
  // Admin has all permissions
  return true;
}
```

---

### 6. Cache Not Invalidating

**Error:**

```
Stale data returned after update
```

**Cause:** Cache không được invalidate sau update/delete

**Solution:**

```typescript
async updateProject(user: User, id: string, data: UpdateProjectDto) {
  const project = await this.secureProjectRepo.findOne(user, {
    where: { id }
  });

  Object.assign(project, data);
  const updated = await this.secureProjectRepo.save(user, project);

  // Invalidate cache
  await this.cacheService.del(`project:${id}`);
  await this.cacheService.del(`projects:${user.tenantId}`);

  return updated;
}
```

---

### 7. Exception List Not Working

**Error:**

```
Pre-commit hook blocks legacy code
```

**Cause:** File path trong exception list không match

**Solution:**

```json
// .kiro/architecture-exceptions.json
{
  "exemptFiles": [
    {
      "path": "src/backend/domains/project/project.service.ts", // Exact path
      "reason": "Legacy code",
      "deadline": "2026-06-30"
    }
  ]
}
```

**Verify Path:**

```bash
# Check exact file path
git ls-files | grep project.service.ts
```

---

### 8. CI/CD Pipeline Failing

**Error:**

```
Architecture compliance check failed in CI/CD
```

**Debug Steps:**

```bash
# 1. Run locally
.husky/architecture-check

# 2. Check exception list
cat .kiro/architecture-exceptions.json

# 3. Check changed files
git diff --name-only origin/main...HEAD | grep -E '\.service\.ts$'
```

**Solution:**

- Fix violations locally first
- Or add to exception list with valid reason
- Push changes and re-run pipeline

---

## Edge Cases

### 1. Global Queries (Admin Only)

**Scenario:** Admin cần query across all tenants

**Solution:**

```typescript
// Use raw repository with explicit permission check
async getAllTenantsData(user: User) {
  // 1. Check admin permission
  if (user.role !== 'admin') {
    throw new ForbiddenException('Admin only');
  }

  // 2. Use raw repository (bypass tenant isolation)
  return this.tenantRepository.find({
    order: { createdAt: 'DESC' }
  });
}
```

### 2. System Operations (No User Context)

**Scenario:** Background job không có user context

**Solution:**

```typescript
// Create system user
const systemUser: User = {
  id: 'system',
  tenantId: 'system',
  role: 'admin',
  // ... other fields
};

// Use system user for queries
await this.secureProjectRepo.find(systemUser, {});
```

### 3. Migration Scripts

**Scenario:** Data migration cần bypass security

**Solution:**

```typescript
// Use raw repository in migration
async migrate() {
  const projects = await this.projectRepository.find();

  for (const project of projects) {
    // Update data
    project.status = 'migrated';
    await this.projectRepository.save(project);
  }
}
```

---

## Performance Issues

### 1. N+1 Query Problem

**Symptom:** Slow queries with many database calls

**Solution:**

```typescript
// Use eager loading
const projects = await this.secureProjectRepo.find(user, {
  relations: ['owner', 'tasks', 'team'],
});

// Or use query builder with joins
const projects = await this.secureProjectRepo
  .createSecureQueryBuilder(user, 'project')
  .leftJoinAndSelect('project.owner', 'owner')
  .leftJoinAndSelect('project.tasks', 'tasks')
  .getMany();
```

### 2. Cache Miss Rate High

**Symptom:** Cache not effective

**Solution:**

```typescript
// Use appropriate TTL
await this.cacheService.set(
  `project:${id}`,
  project,
  CacheTTL.MEDIUM // 5 minutes
);

// Warm up cache on startup
async onModuleInit() {
  await this.warmUpCache();
}
```

---

## Getting Help

1. **Check Documentation:**
   - `.kiro/steering/multi-tenant-architecture-patterns.md`
   - `.kiro/steering/architecture-enforcement.md`

2. **Check Exception List:**
   - `.kiro/architecture-exceptions.json`

3. **Run Diagnostics:**

   ```bash
   npm run lint
   npm run type-check
   npm test
   .husky/architecture-check
   ```

4. **Ask Team:**
   - Create GitHub issue with error details
   - Tag `@refactor-team` for architecture questions

---

**Last Updated**: 2026-03-09  
**Version**: 1.0.0
