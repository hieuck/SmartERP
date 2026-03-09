---
inclusion: auto
description: 'General multi-tenant architecture patterns for secure, scalable SaaS applications. Covers tenant isolation, permission system, audit trail, caching, naming conventions, and testing strategies. Domain-agnostic and portable to any multi-tenant app.'
---

# Multi-Tenant Architecture Patterns

**Universal patterns for building secure, scalable multi-tenant applications**

---

## 🎯 Overview

This guide provides battle-tested patterns for multi-tenant architecture that work across domains:

- SaaS applications
- B2B platforms
- Enterprise systems
- ERP/CRM systems
- Any application serving multiple organizations

**Core Principles:**

1. **Tenant Isolation** - Data never leaks between tenants
2. **Permission System** - Fine-grained access control
3. **Audit Trail** - Track all changes
4. **Performance** - Efficient caching and queries
5. **Testability** - Easy to test and maintain

---

## 🏗️ Core Patterns

### 1. Tenant Isolation Pattern

**Problem**: Multiple organizations share the same database, but data must never leak.

**Solution**: SecureRepository pattern with automatic tenant filtering

```typescript
// ❌ UNSAFE - No tenant isolation
async findAll(): Promise<Resource[]> {
  return this.resourceRepository.find();
}

// ✅ SAFE - Automatic tenant isolation
async findAll(user: User): Promise<Resource[]> {
  return this.secureResourceRepo.find(user, {
    order: { createdAt: 'DESC' },
  });
}
```

**Key Points:**

- Every query automatically filters by `tenantId`
- User object carries tenant context
- No manual tenant filtering needed
- Impossible to accidentally query cross-tenant

---

### 2. Permission System Pattern

**Problem**: Different users have different access levels within a tenant.

**Solution**: Role-Based Access Control (RBAC) with PermissionService

```typescript
@Injectable()
export class ResourceService {
  private readonly secureResourceRepo: SecureRepository<Resource>;

  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureResourceRepo = new SecureRepository(
      resourceRepository,
      permissionService,
      'Resource', // Entity name for permission checks
    );
  }

  // Permission checked automatically
  async findById(user: User, id: string): Promise<Resource> {
    // Checks: user.canRead('Resource') + tenantId match
    return this.secureResourceRepo.findOne(user, {
      where: { id },
    });
  }
}
```

**Permission Checks:**

- `canRead(user, entityName)` - Before find/findOne
- `canWrite(user, entityName)` - Before save/update
- `canDelete(user, entityName)` - Before remove

---

### 3. Audit Trail Pattern

**Problem**: Need to track who created/modified/deleted data for compliance.

**Solution**: Automatic audit fields on all entities

```typescript
@Entity()
export class Resource extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Tenant isolation
  @Column()
  tenantId: string;

  // Audit trail
  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete
  @Column({ nullable: true })
  deletedAt?: Date;

  @Column({ nullable: true })
  deletedBy?: string;
}
```

**Always set audit fields:**

```typescript
// On create
const resource = this.resourceRepository.create({
  ...data,
  tenantId: user.tenantId,
  createdBy: user.id,
  updatedBy: user.id,
});

// On update
resource.updatedBy = user.id;

// On soft delete
resource.deletedAt = new Date();
resource.deletedBy = user.id;
```

---

### 4. Caching Strategy Pattern

**Problem**: Database queries are slow, especially for frequently accessed data.

**Solution**: Multi-level caching with automatic invalidation

```typescript
async findById(user: User, id: string): Promise<Resource> {
  const cacheKey = `resource:${id}`;

  // Try cache first
  const cached = await this.cacheService.get<Resource>(cacheKey);
  if (cached) return cached;

  // Cache miss - fetch from database
  const resource = await this.secureResourceRepo.findOne(user, {
    where: { id },
  });

  // Cache for 5 minutes
  await this.cacheService.set(cacheKey, resource, CacheTTL.MEDIUM);

  return resource;
}

async update(user: User, id: string, data: UpdateDto): Promise<Resource> {
  const resource = await this.findById(user, id);
  Object.assign(resource, { ...data, updatedBy: user.id });

  const updated = await this.secureResourceRepo.save(user, resource);

  // Invalidate cache
  await this.cacheService.del(`resource:${id}`);
  await this.cacheService.del(`resources:${user.tenantId}`);

  return updated;
}
```

**Cache TTL Guidelines:**

- `CacheTTL.SHORT` (1 min) - Frequently changing data
- `CacheTTL.MEDIUM` (5 min) - Moderate change rate
- `CacheTTL.LONG` (15 min) - Rarely changing data

---

### 5. Naming Conventions Pattern

**Consistency is key for maintainability**

**Entities**: PascalCase

```typescript
class User {}
class Organization {}
class SalesOrder {}
```

**Service Methods**: camelCase with clear prefixes

```typescript
findAllResources();
findResourceById();
createResource();
updateResource();
deleteResource();
```

**Controller Routes**: kebab-case

```typescript
GET    /api/resources
GET    /api/resources/:id
POST   /api/resources
PUT    /api/resources/:id
DELETE /api/resources/:id
```

---

### 6. Document Numbering Pattern

**Problem**: Need unique, sequential identifiers for business documents.

**Solution**: Prefix + Year + Sequence format

```typescript
// Format: {PREFIX}-{YEAR}-{SEQUENCE}
// Examples:
// SO-2024-00001 (Sales Order)
// PO-2024-00001 (Purchase Order)
// INV-2024-00001 (Invoice)

async generateDocumentNumber(
  prefix: string,
  tenantId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const sequence = await this.getNextSequence(prefix, year, tenantId);
  return `${prefix}-${year}-${sequence.toString().padStart(5, '0')}`;
}
```

