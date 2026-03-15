# Enum Usage Guidelines

**Version:** 1.0  
**Last Updated:** 2026-03-15

---

## Overview

All enums are centralized in `src/shared/src/enums/` for consistency across backend, frontend, and mobile.

---

## Available Enums

### 1. Status Enums (`status.ts`)

**ApprovalStatus** - For approval workflows
```typescript
import { ApprovalStatus } from '@shared/enums/status';

// Usage
order.approvalStatus = ApprovalStatus.PENDING;
```

**ExecutionStatus** - For task/job execution
```typescript
import { ExecutionStatus } from '@shared/enums/status';

// Usage
job.status = ExecutionStatus.RUNNING;
```

**EntityStatus** - For entity active/inactive state
```typescript
import { EntityStatus } from '@shared/enums/status';

// Usage
user.status = EntityStatus.ACTIVE;
```

**SyncStatus** - For offline-first sync state
```typescript
import { SyncStatus } from '@shared/enums/status';

// Usage
product.syncStatus = SyncStatus.PENDING;
```

---

## Import Guidelines

### Backend (NestJS)

```typescript
// ✅ CORRECT: Import from shared
import { SyncStatus, EntityStatus } from '@shared/enums/status';

// ❌ WRONG: Don't create duplicate enums
export enum SyncStatus { ... }
```

### Frontend (React)

```typescript
// ✅ CORRECT: Import from shared
import { ApprovalStatus } from '@shared/enums/status';

// ❌ WRONG: Don't hardcode strings
const status = 'pending'; // Bad
const status = ApprovalStatus.PENDING; // Good
```

### Mobile (React Native)

```typescript
// ✅ CORRECT: Import from shared
import { SyncStatus } from '@shared/enums/status';
```

---

## Adding New Enums

1. Add to appropriate file in `src/shared/src/enums/`
2. Export from `src/shared/src/enums/index.ts`
3. Document in this guide
4. Update imports across platforms

---

**Last Updated:** 2026-03-15
