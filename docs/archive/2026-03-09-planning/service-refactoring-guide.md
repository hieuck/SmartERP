# Service Refactoring Guide - SecureRepository Pattern

**Target**: Full Stack Engineer & Senior Dev #2  
**Time**: Week 1 (Day 2-3) - 16 hours  
**Priority**: P0 CRITICAL

---

## 🎯 Objective

Refactor 8-10 Platform services from raw TypeORM to SecureRepository pattern.

**WHY**: SecureRepository ensures tenant isolation and permission checks at the data access layer.

---

## 📋 Services to Refactor

### Full Stack Engineer (5 services - 16 hours)

**Day 2-3:**

1. `notification.service.ts` (3 hours)
2. `email.service.ts` (3 hours)
3. `document.service.ts` (3 hours)
4. `workflow.service.ts` (3 hours)
5. `approval.service.ts` (4 hours)

### Senior Dev #2 (3 services - 16 hours)

**Day 2-3:**

1. `dashboard.service.ts` (6 hours)
2. `search.service.ts` (5 hours)
3. `settings.service.ts` (5 hours)

---

## 🔧 Refactoring Pattern (5 Steps)

### Step 1: Replace Repository Injection

**BEFORE (Raw TypeORM):**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}
}
```

**AFTER (SecureRepository):**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { SecureRepository } from '@/common/database/secure-repository';
import { PermissionService } from '@/common/security/permission.service';
import { User } from '@/backend/domains/auth/user/entities/user.entity';

@Injectable()
export class NotificationService {
  private readonly notificationRepository: SecureRepository<Notification>;

  constructor(
    @InjectRepository(Notification)
    repository: Repository<Notification>,
    private readonly permissionService: PermissionService,
  ) {
    this.notificationRepository = new SecureRepository(
      repository,
      permissionService,
      'Notification',
    );
  }
}
```

### Step 2: Update Method Signatures (tenantId → user)

**BEFORE:**

```typescript
async findAll(tenantId: string, page: number, limit: number) {
  return this.notificationRepository.find({
    where: { tenantId },
    skip: (page - 1) * limit,
    take: limit,
  });
}

async findOne(tenantId: string, id: string) {
  return this.notificationRepository.findOne({
    where: { id, tenantId },
  });
}

async create(tenantId: string, createDto: CreateNotificationDto) {
  const notification = this.notificationRepository.create({
    ...createDto,
    tenantId,
  });
  return this.notificationRepository.save(notification);
}
```

**AFTER:**

```typescript
async findAll(user: User, page: number, limit: number) {
  return this.notificationRepository.find(user, {
    skip: (page - 1) * limit,
    take: limit,
  });
}

async findOne(user: User, id: string) {
  return this.notificationRepository.findOne(user, {
    where: { id },
  });
}

async create(user: User, createDto: CreateNotificationDto) {
  const notification = this.notificationRepository.create({
    ...createDto,
    tenantId: user.tenantId,
    createdBy: user.id,
  });
  return this.notificationRepository.save(user, notification);
}
```

### Step 3: Replace QueryBuilder with SecureRepository Methods

**BEFORE (QueryBuilder - WRONG):**

```typescript
async findByStatus(tenantId: string, status: string) {
  return this.notificationRepository
    .createQueryBuilder('notification')
    .where('notification.tenantId = :tenantId', { tenantId })
    .andWhere('notification.status = :status', { status })
    .getMany();
}
```

**AFTER (SecureRepository - CORRECT):**

```typescript
async findByStatus(user: User, status: string) {
  return this.notificationRepository.find(user, {
    where: { status },
  });
}
```

### Step 4: Update Tests

**BEFORE (Mocking Raw TypeORM - WRONG):**

```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  }),
};
```

**AFTER (Mocking SecureRepository - CORRECT):**

