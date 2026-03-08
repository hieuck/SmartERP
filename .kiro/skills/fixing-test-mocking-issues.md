---
name: fixing-test-mocking-issues
description: Guide to fix common test failures caused by mocking raw TypeORM methods instead of SecureRepository methods. Use when encountering test errors with createQueryBuilder, update, or delete methods.
keywords: test, mock, SecureRepository, TypeORM, queryBuilder, testing, jest
---

# Fixing Test Mocking Issues - SecureRepository Pattern

## Problem

Tests fail because they mock raw TypeORM methods (`createQueryBuilder`, `update`, `delete`) instead of SecureRepository methods (`find`, `findOne`, `save`, `remove`).

## Root Cause

Services use `SecureRepository` wrapper around TypeORM repositories for:

- Tenant isolation
- Permission checks
- Audit trail

But tests mock the underlying TypeORM repository methods directly.

## Solution Pattern

### ❌ WRONG - Mock QueryBuilder

```typescript
const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockRepository = {
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
  update: jest.fn(),
  softDelete: jest.fn(),
};

// Test
mockQueryBuilder.getMany.mockResolvedValue(mockData);
```

### ✅ CORRECT - Mock SecureRepository Methods

```typescript
const mockRepository = {
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
  remove: jest.fn().mockResolvedValue(undefined),
  count: jest.fn().mockResolvedValue(0),
};

// Test
mockRepository.find.mockResolvedValue(mockData);
```

## Common Fixes

### 1. Find All Operations

**Before:**

```typescript
mockQueryBuilder.getMany.mockResolvedValue(mockData);
expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
```

**After:**

```typescript
mockRepository.find.mockResolvedValue(mockData);
expect(mockRepository.find).toHaveBeenCalled();
```

### 2. Find with Where Clause

**Before:**

```typescript
mockQueryBuilder.getMany.mockResolvedValue(mockData);
expect(mockQueryBuilder.where).toHaveBeenCalledWith('entity.field = :value', { value });
```

**After:**

```typescript
mockRepository.find.mockResolvedValue(mockData);
expect(mockRepository.find).toHaveBeenCalledWith(
  expect.objectContaining({
    where: expect.objectContaining({ field: value }),
  }),
);
```

### 3. Find by ID with Caching

**Before:**

```typescript
mockQueryBuilder.getOne.mockResolvedValue(mockEntity);
```

**After:**

```typescript
mockCacheService.getOrSet.mockResolvedValue(mockEntity);
// OR if cache miss
mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
mockRepository.findOne.mockResolvedValue(mockEntity);
```

### 4. Delete Operations

**Before:**

```typescript
mockRepository.softDelete.mockResolvedValue({ affected: 1 });
```

**After:**

```typescript
// SecureRepository.remove() calls findOne() first
mockRepository.findOne.mockResolvedValue(mockEntity);
mockRepository.remove.mockResolvedValue(undefined);
```

### 5. Update Operations

**Before:**

```typescript
mockRepository.update.mockResolvedValue({ affected: 1 });
```

**After:**

```typescript
// Service typically does: find -> modify -> save
mockCacheService.getOrSet.mockResolvedValue(mockEntity);
mockRepository.save.mockResolvedValue({ ...mockEntity, ...updates });
mockCacheService.del.mockResolvedValue(undefined);
```

## Step-by-Step Fix Process

1. **Remove QueryBuilder Mock**
   - Delete `mockQueryBuilder` object
   - Remove `createQueryBuilder` from repository mock

2. **Add SecureRepository Methods**

   ```typescript
   const mockRepository = {
     find: jest.fn().mockResolvedValue([]),
     findOne: jest.fn().mockResolvedValue(null),
     save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
     remove: jest.fn().mockResolvedValue(undefined),
     count: jest.fn().mockResolvedValue(0),
   };
   ```

3. **Update Test Mocks**
   - Replace `mockQueryBuilder.getMany()` with `mockRepository.find()`
   - Replace `mockQueryBuilder.getOne()` with `mockRepository.findOne()`
   - Replace `mockRepository.update()` with `mockRepository.save()`
   - Replace `mockRepository.softDelete()` with `mockRepository.remove()`

4. **Update Expectations**
   - Remove expectations about `createQueryBuilder`, `where`, `andWhere`
   - Add expectations about `find`, `findOne`, `save`, `remove`

5. **Handle Caching**
   - Mock `mockCacheService.getOrSet()` for find operations
   - Mock `mockCacheService.del()` for update/delete operations

## Example: Complete Fix

### Before (WRONG)

```typescript
describe('ProductService', () => {
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  it('should find all products', async () => {
    mockQueryBuilder.getMany.mockResolvedValue([{ id: '1' }]);
    const result = await service.findAll(mockUser);
    expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
  });

  it('should delete product', async () => {
    mockRepository.softDelete.mockResolvedValue({ affected: 1 });
    await service.delete('1', mockUser);
    expect(mockRepository.softDelete).toHaveBeenCalled();
  });
});
```

### After (CORRECT)

```typescript
describe('ProductService', () => {
  const mockRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockCacheService = {
    getOrSet: jest.fn(),
    del: jest.fn(),
  };

  it('should find all products', async () => {
    mockRepository.find.mockResolvedValue([{ id: '1' }]);
    const result = await service.findAll(mockUser);
    expect(mockRepository.find).toHaveBeenCalled();
  });

  it('should delete product', async () => {
    const mockProduct = { id: '1', name: 'Product' };
    mockCacheService.getOrSet.mockResolvedValue(mockProduct);
    mockRepository.findOne.mockResolvedValue(mockProduct);
    mockRepository.remove.mockResolvedValue(undefined);
    mockCacheService.del.mockResolvedValue(undefined);

    await service.delete('1', mockUser);

    expect(mockRepository.findOne).toHaveBeenCalled();
    expect(mockRepository.remove).toHaveBeenCalledWith(mockProduct);
    expect(mockCacheService.del).toHaveBeenCalled();
  });
});
```

## Verification

After fixing, verify:

1. ✅ All tests pass
2. ✅ No references to `createQueryBuilder`, `update`, `delete`, `softDelete`
3. ✅ All mocks use `find`, `findOne`, `save`, `remove`
4. ✅ Cache mocks included where service uses caching
5. ✅ Permission service mocked with `canRead`, `canWrite`, `canDelete`

## Related

- See `odoo-erpnext-architecture.md` - Rule #9: Testing với SecureRepository
- See `src/backend/domains/manufacturing/mrp/production.service.spec.ts` - Example of correct pattern
