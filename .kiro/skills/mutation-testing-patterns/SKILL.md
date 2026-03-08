---
name: mutation-testing-patterns
description: Mutation testing để đánh giá chất lượng test suite thực sự. Verify tests có catch bugs hay không bằng cách inject lỗi vào code.
---

# Mutation Testing Patterns

## Vấn đề với Coverage Metrics

**Coverage 80% KHÔNG đảm bảo quality:**

```typescript
// ❌ Test này có 100% coverage nhưng KHÔNG test gì cả
it('should calculate total', () => {
  const result = calculateTotal([1, 2, 3]);
  expect(result).toBeDefined(); // ❌ Luôn pass, không verify logic
});

// ✅ Test này thực sự verify logic
it('should calculate total correctly', () => {
  const result = calculateTotal([1, 2, 3]);
  expect(result).toBe(6); // ✅ Sẽ fail nếu logic sai
});
```

## Mutation Testing là gì?

**Mutation Testing** = Inject lỗi vào code → Chạy tests → Verify tests có fail không

**Ví dụ:**

```typescript
// Original code
function calculateDiscount(price: number, percentage: number): number {
  return price * (percentage / 100); // ✅ Đúng
}

// Mutant 1: Thay * thành +
function calculateDiscount(price: number, percentage: number): number {
  return price + percentage / 100; // ❌ Sai - Test phải fail
}

// Mutant 2: Thay / thành *
function calculateDiscount(price: number, percentage: number): number {
  return price * (percentage * 100); // ❌ Sai - Test phải fail
}
```

**Nếu test KHÔNG fail với mutants → Test không đủ tốt!**

## Setup Mutation Testing với Stryker

### 1. Cài đặt

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner @stryker-mutator/typescript-checker
```

### 2. Config File

```javascript
// stryker.conf.js
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',

  // Chỉ test critical paths
  mutate: [
    'src/backend/common/security/**/*.ts',
    'src/backend/domains/*/services/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
  ],

  // Mutation types
  mutator: {
    plugins: ['@stryker-mutator/typescript-checker'],
    excludedMutations: [
      'StringLiteral', // Bỏ qua string mutations (ít quan trọng)
      'BlockStatement', // Bỏ qua block mutations
    ],
  },

  // Thresholds
  thresholds: {
    high: 80, // 80%+ mutants killed = Excellent
    low: 60, // <60% mutants killed = Poor
    break: 50, // <50% = Build fails
  },

  // Performance
  maxConcurrentTestRunners: 4,
  timeoutMS: 60000,
};
```

### 3. Package.json Scripts

```json
{
  "scripts": {
    "test:mutation": "stryker run",
    "test:mutation:critical": "stryker run --mutate 'src/backend/common/security/**/*.ts'",
    "test:mutation:report": "stryker run && open reports/mutation/html/index.html"
  }
}
```

### 4. CI/CD Integration

```yaml
# .github/workflows/mutation-testing.yml
name: Mutation Testing

on:
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * 0' # Chạy mỗi Chủ nhật 2AM