```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
};

const mockPermissionService = {
  buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
  canRead: jest.fn().mockReturnValue(true),
  canWrite: jest.fn().mockReturnValue(true),
  canDelete: jest.fn().mockReturnValue(true),
};

// In test setup
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      NotificationService,
      {
        provide: getRepositoryToken(Notification),
        useValue: mockRepository,
      },
      {
        provide: PermissionService,
        useValue: mockPermissionService,
      },
    ],
  }).compile();

  service = module.get<NotificationService>(NotificationService);
});
```

### Step 5: Update Controller

**BEFORE:**

```typescript
@Get()
async findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20,
  @Req() req: any,
) {
  const tenantId = req.user.tenantId;
  return this.notificationService.findAll(tenantId, page, limit);
}
```

**AFTER:**

```typescript
@Get()
async findAll(
  @CurrentUser() user: User,
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20,
) {
  return this.notificationService.findAll(user, page, limit);
}
```

---

## 📝 Detailed Refactoring Checklist

### For Each Service:

#### Phase 1: Preparation (15 min)

- [ ] Read current service implementation
- [ ] Identify all methods that access database
- [ ] List all QueryBuilder usages
- [ ] Check test file structure
- [ ] Create backup branch

#### Phase 2: Service Refactoring (60-90 min)

- [ ] Add SecureRepository import
- [ ] Add PermissionService import
- [ ] Add User entity import
- [ ] Replace Repository injection with SecureRepository
- [ ] Update constructor to initialize SecureRepository
- [ ] Change all method signatures (tenantId → user)
- [ ] Replace all `find()` calls with SecureRepository pattern
- [ ] Replace all `findOne()` calls with SecureRepository pattern
- [ ] Replace all `save()` calls with SecureRepository pattern
- [ ] Replace all `remove()` calls with SecureRepository pattern
- [ ] Replace all QueryBuilder with SecureRepository methods
- [ ] Add `tenantId: user.tenantId` to create operations
- [ ] Add `createdBy: user.id` to create operations
- [ ] Add `updatedBy: user.id` to update operations

#### Phase 3: Test Refactoring (45-60 min)

- [ ] Remove QueryBuilder mocks
- [ ] Add PermissionService mock
- [ ] Update all test method calls (tenantId → user)
- [ ] Add `createMockUser()` helper
- [ ] Update all assertions
- [ ] Run tests and verify all pass

#### Phase 4: Controller Update (15-30 min)

- [ ] Add `@CurrentUser()` decorator import
- [ ] Replace `@Req() req` with `@CurrentUser() user`
- [ ] Update all service calls (tenantId → user)
- [ ] Remove `req.user.tenantId` extractions

#### Phase 5: Verification (15 min)

- [ ] Run TypeScript compiler (0 errors)
- [ ] Run all tests (100% pass)
- [ ] Run service-specific tests
- [ ] Check test coverage (>80%)
- [ ] Manual smoke test if possible

---

## 🔍 Common Patterns & Solutions

### Pattern 1: Simple CRUD Service

**Example**: notification.service.ts

**Methods to refactor:**

- `findAll(tenantId, page, limit)` → `findAll(user, page, limit)`
- `findOne(tenantId, id)` → `findOne(user, id)`
- `create(tenantId, dto)` → `create(user, dto)`
- `update(tenantId, id, dto)` → `update(user, id, dto)`
- `remove(tenantId, id)` → `remove(user, id)`

**Time**: 2-3 hours

### Pattern 2: Service with Complex Queries

**Example**: dashboard.service.ts

**Challenge**: Multiple QueryBuilder usages

**Solution**: Break down complex queries into simpler SecureRepository calls

**BEFORE:**

```typescript
async getDashboardStats(tenantId: string) {
  const orders = await this.orderRepository
    .createQueryBuilder('order')
    .where('order.tenantId = :tenantId', { tenantId })
    .andWhere('order.status = :status', { status: 'completed' })
    .getCount();

  const revenue = await this.orderRepository
    .createQueryBuilder('order')
    .select('SUM(order.totalAmount)', 'total')
    .where('order.tenantId = :tenantId', { tenantId })
    .getRawOne();

  return { orders, revenue: revenue.total };
}
```

