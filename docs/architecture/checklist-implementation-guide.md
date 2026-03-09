# Architecture Review Checklist - Implementation Guide

**Version:** 1.0  
**Date:** 2026-03-09  
**Purpose:** Guide for using the Architecture Review Checklist effectively  
**Audience:** All developers, Tech Lead, Solution Architect

---

## 📋 Overview

This guide explains how to use the [Architecture Review Checklist](./review-checklist.md) at different stages of development to prevent architectural issues before they reach production.

---

## 🎯 When to Use the Checklist

### 1. Pre-Implementation (Before Writing Code)

**Who:** Developer + Solution Architect  
**Time:** 30-60 minutes  
**Goal:** Plan architecture correctly from the start

**Steps:**

1. **Review Requirements**
   - Read feature requirements from PM
   - Identify entities, services, and controllers needed
   - List dependencies (which modules to import)

2. **Check Odoo/ERPNext Patterns**
   - Search: "Odoo [feature-name] architecture"
   - Search: "ERPNext [feature-name] implementation"
   - Document patterns to follow

3. **Design Module Structure**

   ```
   domains/{domain}/
   ├── entities/
   │   └── {entity}.entity.ts
   ├── dto/
   │   ├── create-{entity}.dto.ts
   │   └── update-{entity}.dto.ts
   ├── {entity}.service.ts
   ├── {entity}.controller.ts
   ├── {entity}.module.ts
   └── tests/
       ├── {entity}.service.spec.ts
       └── {entity}.controller.spec.ts
   ```

4. **Plan Dependencies**
   - [ ] Will service inject PermissionService? → Import SecurityModule
   - [ ] Will service cache data? → Import CacheModule
   - [ ] Will service use other services? → Import their modules

5. **Plan Security**
   - [ ] Use SecureRepository for all database queries
   - [ ] Pass user context to all service methods
   - [ ] Implement permission checks

6. **Plan Tests**
   - [ ] Tenant isolation tests
   - [ ] Permission denial tests
   - [ ] Cross-tenant access prevention tests

**Output:** Architecture design document ready for implementation

---

### 2. During Implementation (While Writing Code)

**Who:** Developer  
**Time:** Continuous  
**Goal:** Follow patterns consistently

**Checklist:**

#### Module Configuration

- [ ] SecurityModule imported if service injects PermissionService
- [ ] CacheModule imported if service caches data
- [ ] All dependencies declared in imports array
- [ ] Service exported if other modules need it

**Example:**

```typescript
import { SecurityModule } from '@/common/security/security.module';
import { CacheModule } from '@/common/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    SecurityModule, // ✅ Required
    CacheModule, // ✅ Required
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService], // ✅ Export for other modules
})
export class ProductModule {}
```

#### Service Implementation

- [ ] Use SecureRepository instead of raw TypeORM Repository
- [ ] Pass user context to all methods
- [ ] Implement error handling
- [ ] Add caching for frequently accessed data

**Example:**

```typescript
@Injectable()
export class ProductService {
  private readonly secureProductRepo: SecureRepository<Product>;

  constructor(
    @InjectRepository(Product)
    productRepository: Repository<Product>,
    private readonly permissionService: PermissionService,
    private readonly cacheService: CacheService,
  ) {
    this.secureProductRepo = new SecureRepository(productRepository, permissionService, 'Product');
  }

  async findAll(user: User): Promise<Product[]> {
    // ✅ SecureRepository automatically adds tenant isolation
    return this.secureProductRepo.find(user, {});
  }

  async findById(user: User, id: string): Promise<Product> {
    const cacheKey = `product:${user.tenantId}:${id}`;

    // ✅ Check cache first
    const cached = await this.cacheService.get<Product>(cacheKey);
    if (cached) return cached;

    // ✅ Query database
    const product = await this.secureProductRepo.findOne(user, {
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // ✅ Cache result
    await this.cacheService.set(cacheKey, product, CacheTTL.MEDIUM);

    return product;
  }

  async create(user: User, dto: CreateProductDto): Promise<Product> {
    try {
      // ✅ SecureRepository automatically checks canWrite permission
      return await this.secureProductRepo.save(user, dto);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Product with this SKU already exists');
      }
      throw error;
    }
  }
}
```