---

### 7. Status Management Pattern

**Problem**: Entities have complex state transitions with business rules.

**Solution**: Enum + State Machine pattern

```typescript
enum OrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Valid transitions
const VALID_TRANSITIONS = {
  [OrderStatus.DRAFT]: [OrderStatus.SUBMITTED, OrderStatus.CANCELLED],
  [OrderStatus.SUBMITTED]: [OrderStatus.APPROVED, OrderStatus.CANCELLED],
  [OrderStatus.APPROVED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

async changeStatus(
  user: User,
  id: string,
  newStatus: OrderStatus,
): Promise<Order> {
  const order = await this.findById(user, id);

  // Validate transition
  if (!VALID_TRANSITIONS[order.status].includes(newStatus)) {
    throw new BadRequestException(
      `Cannot transition from ${order.status} to ${newStatus}`,
    );
  }

  order.status = newStatus;
  order.updatedBy = user.id;

  return this.secureOrderRepo.save(user, order);
}
```

---

### 8. Testing Pattern

**Problem**: Tests are hard to write and maintain with complex security logic.

**Solution**: Mock SecureRepository, not raw TypeORM

```typescript
describe('ResourceService', () => {
  let service: ResourceService;

  const mockUser = {
    id: 'user-1',
    tenantId: 'tenant-1',
    role: 'user',
  };

  const mockResource = {
    id: '1',
    name: 'Resource 1',
    tenantId: 'tenant-1',
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ResourceService,
        {
          provide: getRepositoryToken(Resource),
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
      ],
    }).compile();

    service = module.get<ResourceService>(ResourceService);

    // Mock SecureRepository methods
    jest.spyOn(service['secureResourceRepo'], 'find').mockResolvedValue([mockResource]);

    jest.spyOn(service['secureResourceRepo'], 'findOne').mockResolvedValue(mockResource);

    jest
      .spyOn(service['secureResourceRepo'], 'save')
      .mockImplementation(async (_user, data) => ({ ...mockResource, ...data }));
  });

  it('should find all with tenant isolation', async () => {
    const result = await service.findAll(mockUser);
    expect(result).toEqual([mockResource]);
  });
});
```

**Key Points:**

- Mock `SecureRepository` methods: `find()`, `findOne()`, `save()`, `remove()`
- DON'T mock raw TypeORM: `createQueryBuilder()`, `update()`, `delete()`
- Mock `PermissionService` for all tests

---

### 9. API Response Format Pattern

**Consistency across all endpoints**

**Success Response:**

```typescript
{
  success: true,
  data: { id: '1', name: 'Resource' },
  message: 'Resource created successfully' // optional
}
```

**Error Response:**

```typescript
{
  success: false,
  error: 'Resource not found',
  statusCode: 404
}
```

**Pagination Response:**

```typescript
{
  success: true,
  data: [...],
  pagination: {
    total: 100,
    page: 1,
    limit: 20,
    totalPages: 5
  }
}
```

---

### 10. Workflow & Approval Pattern

**Problem**: Business processes require multi-step approvals.

**Solution**: Workflow service with configurable steps

```typescript
interface WorkflowStep {
  id: string;
  name: string;
  approverRole: string;
  order: number;
}

interface Workflow {
  id: string;
  entityType: string; // 'Order', 'Invoice', etc.
  steps: WorkflowStep[];
}

async submitForApproval(
  user: User,
  entityId: string,
  entityType: string,
): Promise<void> {
  const workflow = await this.getWorkflow(entityType, user.tenantId);
  const firstStep = workflow.steps.find(s => s.order === 1);

  await this.createApprovalRequest({
    entityId,
    entityType,
    workflowId: workflow.id,
    currentStep: firstStep.id,
    requestedBy: user.id,
    tenantId: user.tenantId,
  });
}
```

---

## ✅ Implementation Checklist

When implementing a new service:

- [ ] Constructor creates SecureRepository instance
- [ ] All methods accept `User` parameter (not `tenantId` string)
- [ ] All queries use SecureRepository (not raw repository)
- [ ] Audit trail fields set on create/update/delete
- [ ] Cache invalidation on write operations
- [ ] Tests mock SecureRepository methods
- [ ] Tests verify permission checks
- [ ] Tests verify tenant isolation
- [ ] No direct repository queries
- [ ] Soft delete implemented (if applicable)

---

## 🎓 Adapt to Your Domain

This guide is domain-agnostic. To adapt:

1. **Replace generic terms** with your domain:
   - Resource → Customer, Product, Order, etc.
   - Organization → Company, Workspace, Team, etc.

2. **Add domain-specific patterns**:
   - E-commerce: Inventory, Pricing, Shipping
   - Healthcare: HIPAA compliance, Patient records
   - Finance: Transactions, Reconciliation
   - ERP: Manufacturing, Procurement, Accounting

3. **Extend base patterns**:
   - Keep core security (tenant isolation, permissions)
   - Add domain workflows
   - Add domain validations

---

## 📚 Related Guides

- **Implementation**: See `secure-repository-pattern` skill for detailed code
- **Testing**: See `backend-testing-patterns` skill
- **Migration**: See `.kiro/steering/migration-guide.md`
- **Troubleshooting**: See `.kiro/steering/troubleshooting-guide.md`

---

**Last Updated**: 2026-03-09  
**Version**: 1.0.0  
**Type**: General (Domain-Agnostic)
