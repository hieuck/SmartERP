---
inclusion: auto
description: 'Autonomous development workflow - AI tự xây dựng SmartERP với minimal human intervention. Self-building, self-healing, self-improving patterns.'
---

# Autonomous Development Workflow

## 📖 TL;DR (Quick Reference)

**Core Principle:** AI tự xây dựng SmartERP - implement, test, refactor, commit autonomously.

**4 Modes:**

1. **Feature Development** - User requests → AI implements → Auto-commit
2. **Bug Fixing** - User reports → AI investigates & fixes → Auto-commit
3. **Refactoring** - AI scans → Detects violations → Refactors → Auto-commit
4. **Continuous Improvement** - Weekly scan → Fix critical → Report others

**Key Rules:**

- ✅ ALWAYS: SecureRepository, PermissionService, Audit Trail, Tests
- ❌ NEVER: Raw TypeORM, Skip permissions, Skip tests, Commit with violations
- 🤖 ASK: Only for breaking changes, security-critical, major architecture decisions

**Success:** 100% architecture compliance, >80% test coverage, 0 critical issues

---

## 🎯 Mục Tiêu

AI tự động xây dựng và cải thiện SmartERP với minimal human intervention.

## 🤖 Autonomous Development Principles

### 1. Self-Building

- AI tự implement features từ high-level requirements
- AI tự break down tasks
- AI tự verify và test
- AI tự commit khi pass all checks

### 2. Self-Healing

- AI tự detect architecture violations
- AI tự refactor code sai
- AI tự fix bugs
- AI tự improve code quality

### 3. Self-Improving

- AI tự scan codebase for issues
- AI tự suggest improvements
- AI tự optimize performance
- AI tự update documentation

## 📋 Workflow Modes

### Mode 1: Feature Development (Autonomous)

**Trigger:** User requests new feature

**Executable Workflow:**

#### Step 1: Analyze Requirements

```
User request: "Implement [Feature Name]"
    ↓
Parse requirements:
- What: Feature description
- Entities: Data models needed
- Operations: CRUD operations
- Permissions: Who can access
- Tests: What to test
```

#### Step 2: Break Down Tasks

**Create task checklist:**

```markdown
Feature: [Feature Name]

Backend Tasks:

- [ ] Create [Entity] entity with SecureRepository
- [ ] Implement [Service] with CRUD operations
- [ ] Add PermissionService injection
- [ ] Create [Controller] with REST endpoints
- [ ] Add permission guards

Frontend Tasks:

- [ ] Create [List] component
- [ ] Create [Detail] component
- [ ] Create [Form] component
- [ ] Add API integration
- [ ] Add route registration

Testing Tasks:

- [ ] Unit tests for service
- [ ] Unit tests for controller
- [ ] Integration tests for API
- [ ] E2E tests for user workflows

Documentation:

- [ ] API documentation
- [ ] Component documentation
```

#### Step 3: Implement Backend

**Entity Template:**

```typescript
@Entity()
export class [EntityName] extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Audit trail (REQUIRED)
  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Service Template:**

```typescript
@Injectable()
export class [ServiceName] {
  constructor(
    @InjectSecureRepository([Entity])
    private repository: SecureRepository<[Entity]>,
    private permissionService: PermissionService,
  ) {}

  async findAll() {
    await this.permissionService.checkPermission('[resource]', 'read');
    return this.repository.find();
  }

