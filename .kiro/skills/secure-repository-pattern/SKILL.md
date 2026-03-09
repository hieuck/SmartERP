---
name: secure-repository-pattern
description: Multi-tenant security pattern with automatic tenant isolation, permission checks, and audit trail. Use when implementing services in any multi-tenant application (SaaS, B2B, Enterprise) that requires tenant isolation and RBAC.
---

# SecureRepository Pattern

Complete guide for implementing secure, multi-tenant data access in any application.

## 🎯 When to Use

Use SecureRepository when:

- ✅ Implementing any service that accesses database
- ✅ Need tenant isolation (multi-tenancy)
- ✅ Need permission checks (RBAC)
- ✅ Need audit trail (createdBy, updatedBy)
- ✅ Following Odoo/ERPNext architecture patterns

## 🚀 Quick Start

### Step 1: Import Dependencies

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecureRepository } from '@/core/security/secure-repository';
import { PermissionService } from '@/core/security/permission.service';
import { CacheService } from '@/core/cache/cache.service';
import { User } from '@/core/user/user.entity';
import { Project } from './project.entity';
```

### Step 2: Setup Constructor

```typescript
@Injectable()
export class ProjectService {
  private readonly secureProjectRepo: SecureRepository<Project>;

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly permissionService: PermissionService,
    private readonly cacheService: CacheService, // Optional
  ) {
    // Initialize SecureRepository
    this.secureProjectRepo = new SecureRepository(
      projectRepository,
      permissionService,
      'Project', // Entity name for permission checks
    );
  }
}
```

### Step 3: Use SecureRepository Methods

```typescript
// Find all (with tenant isolation)
async findAll(user: User): Promise<Project[]> {
  return this.secureProjectRepo.find(user, {
    order: { createdAt: 'DESC' },
  });
}

// Find one (with permission check)
async findById(user: User, id: string): Promise<Project> {
  return this.secureProjectRepo.findOne(user, {
    where: { id },
  });
}

// Create (with audit trail)
async create(user: User, data: CreateProjectDto): Promise<Project> {
  const project = this.projectRepository.create({
    ...data,
    tenantId: user.tenantId,
    createdBy: user.id,
    updatedBy: user.id,
  });

  return this.secureProjectRepo.save(user, project);
}

// Update (with permission check + audit trail)
async update(user: User, id: string, data: UpdateProjectDto): Promise<Project> {
  const project = await this.findById(user, id);

  Object.assign(project, {
    ...data,
    updatedBy: user.id,
  });

  return this.secureProjectRepo.save(user, project);
}

// Delete (soft delete with audit trail)
async delete(user: User, id: string): Promise<void> {
  const project = await this.findById(user, id);

  project.deletedAt = new Date();
  project.deletedBy = user.id;

  await this.secureProjectRepo.save(user, project);
}
```

## 📖 Core Concepts

### 1. Automatic Tenant Isolation

SecureRepository automatically adds `tenantId` filter to all queries:

```typescript
// You write:
await this.secureProjectRepo.find(user, {
  where: { status: 'active' },
});

// SecureRepository executes:
// SELECT * FROM projects
// WHERE status = 'active' AND tenantId = 'user-tenant-id'
```

### 2. Permission Checks

SecureRepository checks permissions before operations:

```typescript
// Before find/findOne: checks canRead(user, 'Project')
// Before save: checks canWrite(user, 'Project')
// Before remove: checks canDelete(user, 'Project')