**AFTER:**

```typescript
async getDashboardStats(user: User) {
  const orders = await this.orderRepository.count(user, {
    where: { status: 'completed' },
  });

  // For complex aggregations, use SecureRepository with raw query
  const revenue = await this.orderRepository.findRaw(
    user,
    'SELECT SUM(totalAmount) as total FROM orders WHERE tenantId = :tenantId',
    { tenantId: user.tenantId },
  );

  return { orders, revenue: revenue[0]?.total || 0 };
}
```

**Time**: 4-6 hours

### Pattern 3: Service with Relationships

**Example**: workflow.service.ts

**Challenge**: Loading related entities

**Solution**: Use SecureRepository with relations

**BEFORE:**

```typescript
async findOne(tenantId: string, id: string) {
  return this.workflowRepository.findOne({
    where: { id, tenantId },
    relations: ['steps', 'approvers'],
  });
}
```

**AFTER:**

```typescript
async findOne(user: User, id: string) {
  return this.workflowRepository.findOne(user, {
    where: { id },
    relations: ['steps', 'approvers'],
  });
}
```

**Note**: SecureRepository automatically filters related entities by tenant.

**Time**: 3-4 hours

### Pattern 4: Service with Bulk Operations

**Example**: email.service.ts

**Challenge**: Bulk create/update/delete

**Solution**: Use SecureRepository bulk methods

**BEFORE:**

```typescript
async sendBulkEmails(tenantId: string, emails: CreateEmailDto[]) {
  const entities = emails.map(email =>
    this.emailRepository.create({ ...email, tenantId })
  );
  return this.emailRepository.save(entities);
}
```

**AFTER:**

```typescript
async sendBulkEmails(user: User, emails: CreateEmailDto[]) {
  const entities = emails.map(email =>
    this.emailRepository.create({
      ...email,
      tenantId: user.tenantId,
      createdBy: user.id,
    })
  );
  return this.emailRepository.save(user, entities);
}
```

**Time**: 2-3 hours

---

## ⚠️ Common Issues & Solutions

### Issue 1: TypeScript Error - User Type Not Found

**Error:**

```
Cannot find name 'User'
```

**Solution:**

```typescript
import { User } from '@/backend/domains/auth/user/entities/user.entity';
```

### Issue 2: Tests Fail - PermissionService Not Mocked

**Error:**

```
Nest can't resolve dependencies of the NotificationService
```

**Solution:**

```typescript
{
  provide: PermissionService,
  useValue: mockPermissionService,
}
```

### Issue 3: SecureRepository Method Not Found

**Error:**

```
Property 'count' does not exist on type 'SecureRepository<Notification>'
```

**Solution:**
Check SecureRepository implementation for available methods:

- `find(user, options)`
- `findOne(user, options)`
- `save(user, entity)`
- `remove(user, entity)`
- `count(user, options)` (if implemented)

If method doesn't exist, use alternative approach or extend SecureRepository.

### Issue 4: Controller Still Uses tenantId

**Error:**

```
Argument of type 'string' is not assignable to parameter of type 'User'
```

**Solution:**
Update controller to use `@CurrentUser()` decorator:

```typescript
@Get()
async findAll(@CurrentUser() user: User) {
  return this.service.findAll(user);
}
```

---

## 📊 Progress Tracking Template

### Service: [Service Name]

**Estimated Time**: [X hours]  
**Actual Time**: [X hours]

**Phase 1: Preparation** ✅ / ⏳ / ❌

- [ ] Read implementation (15 min)
- [ ] Identify database methods
- [ ] List QueryBuilder usages
- [ ] Review tests

**Phase 2: Service Refactoring** ✅ / ⏳ / ❌

- [ ] Replace Repository injection (15 min)
- [ ] Update method signatures (30 min)
- [ ] Replace find/findOne/save/remove (30 min)
- [ ] Replace QueryBuilder (30 min)

**Phase 3: Test Refactoring** ✅ / ⏳ / ❌

