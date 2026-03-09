---
inclusion: manual
description: 'Step-by-step migration guide from direct TypeORM queries to SecureRepository pattern. Includes before/after examples, testing strategies, and rollback procedures.'
---

# Migration Guide: TypeORM → SecureRepository Pattern

## Overview

Hướng dẫn chi tiết migrate service từ direct TypeORM queries sang SecureRepository pattern để đảm bảo:

- ✅ Multi-tenant isolation
- ✅ Permission-based access control
- ✅ Audit trail
- ✅ Caching strategy

**Estimated Time:** 30-60 phút/service (tùy complexity)

---

## Pre-Migration Checklist

- [ ] Đọc toàn bộ service file hiện tại
- [ ] Research domain-specific best practices (adaptive: 10-60 phút based on complexity)
- [ ] Research industry standards and patterns for this module type
- [ ] Backup code hiện tại (git commit)
- [ ] Đọc test file để hiểu expected behavior
- [ ] Check dependencies (services khác sử dụng service này)

---

## Step-by-Step Migration

### Step 1: Add Required Imports

**Before:**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
```

**After:**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { SecureRepository } from '@/core/security/secure-repository'; // Add
import { PermissionService } from '@/core/security/permission.service'; // Add
import { CacheService } from '@/core/cache/cache.service'; // Add (optional)
import { User } from '@/core/user/user.entity'; // Add
```

---

### Step 2: Update Constructor

**Before:**

```typescript
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}
}
```

**After:**

```typescript
@Injectable()
export class ProjectService {
  private readonly secureProjectRepo: SecureRepository<Project>;

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly permissionService: PermissionService, // Add
    private readonly cacheService: CacheService, // Add (optional)
  ) {
    // Initialize SecureRepository
    this.secureProjectRepo = new SecureRepository(projectRepository, permissionService, 'Project');
  }
}
```

---

### Step 3: Migrate findOne Method

**Before:**

```typescript
async findById(id: string, tenantId: string): Promise<Project> {
  const project = await this.projectRepository.findOne({
    where: { id, tenantId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  return project;
}
```

**After:**

```typescript
async findById(user: User, id: string): Promise<Project> {
  // SecureRepository tự động:
  // 1. Check permission (canRead)
  // 2. Add tenantId filter
  // 3. Throw NotFoundException if not found
  return this.secureProjectRepo.findOne(user, {
    where: { id },
  });
}
```

**With Caching:**

```typescript
async findById(user: User, id: string): Promise<Project> {
  const cacheKey = `project:${id}`;

  // Try cache first
  const cached = await this.cacheService.get<Project>(cacheKey);
  if (cached) return cached;

  // Cache miss - fetch from database
  const project = await this.secureProjectRepo.findOne(user, {
    where: { id },
  });

  // Cache for 5 minutes
  await this.cacheService.set(cacheKey, project, CacheTTL.MEDIUM);

  return project;
}
```

---

### Step 4: Migrate find Method

**Before:**

```typescript
async findAll(tenantId: string): Promise<Project[]> {
  return this.projectRepository.find({
    where: { tenantId },
    order: { createdAt: 'DESC' },
  });
}
```

**After:**

```typescript
async findAll(user: User): Promise<Project[]> {
  return this.secureProjectRepo.find(user, {
    order: { createdAt: 'DESC' },
  });
}
```

**With Caching:**

```typescript
async findAll(user: User): Promise<Project[]> {
  const cacheKey = `projects:${user.tenantId}`;

  const cached = await this.cacheService.get<Project[]>(cacheKey);
  if (cached) return cached;

  const projects = await this.secureProjectRepo.find(user, {
    order: { createdAt: 'DESC' },
  });

  await this.cacheService.set(cacheKey, projects, CacheTTL.SHORT);

  return projects;
}
```

---

### Step 5: Migrate save Method

**Before:**

```typescript
async create(tenantId: string, data: CreateProjectDto): Promise<Project> {
  const project = this.projectRepository.create({
    ...data,
    tenantId,
  });

  return this.projectRepository.save(project);
}
```

**After:**

```typescript
async create(user: User, data: CreateProjectDto): Promise<Project> {
  const project = this.projectRepository.create({
    ...data,
    tenantId: user.tenantId,
    createdBy: user.id,
    updatedBy: user.id,
  });

  return this.secureProjectRepo.save(user, project);
}
```

---

### Step 6: Migrate update Method

**Before:**

```typescript
async update(id: string, tenantId: string, data: UpdateProjectDto): Promise<Project> {
  const project = await this.findById(id, tenantId);

  Object.assign(project, data);

  return this.projectRepository.save(project);
}
```

**After:**

```typescript
async update(user: User, id: string, data: UpdateProjectDto): Promise<Project> {
  const project = await this.findById(user, id);

  Object.assign(project, {
    ...data,
    updatedBy: user.id,
  });

  const updated = await this.secureProjectRepo.save(user, project);

  // Invalidate cache
  await this.cacheService.del(`project:${id}`);
  await this.cacheService.del(`projects:${user.tenantId}`);

  return updated;
}
```

---

### Step 7: Migrate delete Method

**Before:**