  async create(dto: Create[Entity]Dto) {
    await this.permissionService.checkPermission('[resource]', 'create');
    return this.repository.create(dto);
  }
}
```

**Controller Template:**

```typescript
@Controller('[resource]')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class [ControllerName] {
  constructor(private service: [ServiceName]) {}

  @Get()
  @RequirePermission('[resource]', 'read')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @RequirePermission('[resource]', 'create')
  create(@Body() dto: Create[Entity]Dto) {
    return this.service.create(dto);
  }
}
```

#### Step 4: Implement Tests

**Service Test Template:**

```typescript
describe('[ServiceName]', () => {
  let service: [ServiceName];
  let repository: MockType<SecureRepository<[Entity]>>;
  let permissionService: MockType<PermissionService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        [ServiceName],
        {
          provide: getSecureRepositoryToken([Entity]),
          useFactory: mockSecureRepository,
        },
        {
          provide: PermissionService,
          useFactory: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get([ServiceName]);
    repository = module.get(getSecureRepositoryToken([Entity]));
    permissionService = module.get(PermissionService);
  });

  it('should check permissions before create', async () => {
    await service.create(mockDto);
    expect(permissionService.checkPermission).toHaveBeenCalledWith('[resource]', 'create');
  });
});
```

#### Step 5: Verify Architecture Compliance

**Checklist:**

- [ ] ✅ Uses SecureRepository (not raw Repository)
- [ ] ✅ Injects PermissionService
- [ ] ✅ Has audit trail fields
- [ ] ✅ Tenant isolation automatic
- [ ] ✅ Has unit tests
- [ ] ✅ Has integration tests
- [ ] ✅ Permission checks in place

#### Step 6: Run Tests

```bash
# Run all tests
npm test

# Check coverage
npm run test:coverage

# Verify >80% coverage
```

#### Step 7: Auto-Commit

**If all checks pass:**

```bash
git add .
git commit -m "feat: implement [feature-name]

- Added [Entity] entity with SecureRepository
- Implemented [Service] with CRUD + RBAC
- Created [Controller] with REST endpoints
- Added comprehensive tests (coverage: XX%)
- Architecture compliance: 100%"
```

---

**No human intervention needed unless:**

- Critical architectural decision
- Breaking changes
- Security concerns

### Mode 2: Bug Fixing (Autonomous)

**Trigger:** User reports bug

**Workflow:**

```
User: "Orders not updating in real-time"
    ↓
AI: Investigate root cause
    - Check backend (cache, queries, API)
    - Check frontend (reactivity, state)
    - Check infrastructure (network, CORS)
    - Check security (tenant context)
    ↓
AI: Identify root cause
    ↓
AI: Implement fix
    ↓
AI: Add regression test
    ↓
AI: Verify fix works
    ↓
AI: Auto-commit
    ↓