// If permission denied:
throw new ForbiddenException('User does not have permission to read Project');
```

### 3. Audit Trail

Always set audit fields:

```typescript
const entity = {
  ...data,
  tenantId: user.tenantId, // Required
  createdBy: user.id, // On create
  updatedBy: user.id, // On create/update
  deletedBy: user.id, // On soft delete
  createdAt: new Date(), // Auto by TypeORM
  updatedAt: new Date(), // Auto by TypeORM
  deletedAt: new Date(), // On soft delete
};
```

## 🔧 Advanced Usage

### Complex Queries with Query Builder

```typescript
async findByStatusAndOwner(
  user: User,
  status: string,
  ownerId: string
): Promise<Project[]> {
  return this.secureProjectRepo
    .createSecureQueryBuilder(user, 'project')
    // tenantId filter added automatically
    .where('project.status = :status', { status })
    .andWhere('project.ownerId = :ownerId', { ownerId })
    .leftJoinAndSelect('project.owner', 'owner')
    .orderBy('project.createdAt', 'DESC')
    .getMany();
}
```

### With Caching

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

### Batch Operations

```typescript
async createMany(user: User, dataList: CreateProjectDto[]): Promise<Project[]> {
  const projects = dataList.map(data =>
    this.projectRepository.create({
      ...data,
      tenantId: user.tenantId,
      createdBy: user.id,
      updatedBy: user.id,
    })
  );

  // Save all at once
  return this.secureProjectRepo.saveMany(user, projects);
}
```

### Transactions

```typescript
async transferProject(
  user: User,
  projectId: string,
  newOwnerId: string
): Promise<Project> {
  return this.projectRepository.manager.transaction(async (manager) => {
    // Create transactional SecureRepository
    const txRepo = new SecureRepository(
      manager.getRepository(Project),
      this.permissionService,
      'Project',
    );

    const project = await txRepo.findOne(user, { where: { id: projectId } });
    project.ownerId = newOwnerId;
    project.updatedBy = user.id;

    return txRepo.save(user, project);
  });
}
```

## 🧪 Testing with SecureRepository

### Unit Test Setup

```typescript
describe('ProjectService', () => {
  let service: ProjectService;
  let permissionService: PermissionService;

  const mockUser = {
    id: 'user-1',
    tenantId: 'tenant-1',
    role: 'user',
  };

  const mockProject = {
    id: '1',
    name: 'Project 1',
    tenantId: 'tenant-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: {}, // Empty - not used directly
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

    // Mock SecureRepository methods AFTER service creation
    jest.spyOn(service['secureProjectRepo'], 'find').mockResolvedValue([mockProject]);

    jest.spyOn(service['secureProjectRepo'], 'findOne').mockResolvedValue(mockProject);

    jest
      .spyOn(service['secureProjectRepo'], 'save')
      .mockImplementation(async (_user, data) => ({ ...mockProject, ...data }));

    jest.spyOn(service['secureProjectRepo'], 'remove').mockResolvedValue(undefined);
  });

  it('should find all projects with tenant isolation', async () => {
    const result = await service.findAll(mockUser);

    expect(result).toEqual([mockProject]);
    expect(service['secureProjectRepo'].find).toHaveBeenCalledWith(
      mockUser,
      expect.objectContaining({ order: { createdAt: 'DESC' } }),
    );
  });

  it('should check permission before finding', async () => {
    await service.findById(mockUser, '1');

    expect(permissionService.canRead).toHaveBeenCalledWith(mockUser, 'Project');
  });

  it('should set audit trail on create', async () => {
    const createDto = { name: 'New Project' };

    await service.create(mockUser, createDto);

    expect(service['secureProjectRepo'].save).toHaveBeenCalledWith(
      mockUser,
      expect.objectContaining({
        name: 'New Project',
        tenantId: 'tenant-1',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      }),
    );
  });
});
```

## 🚨 Common Mistakes

### ❌ DON'T: Use raw repository directly

```typescript
// ❌ WRONG - Bypasses security
async findAll(tenantId: string): Promise<Project[]> {
  return this.projectRepository.find({
    where: { tenantId }
  });
}
```

### ✅ DO: Use SecureRepository

```typescript
// ✅ CORRECT - Enforces security
async findAll(user: User): Promise<Project[]> {
  return this.secureProjectRepo.find(user, {});
}
```

### ❌ DON'T: Forget audit trail

```typescript
// ❌ WRONG - Missing audit fields
const project = this.projectRepository.create(data);
return this.secureProjectRepo.save(user, project);
```

### ✅ DO: Always set audit fields

```typescript
// ✅ CORRECT - Complete audit trail
const project = this.projectRepository.create({
  ...data,
  tenantId: user.tenantId,
  createdBy: user.id,
  updatedBy: user.id,
});
return this.secureProjectRepo.save(user, project);
```

### ❌ DON'T: Mock raw TypeORM in tests

```typescript
// ❌ WRONG - Mocks wrong methods
jest.spyOn(service['projectRepository'], 'find');
jest.spyOn(service['projectRepository'], 'update');
```

### ✅ DO: Mock SecureRepository methods

```typescript
// ✅ CORRECT - Mocks SecureRepository
jest.spyOn(service['secureProjectRepo'], 'find');
jest.spyOn(service['secureProjectRepo'], 'save');
```

## 📋 Checklist

Before merging code with SecureRepository:

- [ ] ✅ Constructor creates SecureRepository instance
- [ ] ✅ All methods accept `User` parameter (not `tenantId` string)
- [ ] ✅ All queries use SecureRepository (not raw repository)
- [ ] ✅ Audit trail fields set on create/update/delete
- [ ] ✅ Cache invalidation on write operations
- [ ] ✅ Tests mock SecureRepository methods
- [ ] ✅ Tests verify permission checks
- [ ] ✅ Tests verify tenant isolation
- [ ] ✅ No direct repository queries in service
- [ ] ✅ Soft delete implemented (if applicable)

## 🔗 Related Skills

- [Backend Testing Patterns](../backend-testing-patterns/SKILL.md) - How to test SecureRepository
- [Fixing Test Mocking Issues](../fixing-test-mocking-issues/SKILL.md) - Fix common test errors
- [Error Handling Patterns](../error-handling-patterns/SKILL.md) - Handle permission errors
- [Performance Optimization](../performance-optimization-patterns/SKILL.md) - Optimize queries

## 📚 References

- Architecture: `.kiro/steering/odoo-erpnext-architecture.md`
- Implementation: `src/backend/core/security/secure-repository.ts`
- PermissionService: `src/backend/core/security/permission.service.ts`
- Migration Guide: `.kiro/steering/migration-guide.md`

---

**Last Updated**: 2026-03-09  
**Version**: 2.0.0