#### Test Implementation

- [ ] Mock SecureRepository methods (not TypeORM)
- [ ] Mock PermissionService
- [ ] Test tenant isolation
- [ ] Test permission denial
- [ ] Test cross-tenant access prevention

**Example:**

```typescript
describe('ProductService', () => {
  let service: ProductService;
  let secureRepository: SecureRepository<Product>;
  let permissionService: PermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
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
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    permissionService = module.get<PermissionService>(PermissionService);
  });

  describe('Tenant Isolation', () => {
    it('should only return products for current tenant', async () => {
      const tenant1User = { tenantId: 'tenant1', id: 'user1' };
      const tenant2User = { tenantId: 'tenant2', id: 'user2' };

      jest
        .spyOn(secureRepository, 'find')
        .mockResolvedValueOnce([{ id: '1', name: 'Product 1', tenantId: 'tenant1' }]);

      const products = await service.findAll(tenant1User);

      expect(products).toHaveLength(1);
      expect(products[0].tenantId).toBe('tenant1');
    });
  });

  describe('Permission Checks', () => {
    it('should deny create when user lacks permission', async () => {
      const userWithoutPermission = {
        tenantId: 'tenant1',
        id: 'user1',
        roles: ['viewer'],
      };

      jest.spyOn(permissionService, 'canWrite').mockResolvedValue(false);

      await expect(service.create(userWithoutPermission, { name: 'Product' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
```

---

### 3. Code Review (Before Merging PR)

**Who:** Reviewer (Senior Dev, Tech Lead, or SA)  
**Time:** 15-30 minutes  
**Goal:** Catch issues before merge

**Review Checklist:**

#### Critical Checks (Must Pass)

- [ ] SecurityModule imported when PermissionService used
- [ ] SecureRepository used (no raw TypeORM)
- [ ] User context passed to all service methods
- [ ] Tenant isolation enforced
- [ ] Permission checks implemented

#### High Priority Checks

- [ ] Error handling comprehensive
- [ ] Input validation with DTOs
- [ ] Tests cover security scenarios
- [ ] Documentation complete

#### Medium Priority Checks

- [ ] Caching strategy defined
- [ ] Performance optimized
- [ ] Code follows patterns

**Review Process:**

1. **Run Automated Checks**

   ```bash
   npm run lint
   npm run test
   npm run build
   ```

2. **Manual Code Review**
   - Open PR in GitHub
   - Review each file against checklist
   - Leave comments for issues found

3. **Request Changes or Approve**
   - If critical issues found: Request changes
   - If only minor issues: Approve with comments
   - If no issues: Approve and merge

**Example PR Comment:**

```markdown
## Architecture Review

### ✅ Passed

- SecurityModule imported correctly
- SecureRepository used
- Tests cover tenant isolation

### ❌ Issues Found

1. **CRITICAL:** Missing permission denial test
   - Add test for user without write permission
   - See example in ProductService tests

2. **HIGH:** No error handling in create method
   - Add try-catch for unique constraint violation
   - Throw ConflictException with clear message

3. **MEDIUM:** Missing caching for findById
   - Add cache-aside pattern
   - Use CacheTTL.MEDIUM

### 📝 Recommendations

- Add module documentation comment
- Consider adding index on (tenantId, status)

**Status:** ❌ Request Changes
```

---

### 4. Post-Implementation Audit (After Deployment)

**Who:** QA Engineer + Solution Architect  
**Time:** 1-2 hours  
**Goal:** Verify production quality

**Audit Checklist:**

#### Security Audit

- [ ] Run security scan

  ```bash
  npm run scan:security
  ```

- [ ] Verify tenant isolation in production

  ```bash
  # Test with real tenant data
  curl -H "Authorization: Bearer $TENANT1_TOKEN" \
       https://api.smarterp.com/api/products

  # Should only return tenant1 products
  ```