Done: Bug fixed with test coverage
```

### Mode 3: Refactoring (Autonomous)

**Trigger:** Detect code violations

**Executable Workflow:**

#### Step 1: Scan Modified Files

```bash
# List modified backend files
git status --short | grep "src/backend.*\.(service|controller|entity)\.ts$"
```

#### Step 2: Read Exception List

```bash
# Get legacy files
cat .kiro/architecture-exceptions.json | jq -r '.exemptFiles[].path'
```

#### Step 3: Check Each File for Violations

**For each modified file NOT in exception list:**

```typescript
// Violation patterns to check:
const violations = {
  // ❌ Raw TypeORM Repository
  rawRepository: /@InjectRepository\(|Repository<.*>/,

  // ❌ Missing PermissionService
  noPermissionService: !/private.*permissionService.*PermissionService/,

  // ❌ Missing audit trail
  noAuditTrail: !/@Column\(\)\s+createdBy|@Column\(\)\s+updatedBy/,

  // ❌ Missing SecureRepository
  noSecureRepository: !/@InjectSecureRepository\(|SecureRepository</,
};
```

#### Step 4: Refactor Violations

**Pattern 1: Replace Raw Repository**

```typescript
// ❌ BEFORE (violation):
constructor(
  @InjectRepository(Order)
  private orderRepository: Repository<Order>,
) {}

// ✅ AFTER (compliant):
constructor(
  @InjectSecureRepository(Order)
  private orderRepository: SecureRepository<Order>,
) {}
```

**Pattern 2: Add PermissionService**

```typescript
// ✅ Add to constructor:
constructor(
  @InjectSecureRepository(Order)
  private orderRepository: SecureRepository<Order>,
  private permissionService: PermissionService, // ADD THIS
) {}

// ✅ Add permission checks:
async create(dto: CreateOrderDto) {
  await this.permissionService.checkPermission('orders', 'create'); // ADD THIS
  return this.orderRepository.create(dto);
}
```

**Pattern 3: Add Audit Trail**

```typescript
// ✅ Add to entity:
@Column()
createdBy: string;

@Column()
updatedBy: string;

@CreateDateColumn()
createdAt: Date;

@UpdateDateColumn()
updatedAt: Date;
```

#### Step 5: Handle Legacy Files

**If file IS in exception list:**

```typescript
// Add TODO comment:
// TODO: Refactor to SecureRepository pattern
// Legacy code - scheduled for refactoring by 2026-06-30
// See: .kiro/architecture-exceptions.json
```

#### Step 6: Verify

```bash
# Run tests for modified files
npm test -- <file>.spec.ts

# Check for regressions
npm run test:coverage
```

#### Step 7: Auto-Commit

**If all tests pass:**

```bash
git add .
git commit -m "refactor: migrate to SecureRepository pattern

- Replaced raw TypeORM Repository with SecureRepository
- Added PermissionService injection
- Added audit trail fields
- All tests passing"
```

**If any test fails:**

```
STOP: Report failures and do not commit
```

---

**Checklist for Mode 3:**

- [ ] Scanned modified files
- [ ] Checked exception list
- [ ] Identified violations
- [ ] Refactored non-legacy code
- [ ] Added TODOs for legacy code
- [ ] Ran tests
- [ ] All tests passed
- [ ] Auto-committed (or reported failures)

### Mode 4: Continuous Improvement (Scheduled)

**Trigger:** Weekly or on-demand

**Workflow:**

```
AI: Health check codebase
    ↓
AI: Identify issues:
    - Architecture violations
    - Security vulnerabilities
    - Performance bottlenecks
    - Missing tests
    - Code smells
    ↓
AI: Prioritize by severity
    ↓
AI: Auto-fix critical/high
    ↓
AI: Report medium/low
    ↓
AI: Update metrics
    ↓
Done: Codebase improved
```

## 🔧 Implementation Rules

### ALWAYS Follow These Rules:

1. **SecureRepository Pattern**

   ```typescript
   // ✅ CORRECT
   constructor(
     @InjectSecureRepository(Order)
     private orderRepository: SecureRepository<Order>,
   ) {}

   // ❌ WRONG
   constructor(
     @InjectRepository(Order)
     private orderRepository: Repository<Order>,
   ) {}
   ```

2. **PermissionService Injection**

   ```typescript
   // ✅ CORRECT
   constructor(
     private permissionService: PermissionService,
   ) {}

   async create(dto: CreateOrderDto) {
     await this.permissionService.checkPermission('orders', 'create');
     // ... implementation
   }
   ```

3. **Audit Trail**

   ```typescript
   // ✅ CORRECT
   @Column()
   createdBy: string;

   @Column()
   updatedBy: string;

   @CreateDateColumn()
   createdAt: Date;

   @UpdateDateColumn()
   updatedAt: Date;
   ```

4. **Tenant Isolation**

   ```typescript
   // ✅ CORRECT - SecureRepository handles this automatically
   const orders = await this.orderRepository.find();
   // Only returns orders for current tenant
   ```

5. **Tests Required**

   ```typescript
   // ✅ CORRECT - Always write tests
   describe('OrderService', () => {
     it('should create order with tenant isolation', async () => {
       // Test implementation
     });

     it('should check permissions before create', async () => {
       // Test implementation
     });
   });
   ```

## 🚫 NEVER Do These:

1. ❌ Use raw TypeORM Repository
2. ❌ Skip permission checks
3. ❌ Forget audit trail
4. ❌ Ignore tenant isolation
5. ❌ Skip tests
6. ❌ Proceed with architecture violations
7. ❌ Commit without verification

## 🎯 Decision Framework

### When to Ask Human:

**ASK if:**

- Breaking changes required
- Major architectural decision
- Security-critical changes
- Data migration needed
- Third-party integration

**DON'T ASK if:**

- Standard CRUD implementation
- Bug fixes
- Refactoring violations
- Adding tests
- Documentation updates
- Code style improvements

### When to Auto-Commit:

**COMMIT if:**

- ✅ All tests pass
- ✅ Architecture compliance verified
- ✅ No breaking changes
- ✅ Security checks pass
- ✅ Code quality meets standards

**DON'T COMMIT if:**

- ❌ Any test fails
- ❌ Architecture violations exist
- ❌ Breaking changes detected
- ❌ Security issues found

## 📊 Metrics & Tracking

### Track These Metrics:

1. **Architecture Compliance**
   - % of files using SecureRepository
   - % of controllers with PermissionService
   - % of entities with audit trail
   - Target: 100% for new code

2. **Test Coverage**
   - Unit test coverage
   - Integration test coverage
   - E2E test coverage
   - Target: >80%

3. **Code Quality**
   - Code smells count
   - Security vulnerabilities
   - Performance issues
   - Target: 0 critical issues

4. **Development Velocity**
   - Features implemented per week
   - Bugs fixed per week
   - Refactoring progress
   - Target: Continuous improvement

## 🔄 Continuous Improvement Loop

```
Week 1:
- Implement features autonomously
- Fix bugs autonomously
- Refactor violations autonomously
    ↓
Week 2:
- Run health check
- Identify remaining issues
- Prioritize and fix
    ↓
Week 3:
- Improve test coverage
- Optimize performance
- Update documentation
    ↓
Week 4:
- Review metrics
- Adjust strategies
- Plan next improvements
    ↓
Repeat
```

## 🚀 Getting Started

### Step 1: Enable Autonomous Hooks

Hooks đã được tạo:

- `autonomous-development.kiro.hook` - Main autonomous workflow
- `auto-refactor-violations.kiro.hook` - Auto-refactor after tasks
- `continuous-improvement.kiro.hook` - Weekly health checks

### Step 2: Set Expectations

Tell AI:

```
"From now on, work autonomously:
- Implement features without asking
- Fix bugs immediately
- Refactor violations automatically
- Only ask for critical decisions"
```

### Step 3: Monitor Progress

Check metrics:

- Architecture compliance score
- Test coverage
- Code quality
- Development velocity

### Step 4: Adjust as Needed

- Review autonomous decisions
- Provide feedback
- Update rules if needed
- Improve prompts

## 💡 Example Autonomous Sessions

### Session 1: Feature Implementation

```
User: "Implement Inventory Management module"

AI (autonomous):
1. ✅ Analyzed requirements
2. ✅ Created InventoryItem entity with SecureRepository
3. ✅ Implemented InventoryService with RBAC
4. ✅ Created InventoryController with permissions
5. ✅ Added unit tests (coverage: 85%)
6. ✅ Added integration tests
7. ✅ Verified architecture compliance
8. ✅ All tests pass
9. ✅ Auto-committed

Result: Feature complete in 1 session, no human intervention.
```

### Session 2: Bug Fix

```
User: "Products not showing for tenant B"

AI (autonomous):
1. ✅ Investigated: ProductService using raw Repository
2. ✅ Identified: Missing SecureRepository pattern
3. ✅ Refactored: Replaced with SecureRepository
4. ✅ Added regression test
5. ✅ Verified: Tenant isolation works
6. ✅ All tests pass
7. ✅ Auto-committed

Result: Bug fixed with proper pattern, tested, committed.
```

### Session 3: Refactoring

```
AI (autonomous scan):
1. ✅ Scanned codebase
2. ✅ Found 5 files with violations
3. ✅ Checked exception list
4. ✅ Refactored 3 new files immediately
5. ✅ Added TODO for 2 legacy files
6. ✅ All tests pass
7. ✅ Auto-committed

Result: 3 violations fixed, 2 documented for future.
```

## 🎯 Success Criteria

SmartERP is successfully self-building when:

1. ✅ Features implemented autonomously
2. ✅ Bugs fixed autonomously
3. ✅ Code refactored autonomously
4. ✅ Tests written autonomously
5. ✅ Architecture compliance: 100% (new code)
6. ✅ Test coverage: >80%
7. ✅ Zero critical issues
8. ✅ Consistent patterns across codebase
9. ✅ Documentation up-to-date
10. ✅ Continuous improvement

## 📚 Resources

- Architecture patterns: `.kiro/steering/multi-tenant-architecture-patterns.md`
- Testing patterns: `.kiro/skills/backend-testing-patterns.md`
- SecureRepository: `.kiro/skills/secure-repository-pattern.md`
- Exception list: `.kiro/architecture-exceptions.json`

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-09  
**Status:** ✅ Active  
**Mode:** Fully Autonomous
