---
inclusion: auto
---

# Architecture Enforcement - Automated Compliance

## ⚠️ CRITICAL: Automated Checks

Mọi code PHẢI pass các checks sau trước khi commit:

### 1. SecureRepository Pattern Check

**Rule**: Service files KHÔNG được query trực tiếp TypeORM repository

**Violations to detect**:

```typescript
// ❌ BAD - Direct repository query
this.projectRepository.findOne({ where: { id, tenantId } });
this.userRepository.find({ where: { tenantId } });

// ✅ GOOD - SecureRepository
this.secureProjectRepo.findOne(user, { where: { id } });
this.secureUserRepo.find(user, {});
```

**ESLint Rule** (TODO: Implement):

```javascript
// .eslintrc.js
rules: {
  'no-direct-repository-query': 'error'
}
```

### 2. PermissionService Injection Check

**Rule**: Mọi service PHẢI inject PermissionService

**Violations to detect**:

```typescript
// ❌ BAD - Missing PermissionService
constructor(
  @InjectRepository(Project)
  private readonly projectRepository: Repository<Project>,
) {}

// ✅ GOOD - Has PermissionService
constructor(
  @InjectRepository(Project)
  private readonly projectRepository: Repository<Project>,
  private readonly permissionService: PermissionService,
  private readonly cacheService: CacheService,
) {
  this.secureProjectRepo = new SecureRepository(
    projectRepository,
    permissionService,
    'Project',
  );
}
```

### 3. Tenant Isolation Check

**Rule**: Mọi query PHẢI có tenant isolation

**Violations to detect**:

```typescript
// ❌ BAD - No tenant filter
.where('project.id = :id', { id })

// ✅ GOOD - Has tenant filter
.where('project.id = :id AND project.tenantId = :tenantId', { id, tenantId })
```

### 4. Audit Trail Check

**Rule**: Entity PHẢI có createdBy, updatedBy, createdAt, updatedAt

**Violations to detect**:

```typescript
// ❌ BAD - Missing audit fields
@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}

// ✅ GOOD - Has audit fields
@Entity()
export class Project extends BaseEntity {
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

## Pre-commit Hook Implementation

```bash
#!/bin/bash
# .husky/pre-commit

echo "🔍 Checking architecture compliance..."

# Check for direct repository queries
if git diff --cached --name-only | grep -E '\.service\.ts$' | xargs grep -l 'this\.\w*Repository\.(find|save|update|delete)' > /dev/null; then
  echo "❌ BLOCKED: Direct repository query detected!"
  echo "   Use SecureRepository instead"
  exit 1
fi

# Check for missing PermissionService
if git diff --cached --name-only | grep -E '\.service\.ts$' | xargs grep -L 'PermissionService' > /dev/null; then
  echo "⚠️  WARNING: Service missing PermissionService injection"
fi

echo "✅ Architecture compliance check passed"
```

## CI/CD Gate

```yaml
# .github/workflows/architecture-check.yml
name: Architecture Compliance

on: [pull_request]

jobs:
  check-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Check SecureRepository usage
        run: |
          violations=$(grep -r "this\.\w*Repository\.(find|save)" src/backend/domains --include="*.service.ts" || true)
          if [ ! -z "$violations" ]; then
            echo "❌ Direct repository queries found:"
            echo "$violations"
            exit 1
          fi

      - name: Check PermissionService injection
        run: |
          services=$(find src/backend/domains -name "*.service.ts")
          for service in $services; do
            if ! grep -q "PermissionService" "$service"; then
              echo "❌ Missing PermissionService: $service"
              exit 1
            fi
          done
```

## Exception List (Legacy Code)

Các file được EXEMPT khỏi rules (tạm thời):

```typescript
// architecture-exceptions.json
{
  "exemptFiles": [
    "src/backend/domains/project/project.service.ts",
    "src/backend/domains/hr/hr/hr.service.ts"
  ],
  "reason": "Legacy code - scheduled for refactor in Sprint 2026-Q2",
  "deadline": "2026-06-30"
}
```

## Refactoring Checklist

Khi refactor legacy service:

- [ ] Add PermissionService to constructor
- [ ] Add CacheService to constructor
- [ ] Create SecureRepository instance
- [ ] Replace all direct repository calls with SecureRepository
- [ ] Add permission checks (canRead, canWrite, canDelete)
- [ ] Add caching for read operations
- [ ] Update tests to mock SecureRepository
- [ ] Remove from exception list
- [ ] Update CHANGELOG.md

## Monitoring & Metrics

Track compliance metrics:

```typescript
// scripts/check-compliance.ts
const metrics = {
  totalServices: 50,
  compliantServices: 38,
  violatingServices: 12,
  complianceRate: '76%',
  target: '100%',
  deadline: '2026-06-30',
};
```

## Enforcement Timeline

- **Week 1-2**: Add automated checks (pre-commit, CI/CD)
- **Week 3-4**: Refactor high-priority services (auth, user, tenant)
- **Week 5-8**: Refactor remaining services
- **Week 9**: Remove all exceptions, enforce 100% compliance

---

**Last Updated**: 2026-03-09
**Status**: 🚧 In Progress (76% compliant)
**Target**: 100% by 2026-06-30