jobs:
  mutation-testing:
    name: Mutation Testing
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run mutation tests on critical paths
        run: npm run test:mutation:critical

      - name: Upload mutation report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: mutation-report
          path: reports/mutation/
          retention-days: 30

      - name: Comment PR with results
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('reports/mutation/mutation.json'));
            const score = report.mutationScore;

            const comment = `## 🧬 Mutation Testing Results

            **Mutation Score: ${score}%**

            - Mutants Killed: ${report.killed}
            - Mutants Survived: ${report.survived}
            - Mutants Timeout: ${report.timeout}

            ${score >= 80 ? '✅ Excellent test quality!' : '⚠️ Consider improving test assertions'}
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Ví dụ: Improve Tests dựa trên Mutation Results

### Before: Weak Test

```typescript
describe('SecureRepository', () => {
  it('should apply tenant filter', async () => {
    const result = await secureRepo.find(mockUser, {});

    expect(result).toBeDefined(); // ❌ Weak assertion
  });
});
```

**Mutation Report:**

```
❌ Survived Mutant: Removed tenantId filter
❌ Survived Mutant: Changed === to !==
```

### After: Strong Test

```typescript
describe('SecureRepository', () => {
  it('should apply tenant filter', async () => {
    // Setup: Create data for 2 tenants
    await repository.save({ id: '1', tenantId: 'tenant-1', name: 'Item 1' });
    await repository.save({ id: '2', tenantId: 'tenant-2', name: 'Item 2' });

    const user = { id: 'user-1', tenantId: 'tenant-1' };
    const result = await secureRepo.find(user, {});

    // ✅ Strong assertions
    expect(result).toHaveLength(1);
    expect(result[0].tenantId).toBe('tenant-1');
    expect(result[0].id).toBe('1');

    // ✅ Verify other tenant data NOT returned
    expect(result.find((r) => r.tenantId === 'tenant-2')).toBeUndefined();
  });

  it('should reject access to other tenant data', async () => {
    await repository.save({ id: '1', tenantId: 'tenant-2', name: 'Item 1' });

    const user = { id: 'user-1', tenantId: 'tenant-1' };
    const result = await secureRepo.findOne(user, { where: { id: '1' } });

    // ✅ Must return null (not throw error)
    expect(result).toBeNull();
  });
});
```

**New Mutation Report:**

```
✅ Killed Mutant: Removed tenantId filter → Test failed ✓
✅ Killed Mutant: Changed === to !== → Test failed ✓
✅ Killed Mutant: Removed length check → Test failed ✓
```

## Critical Paths to Mutation Test

### 1. Security Code (100% mutation coverage required)

```typescript
// src/backend/common/security/secure-repository.ts
// src/backend/common/security/permission.service.ts
// src/backend/common/guards/*.guard.ts
```

### 2. Business Logic (80%+ mutation coverage)

```typescript
// src/backend/domains/*/services/*.service.ts
// src/backend/domains/*/workflows/*.ts
```

### 3. Validation Logic (80%+ mutation coverage)

```typescript
// src/backend/common/validators/*.ts
// src/backend/domains/*/dto/*.dto.ts
```

## Mutation Testing Checklist

- [ ] ✅ Stryker configured với thresholds
- [ ] ✅ CI/CD chạy mutation tests cho critical paths
- [ ] ✅ Mutation score ≥80% cho security code
- [ ] ✅ Mutation score ≥60% cho business logic
- [ ] ✅ PR comments hiển thị mutation results
- [ ] ✅ Mutation reports được archive
- [ ] ✅ Team review mutation survivors định kỳ

## Best Practices

### 1. Start Small

```bash
# Chỉ test 1 file trước
npm run test:mutation -- --mutate 'src/backend/common/security/secure-repository.ts'
```

### 2. Focus on Critical Code

- Security code (SecureRepository, PermissionService)
- Payment processing
- Accounting calculations
- Workflow state transitions

### 3. Ignore Low-Value Mutations

```javascript
// stryker.conf.js
mutator: {
  excludedMutations: [
    'StringLiteral',  // "error" → "errro" (không quan trọng)
    'BlockStatement', // Remove {} (ít quan trọng)
  ],
}
```

### 4. Review Survivors

```typescript
// Mutant survived: Changed > to >=
if (stock > 0) {  // Original
if (stock >= 0) { // Mutant survived

// → Add test for boundary condition
it('should reject order when stock is 0', () => {
  expect(() => createOrder({ stock: 0 })).toThrow('Out of stock');
});
```

## Expected Impact

**Before Mutation Testing:**

- Coverage: 80%
- Actual bug detection: ~40%
- False confidence in tests

**After Mutation Testing:**

- Coverage: 80%
- Mutation Score: 75%
- Actual bug detection: ~75%
- Real confidence in tests

## Summary

Mutation Testing = **Test your tests**

- ✅ Verify tests actually catch bugs
- ✅ Identify weak assertions
- ✅ Improve test quality systematically
- ✅ Build real confidence in test suite

**Goal: 80%+ mutation score for critical paths**
