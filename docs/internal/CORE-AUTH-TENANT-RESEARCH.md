# Pattern 5: Core Auth & Tenant - Research Findings

## 🎯 Research Objective

Understand Odoo/ERPNext multi-tenancy patterns and design refactor approach for SmartERP's core auth & tenant services.

---

## 📚 Odoo Multi-Tenancy Research

### Architecture

- **Multi-company in single database**
- Company-dependent fields with `company_id` column
- Users can login to multiple companies
- Shared infrastructure, logical isolation

### Key Patterns

```python
# Odoo company isolation
record = self.env['sale.order'].search([
    ('company_id', '=', self.env.company.id)
])

# Multi-company access
user.company_ids  # List of companies user can access
```

### Strengths

- ✅ Efficient resource usage (single DB)
- ✅ Easy cross-company reporting
- ✅ Flexible user access (multiple companies)

### Weaknesses

- ⚠️ Weaker isolation (logical only)
- ⚠️ Risk of data leakage if not careful

---

## 📚 ERPNext Multi-Tenancy Research

### Architecture

- **Site-per-tenant architecture**
- Separate database per tenant
- Complete isolation at DB level
- Bench manages multiple sites

### Key Patterns

```python
# ERPNext site isolation
frappe.init(site='tenant1.example.com')
frappe.db.get_value('Sales Order', filters)

# Each site has own DB
bench new-site tenant1.example.com
```

### Strengths

- ✅ Strong isolation (separate DBs)
- ✅ Independent scaling per tenant
- ✅ Easy backup/restore per tenant

### Weaknesses

- ⚠️ Higher resource usage
- ⚠️ Complex cross-tenant operations
- ⚠️ More infrastructure overhead

---

## 🏗️ SmartERP Current Architecture

### Hybrid Approach

- **Single database** (Odoo-style infrastructure)
- **tenantId column isolation** (ERPNext-style isolation)
- SecureRepository enforces tenant isolation
- PermissionService checks access rights

### Current Implementation

```typescript
// SecureRepository pattern
const orders = await secureRepo.find(user, {
  where: { status: 'pending' },
});
// Automatically adds: where.tenantId = user.tenantId
```

### Strengths

- ✅ Strong isolation with single DB efficiency
- ✅ Automatic tenant filtering
- ✅ Audit trail built-in
- ✅ Permission checks integrated

---

## 🔍 Pattern 5 Services Analysis

### Services Overview

| Service                 | Category          | Description       | Tenant Relationship            |
| ----------------------- | ----------------- | ----------------- | ------------------------------ |
| user.service.ts         | User Management   | Profile, password | Users BELONG TO tenant         |
| subscription.service.ts | Subscription      | Plans, billing    | Subscriptions BELONG TO tenant |
| auth.service.ts         | Authentication    | Login, register   | MIXED (see below)              |
| tenant.service.ts       | Tenant Management | CRUD tenants      | MANAGES tenants                |

---

## 📊 Detailed Service Analysis

### 1. user.service.ts

**Current State:**

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getProfile(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId, status: 'active' },
    });
  }
}
```

**Issues:**

- ❌ Raw TypeORM Repository
- ❌ No tenant isolation
- ❌ No permission checks
- ❌ No audit trail

**Refactor Approach:**

- ✅ Add SecureRepository<UserEntity>
- ✅ Add PermissionService
- ✅ User queries automatically filtered by tenantId
- ✅ Standard Category A refactor

**Methods to Refactor:**

- `getProfile(userId)` → Add user context, use secureRepo
- `updateProfile(userId, dto)` → Add user context, permission check
- `changePassword(userId, dto)` → Add user context, permission check

---

### 2. subscription.service.ts

**Current State:**

```typescript
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async getSubscription(tenantId: string) {
    return this.tenantRepository.findOne({
      where: { id: tenantId },
    });
  }
}
```

**Issues:**

- ❌ Raw TypeORM Repository
- ❌ Queries Tenant entity directly
- ❌ No permission checks

**Refactor Approach:**

- ✅ Add SecureRepository<Tenant>
- ✅ Add PermissionService
- ✅ Subscription operations filtered by user.tenantId
- ✅ Standard Category A refactor

**Methods to Refactor:**

- `getSubscription(tenantId)` → Use user.tenantId, secureRepo
- `upgradeSubscription(tenantId, dto)` → Permission check, secureRepo
- `cancelSubscription(tenantId)` → Permission check, secureRepo
- `checkExpiredSubscriptions()` → System operation (no tenant filter)

**Special Case:**

- `checkExpiredSubscriptions()` is a SYSTEM operation (cron job)
- Should query ALL tenants across system
- Need special handling: Use raw repo OR system user context

---

### 3. auth.service.ts

**Current State:**

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async validateUser(email: string, password: string) {
    // Query user by email
  }

  async registerTenant(dto: RegisterTenantDto) {
    // CREATE new tenant + admin user
  }
}
```

**Issues:**

- ❌ Raw TypeORM Repositories
- ⚠️ MIXED operations: Some manage tenants, some query users

**Refactor Approach - HYBRID:**

**Category A Methods (Query tenant-owned data):**

- `validateUser(email, password)` → SecureRepository<UserEntity>
- `login(user)` → Already has user context
- `findByEmail(email)` → SecureRepository<UserEntity>
- `refreshToken(token)` → Query user, use SecureRepository
- `verifyEmail(token)` → Query user, use SecureRepository
- `forgotPassword(email)` → Query user, use SecureRepository
- `resetPassword(token, password)` → Query user, use SecureRepository

**Category B Methods (Manage tenants):**

