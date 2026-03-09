---
inclusion: auto
version: 1.0.0
description: Guidelines to avoid temporary solutions and implement production-ready code from day one. Covers database management, configuration, error handling, testing, and decision framework.
---

# Avoid Temporary Solutions

## Core Principle

**NEVER choose temporary/quick-fix solutions. ALWAYS implement proper, production-ready solutions.**

## CRITICAL: Analyze Root Cause First

**Before implementing ANY solution, you MUST:**

1. **Identify the root cause** - What is the REAL problem?
2. **Understand why it happens** - What's the underlying mechanism?
3. **Evaluate solutions** - What are ALL possible approaches?
4. **Choose the proper fix** - Which solution addresses the root cause?

### Example: Database Schema Creation Failure

**❌ BAD Approach (No Analysis):**

- Try different entity import methods
- Create minimal entity scripts
- Enable DB_SYNC=true as workaround
- Keep trying random solutions

**✅ GOOD Approach (Root Cause Analysis):**

1. **Symptom**: TypeORM synchronize fails with "index does not exist"
2. **Root Cause Analysis**:
   - Database is newly created → No existing indexes
   - TypeORM tries to DROP index before CREATE
   - DROP fails because index doesn't exist
   - This is a TypeORM bug with fresh databases
3. **Proper Solutions**:
   - Option A: Use migrations instead of synchronize
   - Option B: Use `dropSchema: true` to clear first
   - Option C: Check if index exists before dropping
4. **Chosen Solution**: Migrations (production-ready)

**Key Insight**: Without root cause analysis, you waste time on symptoms instead of fixing the real problem.

## Common Temporary Solutions to AVOID

### ❌ Database Schema Management

**BAD (Temporary):**

```env
DB_SYNC=true  # Auto-sync schema on startup
```

**GOOD (Proper):**

```bash
# Use migration scripts
npm run migration:generate
npm run migration:run

# Or use init script for development
npx ts-node scripts/init-db.ts
```

**Why:** DB_SYNC=true can cause data loss in production, race conditions, and unpredictable schema changes.

### ❌ Environment Configuration

**BAD (Temporary):**

- Hardcoding values in code
- Using `.env.example` as actual config
- Commenting out validation

**GOOD (Proper):**

- Use proper environment variables
- Validate all required configs
- Document all environment variables

### ❌ Error Handling

**BAD (Temporary):**

```typescript
try {
  // code
} catch (e) {
  console.log(e); // Just log and ignore
}
```

**GOOD (Proper):**

```typescript
try {
  // code
} catch (e) {
  logger.error('Specific error context', e);
  throw new CustomException('User-friendly message');
}
```

### ❌ Testing

**BAD (Temporary):**

- Skipping tests with `.skip()`
- Commenting out failing tests
- Using `any` types everywhere

**GOOD (Proper):**

- Fix the root cause
- Write proper mocks
- Use correct types

### ❌ Dependencies

**BAD (Temporary):**

- Using `npm install --force`
- Ignoring peer dependency warnings
- Using outdated packages

**GOOD (Proper):**

- Resolve dependency conflicts properly
- Update packages systematically
- Use compatible versions

## Decision Framework

When facing a problem, ask:

1. **Is this solution production-ready?**
   - If NO → Find proper solution
   - If YES → Proceed

2. **Will this cause technical debt?**
   - If YES → Find proper solution
   - If NO → Proceed

3. **Can this break in production?**
   - If YES → Find proper solution
   - If NO → Proceed

4. **Is this a workaround or a fix?**
   - If workaround → Find proper solution
   - If fix → Proceed

## Examples from SmartERP

### ✅ GOOD: Database Initialization

```typescript
// scripts/init-db.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  // Proper schema sync for development only
  if (process.env.NODE_ENV === 'development') {
    await dataSource.synchronize();
    console.log('✅ Database schema synchronized');
  }

  await app.close();
}

bootstrap();
```

### ✅ GOOD: Seed Data

```typescript
// Use dedicated seed endpoint or script
// NOT: Manual SQL inserts
// NOT: DB_SYNC=true to create tables
```

### ✅ GOOD: Path Aliases

```typescript
// Fix tsconfig.json paths properly
// NOT: Use relative imports ../../
// NOT: Disable path resolution
```

## Reminders for AI Agent

When you encounter a problem:

1. **ANALYZE** - What is the ROOT CAUSE? (Most important!)
2. **STOP** - Don't rush to quick fix
3. **THINK** - What's the proper solution?
4. **RESEARCH** - Check best practices
5. **IMPLEMENT** - Do it right the first time

**Remember:**

- **ROOT CAUSE ANALYSIS FIRST** - Always understand WHY before HOW
- Temporary solutions become permanent
- Quick fixes create technical debt
- Proper solutions save time long-term
- Production-ready from day one
- Symptoms ≠ Problems (treat the disease, not the symptoms)

## Red Flags

If you find yourself thinking:

- "Let me just enable this temporarily..."
- "I'll fix this properly later..."
- "This is just for development..."
- "Quick workaround for now..."

**STOP!** These are signs of temporary solutions.

## Exceptions

The ONLY acceptable temporary solutions:

1. **Debugging** - Console.log for debugging (remove after)
2. **Prototyping** - POC code (clearly marked, not committed)
3. **Emergency hotfix** - With immediate follow-up task created

All exceptions MUST:

- Be documented with TODO comments
- Have tracking issue/task
- Have deadline for proper fix
- Be reviewed before merge

---

## Summary

**The Golden Rule**: Analyze root cause → Choose proper solution → Implement production-ready code

**Never skip root cause analysis!** It's the difference between:

- Fixing the problem once vs. fighting symptoms forever
- 10 minutes of thinking vs. hours of trial-and-error
- Production-ready code vs. technical debt

---

**Last Updated**: 2026-03-09  
**Version**: 1.1.0 (was 1.0.0)  
**Status**: ✅ Active