- [ ] Update mocks (15 min)
- [ ] Update test calls (20 min)
- [ ] Fix assertions (20 min)
- [ ] All tests pass (10 min)

**Phase 4: Controller Update** ✅ / ⏳ / ❌

- [ ] Add @CurrentUser() (10 min)
- [ ] Update service calls (10 min)
- [ ] Verify compilation (5 min)

**Phase 5: Verification** ✅ / ⏳ / ❌

- [ ] TypeScript: 0 errors
- [ ] Tests: 100% pass
- [ ] Coverage: >80%
- [ ] Manual test: ✅

**Blockers**: [None / List issues]

**Notes**: [Any observations]

---

## 🚀 Quick Start Commands

```bash
# Start refactoring
cd src/backend/platform/notification

# Open files
code notification.service.ts
code notification.service.spec.ts
code notification.controller.ts

# After refactoring, verify:
npm run build
npm test -- notification.service.spec.ts

# Check coverage
npm test -- notification.service.spec.ts --coverage

# Commit
git add .
git commit -m "refactor(notification): migrate to SecureRepository pattern"
```

---

## 📋 Example: Complete Refactoring

### Before: notification.service.ts

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll(tenantId: string, page: number, limit: number) {
    return this.notificationRepository.find({
      where: { tenantId },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(tenantId: string, id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, tenantId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async create(tenantId: string, createDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create({
      ...createDto,
      tenantId,
    });
    return this.notificationRepository.save(notification);
  }

  async markAsRead(tenantId: string, id: string) {
    const notification = await this.findOne(tenantId, id);
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async remove(tenantId: string, id: string) {
    const notification = await this.findOne(tenantId, id);
    return this.notificationRepository.remove(notification);
  }
}
```

### After: notification.service.ts

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SecureRepository } from '@/common/database/secure-repository';
import { PermissionService } from '@/common/security/permission.service';
import { User } from '@/backend/domains/auth/user/entities/user.entity';

@Injectable()
export class NotificationService {
  private readonly notificationRepository: SecureRepository<Notification>;

  constructor(
    @InjectRepository(Notification)
    repository: Repository<Notification>,
    private readonly permissionService: PermissionService,
  ) {
    this.notificationRepository = new SecureRepository(
      repository,
      permissionService,
      'Notification',
    );
  }

  async findAll(user: User, page: number, limit: number) {
    return this.notificationRepository.find(user, {
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(user: User, id: string) {
    const notification = await this.notificationRepository.findOne(user, {
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async create(user: User, createDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create({
      ...createDto,
      tenantId: user.tenantId,
      createdBy: user.id,
    });
    return this.notificationRepository.save(user, notification);
  }

  async markAsRead(user: User, id: string) {
    const notification = await this.findOne(user, id);
    notification.isRead = true;
    notification.updatedBy = user.id;
    return this.notificationRepository.save(user, notification);
  }

  async remove(user: User, id: string) {
    const notification = await this.findOne(user, id);
    return this.notificationRepository.remove(user, notification);
  }
}
```

---

## ✅ Success Criteria

**Per Service:**

- ✅ All methods use SecureRepository
- ✅ All methods accept User parameter
- ✅ No raw TypeORM queries
- ✅ All tests pass (100%)
- ✅ Test coverage >80%
- ✅ TypeScript compilation: 0 errors
- ✅ Controller updated with @CurrentUser()

**Week 1 Day 2-3 End:**

- ✅ 8-10 services refactored
- ✅ All tests passing
- ✅ Ready for Day 4 integration testing

---

## 📞 Need Help?

**Blocker?** → Escalate to Tech Lead immediately

**Questions?**

- SecureRepository: `src/backend/common/database/secure-repository.ts`
- Example refactored service: `src/backend/domains/inventory/category/product-category.service.ts`
- Test helpers: `src/backend/common/test/test-helpers.ts`

---

**Last Updated**: 2026-03-09  
**Status**: ✅ Ready for Week 1 Day 2-3  
**Estimated Time**: 16 hours (2 days)