- `registerTenant(dto)` → CREATES tenant (special case)
  - Cannot use SecureRepository (no tenant context yet)
  - Use raw repository OR system context
  - This is TENANT CREATION, not tenant-scoped operation

**Special Handling:**

```typescript
// Option 1: Keep raw repo for tenant creation
async registerTenant(dto: RegisterTenantDto) {
  // Use this.tenantRepository (raw) for creating tenant
  const tenant = await this.tenantRepository.save(newTenant);

  // Use secureUserRepo for creating admin user (with new tenant context)
  const adminUser = await this.secureUserRepo.save(systemUser, newUser);
}

// Option 2: Use system user context
const SYSTEM_USER = { tenantId: null, role: 'system' };
const tenant = await this.secureTenantRepo.save(SYSTEM_USER, newTenant);
```

---

### 4. tenant.service.ts

**Current State:**

```typescript
@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async create(dto: CreateTenantDto) {
    // CREATE tenant
  }

  async findAll() {
    // List ALL tenants (admin operation)
  }

  async findOne(user: User) {
    // Get user's tenant
  }
}
```

**Issues:**

- ❌ Raw TypeORM Repository
- ⚠️ Service MANAGES tenants, not tenant-scoped

**Refactor Approach - SPECIAL CASE:**

**Category B Methods (Manage tenants):**

- `create(dto)` → Creates tenant (system operation)
- `findAll()` → Lists all tenants (admin operation)
- `findByCode(code)` → Finds any tenant (system operation)
- `count()` → Counts all tenants (admin operation)
- `findByStatus(status)` → Finds tenants by status (admin operation)

**Category A Methods (Tenant-scoped):**

- `findOne(user)` → Gets user's own tenant
- `update(user, dto)` → Updates user's own tenant
- `remove(user)` → Deletes user's own tenant
- `suspend(user)` → Suspends user's own tenant
- `activate(user)` → Activates user's own tenant
- `cancel(user)` → Cancels user's own tenant
- `getUsersByTenant(tenantId)` → Gets users in tenant
- `getUsageReport(user)` → Gets usage for user's tenant
- `updateStorage(user, storage)` → Updates user's tenant storage

**Hybrid Approach:**

```typescript
@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>, // Keep for system ops
    private readonly secureTenantRepo: SecureRepository<Tenant>, // Add for tenant-scoped ops
    private readonly permissionService: PermissionService,
  ) {}

  // System operation - use raw repo
  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  // Tenant-scoped operation - use SecureRepository
  async findOne(user: User): Promise<Tenant> {
    await this.permissionService.canRead(user, 'tenant');
    return this.secureTenantRepo.findOne(user, {
      where: { id: user.tenantId },
    });
  }
}
```

---

## 🎯 Refactor Strategy Summary

### Category A: Standard SecureRepository Refactor

**Services:** user.service.ts, subscription.service.ts (most methods), auth.service.ts (most methods)

**Steps:**

1. Add SecureRepository + PermissionService to constructor
2. Replace raw repo calls with secureRepo calls
3. Add permission checks (canRead, canWrite, canDelete)
4. Update method signatures to accept User context
5. Update tests with SecureRepository mocks

### Category B: Hybrid Approach

**Services:** tenant.service.ts, auth.service.ts (registerTenant)

**Steps:**

1. Keep raw repository for system operations
2. Add SecureRepository for tenant-scoped operations
3. Clearly separate system vs tenant-scoped methods
4. Document which methods use which repository
5. Add permission checks for tenant-scoped operations

### Special Cases

**1. System Operations (No Tenant Context)**

- `subscription.service.ts::checkExpiredSubscriptions()` - Cron job
- `tenant.service.ts::findAll()` - Admin operation
- `tenant.service.ts::count()` - Admin operation
- `auth.service.ts::registerTenant()` - Tenant creation

**Solution:** Use raw repository OR create SYSTEM_USER context

**2. Tenant Creation**

- `auth.service.ts::registerTenant()` - Creates new tenant
- Cannot use SecureRepository (no tenant exists yet)

**Solution:** Use raw repository for tenant creation, then use SecureRepository for admin user creation with new tenant context

---

## 📋 Implementation Plan

### Phase 1: Simple Services (2-3 hours)

1. ✅ user.service.ts - Standard Category A refactor
2. ✅ subscription.service.ts - Category A with system operation handling

### Phase 2: Complex Services (3-4 hours)

3. ✅ auth.service.ts - Hybrid approach (Category A + B)
4. ✅ tenant.service.ts - Hybrid approach (system + tenant-scoped)

### Phase 3: Testing (2-3 hours)

- Update all test files with SecureRepository mocks
- Test system operations
- Test tenant-scoped operations
- Verify tenant isolation

### Phase 4: Documentation (1 hour)

- Update REFACTORING-STATUS.md
- Document hybrid approach patterns
- Add examples for future reference

**Total Estimated Time:** 8-11 hours

---

## ✅ Research Complete

**Next Steps:**

1. Execute Phase 1: Refactor user.service.ts
2. Execute Phase 1: Refactor subscription.service.ts
3. Execute Phase 2: Refactor auth.service.ts
4. Execute Phase 2: Refactor tenant.service.ts
5. Update REFACTORING-STATUS.md

**Key Decisions:**

- ✅ Use hybrid approach for tenant management services
- ✅ Keep raw repository for system operations
- ✅ Use SecureRepository for tenant-scoped operations
- ✅ Document special cases clearly

---

**Research Duration:** ~60 minutes
**Confidence Level:** HIGH
**Ready to Execute:** YES ✅