- [ ] Check audit logs
  ```bash
  # Verify all operations logged
  SELECT * FROM audit_logs
  WHERE entity_type = 'Product'
  ORDER BY created_at DESC
  LIMIT 100;
  ```

#### Performance Audit

- [ ] Check response times

  ```bash
  # Should be < 200ms
  curl -w "@curl-format.txt" \
       -H "Authorization: Bearer $TOKEN" \
       https://api.smarterp.com/api/products
  ```

- [ ] Verify caching working

  ```bash
  # First request: Cache miss
  # Second request: Cache hit (faster)
  ```

- [ ] Check database query count
  ```bash
  # Enable query logging
  # Verify no N+1 queries
  ```

#### Quality Audit

- [ ] Test coverage > 80%

  ```bash
  npm run test:cov
  ```

- [ ] No security vulnerabilities

  ```bash
  npm audit
  ```

- [ ] No linting errors
  ```bash
  npm run lint
  ```

**Audit Report Template:**

```markdown
# Post-Implementation Audit Report

**Feature:** Product Management  
**Date:** 2026-03-09  
**Auditor:** QA Engineer + Solution Architect

## Security ✅

- ✅ Tenant isolation verified
- ✅ Permission checks working
- ✅ Audit logs complete

## Performance ✅

- ✅ Response time: 150ms (target: <200ms)
- ✅ Caching working (50% cache hit rate)
- ✅ No N+1 queries

## Quality ✅

- ✅ Test coverage: 85% (target: >80%)
- ✅ No security vulnerabilities
- ✅ No linting errors

## Issues Found

None

## Recommendations

- Consider adding more cache warming
- Monitor cache hit rate over time

**Status:** ✅ APPROVED FOR PRODUCTION
```

---

## 🚀 Quick Start Guide

### For New Features

**Step 1: Pre-Implementation (30 min)**

```bash
# 1. Create feature branch
git checkout -b feature/product-management

# 2. Research Odoo/ERPNext patterns
# Search: "Odoo product management architecture"
# Search: "ERPNext item master implementation"

# 3. Design architecture
# Use checklist Section 1 (Dependency Injection)
# Use checklist Section 2 (Security & Multi-tenancy)
# Use checklist Section 3 (Odoo/ERPNext Patterns)

# 4. Document design
# Create docs/architecture/designs/product-management.md
```

**Step 2: Implementation (4-8 hours)**

```bash
# 1. Create module structure
mkdir -p src/backend/domains/inventory/product/{entities,dto,tests}

# 2. Implement following checklist
# - Module configuration (Section 1)
# - Entity design (Section 3.2)
# - Service implementation (Section 2)
# - Controller implementation
# - Tests (Section 4)

# 3. Run checks continuously
npm run lint
npm run test
npm run build
```

**Step 3: Code Review (30 min)**

```bash
# 1. Self-review against checklist
# Go through each section of checklist

# 2. Create PR
git push origin feature/product-management
# Create PR in GitHub

# 3. Request review from Senior Dev or Tech Lead
```

**Step 4: Post-Deployment Audit (1 hour)**

```bash
# 1. Deploy to staging
npm run deploy:staging

# 2. Run audit checklist
npm run audit:security
npm run audit:performance
npm run test:e2e

# 3. Create audit report
# Use template from Section 4
```

---

### For Bug Fixes

**Step 1: Identify Root Cause (30 min)**

```bash
# 1. Reproduce bug
# 2. Check which checklist section was violated
# 3. Document root cause
```

**Step 2: Fix Following Checklist (1-2 hours)**

```bash
# 1. Fix code following relevant checklist section
# 2. Add test to prevent regression
# 3. Verify fix works
```

**Step 3: Review & Deploy (30 min)**

```bash
# 1. Self-review against checklist
# 2. Create PR
# 3. Deploy after approval
```

---

### For Refactoring

**Step 1: Audit Current Code (1 hour)**

```bash
# 1. Run through entire checklist
# 2. Document all violations
# 3. Prioritize fixes (Critical → High → Medium → Low)
```

**Step 2: Create Refactoring Plan (30 min)**