```typescript
async delete(id: string, tenantId: string): Promise<void> {
  const project = await this.findById(id, tenantId);
  await this.projectRepository.remove(project);
}
```

**After (Soft Delete):**

```typescript
async delete(user: User, id: string): Promise<void> {
  const project = await this.findById(user, id);

  // Soft delete
  project.deletedAt = new Date();
  project.deletedBy = user.id;

  await this.secureProjectRepo.save(user, project);

  // Invalidate cache
  await this.cacheService.del(`project:${id}`);
  await this.cacheService.del(`projects:${user.tenantId}`);
}
```

**After (Hard Delete):**

```typescript
async delete(user: User, id: string): Promise<void> {
  const project = await this.findById(user, id);

  await this.secureProjectRepo.remove(user, project);

  // Invalidate cache
  await this.cacheService.del(`project:${id}`);
  await this.cacheService.del(`projects:${user.tenantId}`);
}
```

---

### Step 8: Migrate Complex Queries

**Before:**

```typescript
async findByStatus(tenantId: string, status: string): Promise<Project[]> {
  return this.projectRepository
    .createQueryBuilder('project')
    .where('project.tenantId = :tenantId', { tenantId })
    .andWhere('project.status = :status', { status })
    .leftJoinAndSelect('project.owner', 'owner')
    .orderBy('project.createdAt', 'DESC')
    .getMany();
}
```

**After:**

```typescript
async findByStatus(user: User, status: string): Promise<Project[]> {
  return this.secureProjectRepo
    .createSecureQueryBuilder(user, 'project')
    // tenantId filter được thêm tự động
    .where('project.status = :status', { status })
    .leftJoinAndSelect('project.owner', 'owner')
    .orderBy('project.createdAt', 'DESC')
    .getMany();
}
```

---

### Step 9: Update Controller

**Before:**

```typescript
@Controller('projects')
export class ProjectController {
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req.user.tenantId;
    return this.projectService.findById(id, tenantId);
  }
}
```

**After:**

```typescript
@Controller('projects')
export class ProjectController {
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.projectService.findById(user, id);
  }
}
```

---

### Step 10: Update Tests

**Before:**

```typescript
describe('ProjectService', () => {
  it('should find project by id', async () => {
    jest.spyOn(service['projectRepository'], 'findOne').mockResolvedValue(mockProject);

    const result = await service.findById('project-id', 'tenant-id');
    expect(result).toEqual(mockProject);
  });
});
```

**After:**

```typescript
describe('ProjectService', () => {
  let service: ProjectService;
  let permissionService: PermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
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
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    permissionService = module.get<PermissionService>(PermissionService);
  });

  it('should find project by id', async () => {
    // Mock SecureRepository method
    jest.spyOn(service['secureProjectRepo'], 'findOne').mockResolvedValue(mockProject);

    const result = await service.findById(mockUser, 'project-id');

    expect(result).toEqual(mockProject);
    expect(service['secureProjectRepo'].findOne).toHaveBeenCalledWith(mockUser, {
      where: { id: 'project-id' },
    });
  });
});
```

---

## Post-Migration Checklist

- [ ] All methods updated to use SecureRepository
- [ ] All methods accept `User` parameter
- [ ] Audit trail fields added (createdBy, updatedBy)
- [ ] Caching implemented for read operations
- [ ] Cache invalidation on write operations
- [ ] Tests updated to mock SecureRepository
- [ ] All tests passing: `npm test -- project.service.spec.ts`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No lint errors: `npm run lint`
- [ ] Manual testing completed
- [ ] Code reviewed by team
- [ ] Remove from exception list: `.kiro/architecture-exceptions.json`
- [ ] Update CHANGELOG.md
- [ ] Commit with message: `refactor: migrate ProjectService to SecureRepository pattern`

---

## Rollback Procedure

If migration causes issues:

```bash
# 1. Revert commit
git revert HEAD

# 2. Or reset to previous commit
git reset --hard HEAD~1

# 3. Re-add to exception list
# Edit .kiro/architecture-exceptions.json

# 4. Create issue for investigation
gh issue create --title "ProjectService migration failed" --body "Details..."
```

---

## Common Pitfalls

### 1. Forgetting to Update Tests

❌ Tests still mock raw repository  
✅ Update tests to mock SecureRepository

### 2. Missing Audit Trail

❌ Not setting createdBy/updatedBy  
✅ Always set audit fields

### 3. Cache Not Invalidated

❌ Stale data after update  
✅ Invalidate cache on write operations

### 4. Permission Not Checked

❌ Bypass permission check  
✅ SecureRepository checks automatically

### 5. Wrong User Parameter

❌ Pass tenantId string  
✅ Pass User object

---

## Success Metrics

After migration, verify:

- ✅ All tests passing (100%)
- ✅ No direct repository queries
- ✅ Permission checks working
- ✅ Tenant isolation working
- ✅ Audit trail populated
- ✅ Cache hit rate > 50%
- ✅ No performance regression

---

## Example: Complete Migration

See: `docs/examples/project-service-migration.md`

---

**Last Updated**: 2026-03-09  
**Version**: 1.0.0