```bash
# 1. Break down into small tasks
# 2. Estimate effort for each task
# 3. Create timeline
```

**Step 3: Refactor Incrementally (varies)**

```bash
# 1. Fix critical issues first
# 2. Fix high priority issues
# 3. Fix medium/low priority issues
# 4. Test after each change
```

---

## 🎓 Training Materials

### For Junior Developers

**Week 1: Learn Patterns**

- Read Odoo Architecture Analysis
- Read ERPNext Architecture Analysis
- Study example modules (ProductModule, OrderModule)

**Week 2: Practice with Guidance**

- Implement simple CRUD module with Senior Dev
- Follow checklist step-by-step
- Get code reviewed

**Week 3: Independent Implementation**

- Implement module independently
- Use checklist as guide
- Request review when done

### For Senior Developers

**Responsibilities:**

- Review PRs using checklist
- Mentor Junior Devs on patterns
- Update checklist based on lessons learned
- Conduct architecture audits

**Training:**

- Deep dive into Odoo/ERPNext architectures
- Learn to identify architectural issues quickly
- Practice giving constructive feedback

---

## 📊 Success Metrics

### Individual Developer

- **Checklist Compliance:** >90% of PRs pass checklist
- **Review Iterations:** <2 iterations per PR
- **Bug Rate:** <5% of features have bugs
- **Test Coverage:** >80% for all features

### Team

- **Architecture Violations:** 0 critical violations
- **Security Issues:** 0 security vulnerabilities
- **Performance:** <200ms average response time
- **Quality:** >80% test coverage across codebase

---

## 🔧 Tools & Automation

### ESLint Rules

**Install:**

```bash
npm install --save-dev eslint-plugin-smarterp
```

**Configure:**

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['smarterp'],
  rules: {
    'smarterp/require-security-module': 'error',
    'smarterp/no-raw-repository': 'error',
    'smarterp/require-user-context': 'error',
  },
};
```

### Pre-commit Hook

**Install:**

```bash
npm install --save-dev husky
npx husky install
```

**Configure:**

```bash
# .husky/pre-commit
#!/bin/bash

# Run linter
npm run lint

# Run tests
npm run test

# Run architecture scan
npm run scan:architecture

# Check for violations
if [ $? -ne 0 ]; then
  echo "❌ Architecture violations found. Fix before committing."
  exit 1
fi
```

### CI/CD Pipeline

**GitHub Actions:**

```yaml
# .github/workflows/architecture-check.yml
name: Architecture Check

on: [pull_request]

jobs:
  architecture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Run architecture scan
        run: npm run scan:architecture

      - name: Check test coverage
        run: npm run test:cov

      - name: Generate report
        run: npm run report:architecture

      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: architecture-report
          path: reports/architecture-report.html
```

---

## 📚 Additional Resources

### Internal Documentation

- [Architecture Review Checklist](./review-checklist.md)
- [Module Review Report](./module-review-report.md)
- [ADR-001: SecureRepository Pattern](./decisions/ADR-001-secure-repository-pattern.md)
- [Odoo Architecture Analysis](../ODOO-ARCHITECTURE-ANALYSIS.md)
- [ERPNext Architecture Analysis](../ERPNEXT-ARCHITECTURE-ANALYSIS.md)

### External Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Odoo Documentation](https://www.odoo.com/documentation/)
- [ERPNext Documentation](https://docs.erpnext.com/)

---

## 🤝 Getting Help

### Questions About Checklist

- **Slack:** #architecture channel
- **Email:** architecture@smarterp.com
- **Meeting:** Architecture Office Hours (Fridays 2-3 PM)

### Questions About Implementation

- **Slack:** #dev-help channel
- **Pair Programming:** Book time with Senior Dev
- **Code Review:** Tag @senior-dev or @tech-lead in PR

### Reporting Issues

- **GitHub Issues:** Use "architecture" label
- **Slack:** #architecture channel
- **Email:** architecture@smarterp.com

---

**Last Updated:** 2026-03-09  
**Maintained By:** Solution Architect + Tech Lead  
**Next Review:** 2026-04-09 (1 month)
