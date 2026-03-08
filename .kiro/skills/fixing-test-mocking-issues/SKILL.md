---
name: fixing-test-mocking-issues
description: Guide to fix common test failures caused by mocking raw TypeORM methods instead of SecureRepository methods. Use when encountering test errors with createQueryBuilder, update, or delete methods.
---

# Fixing Test Mocking Issues with SecureRepository

## When to Use This Skill

Use this skill when you encounter:

- ✅ Test failures with errors like "Cannot read property 'createQueryBuilder' of undefined"
- ✅ Tests expecting `update()`, `delete()`, or `softDelete()` to be called but they never are
- ✅ Tests that mock `createQueryBuilder()` but the service uses `SecureRepository`
- ✅ Any test file where the service uses `SecureRepository` but tests mock raw TypeORM methods

## Common Symptoms

### 🚨 Red Flags in Test Files

1. **Mocking raw TypeORM methods when service uses SecureRepository:**

   ```typescript
   const mockRepository = {
     update: jest.fn(), // ❌ WRONG
     delete: jest.fn(), // ❌ WRONG
     softDelete: jest.fn(), // ❌ WRONG
     createQueryBuilder: jest.fn(), // ❌ WRONG
   };
   ```

2. **Test expectations that will never be met:**

   ```typescript
   expect(mockRepository.update).toHaveBeenCalled(); // ❌ Will fail
   expect(mockRepository.softDelete).toHaveBeenCalled(); // ❌ Will fail
   expect(mockRepository.createQueryBuilder).toHaveBeenCalled(); // ❌ Will fail
   ```

3. **Service constructor creates SecureRepository:**
   ```typescript
   // In the service file:
   constructor(
     @InjectRepository(Material)
     private readonly materialRepository: Repository<Material>,
     private readonly permissionService: PermissionService,
   ) {
     this.secureMaterialRepo = new SecureRepository(
       materialRepository as any,
       permissionService,
       'Material',
     );
   }
   ```

## Understanding the Problem

### Why This Happens

When a service uses `SecureRepository`, it wraps the raw TypeORM repository to add:

- **Tenant isolation** - Automatically filters by `tenantId`
- **Permission checks** - Validates user permissions before operations
- **Security layer** - Prevents direct database access bypassing security

The `SecureRepository` class provides these methods:

- `find(user, options)` - Instead of raw `find()`
- `findOne(user, options)` - Instead of raw `findOne()`
- `save(user, entity)` - Instead of raw `save()`, `update()`, `insert()`
- `remove(user, entity)` - Instead of raw `remove()`, `delete()`, `softDelete()`

### The Mismatch

```typescript
// ❌ Test mocks this:
mockRepository.update = jest.fn();

// ✅ But service calls this:
this.secureMaterialRepo.save(user, material);

// Result: Test fails because update() is never called!
```

## Step-by-Step Fix Guide

### Step 1: Identify if Service Uses SecureRepository

Look for these patterns in the service file:

```typescript
// Pattern 1: Private property declaration
private secureMaterialRepo: SecureRepository<Material & PermissionRecord>;

// Pattern 2: Constructor initialization
this.secureMaterialRepo = new SecureRepository(
  materialRepository as any,
  permissionService,
  'Material',
);

// Pattern 3: Method calls
await this.secureMaterialRepo.find(user, { where: { id } });
await this.secureMaterialRepo.save(user, entity);
await this.secureMaterialRepo.remove(user, entity);
```

### Step 2: Remove Raw TypeORM Method Mocks

**BEFORE (❌ Wrong):**

```typescript
const mockMaterialRepository = {
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn((data) => data),
  save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
  update: jest.fn().mockResolvedValue({ affected: 1 }), // ❌ Remove
  softDelete: jest.fn().mockResolvedValue({ affected: 1 }), // ❌ Remove
  createQueryBuilder: jest.fn(() => mockQueryBuilder), // ❌ Remove
};
```

**AFTER (✅ Correct):**

```typescript
const mockMaterialRepository = {
  // Keep only if service uses raw repository directly
  // Usually you don't need these at all when using SecureRepository
};
```

### Step 3: Mock SecureRepository Methods Instead

Add spies on the SecureRepository instance **after** the service is created:

```typescript
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ProductionService,
      {
        provide: getRepositoryToken(Material),
        useValue: mockMaterialRepository, // Can be empty object {}
      },
      {
        provide: CacheService,
        useValue: mockCacheService,
      },
      {
        provide: PermissionService,
        useValue: {
          canRead: jest.fn().mockReturnValue(true),
          canWrite: jest.fn().mockReturnValue(true),
          canDelete: jest.fn().mockReturnValue(true),
          buildSecureQuery: jest.fn((user, baseWhere) => ({
            ...baseWhere,
            tenantId: user.tenantId,
          })),
        },
      },
    ],
  }).compile();

  service = module.get<ProductionService>(ProductionService);

  // ✅ Mock SecureRepository methods AFTER service creation
  jest.spyOn(service['secureMaterialRepo'], 'find').mockImplementation(async () => [mockMaterial]);

  jest.spyOn(service['secureMaterialRepo'], 'findOne').mockImplementation(async () => mockMaterial);

  jest
    .spyOn(service['secureMaterialRepo'], 'save')
    .mockImplementation(async (_user, data) => ({ ...mockMaterial, ...data }));

  jest.spyOn(service['secureMaterialRepo'], 'remove').mockImplementation(async () => undefined);
});
```

### Step 4: Update Test Expectations

**BEFORE (❌ Wrong):**

```typescript
it('should delete material', async () => {
  await service.deleteMaterial('1', mockUser);

  expect(mockMaterialRepository.softDelete).toHaveBeenCalledWith({
    id: '1',
    tenantId: 'tenant-1',
  });
});
```

**AFTER (✅ Correct):**

```typescript
it('should delete material', async () => {
  jest.spyOn(service['secureMaterialRepo'], 'findOne').mockResolvedValue(mockMaterial);
  jest.spyOn(service['secureMaterialRepo'], 'remove').mockResolvedValue(undefined);

  await service.deleteMaterial('1', mockUser);

  expect(service['secureMaterialRepo'].remove).toHaveBeenCalledWith(mockUser, mockMaterial);
});
```

### Step 5: Handle Query Builder Cases

If the service uses `find()` with complex queries, mock the `find` method:

**BEFORE (❌ Wrong):**

```typescript
it('should find materials by type', async () => {
  mockQueryBuilder.getMany.mockResolvedValue([]);

  await service.findAllMaterials(mockUser, MaterialType.RAW);

  expect(mockMaterialRepository.createQueryBuilder).toHaveBeenCalled();
  expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('material.type = :type', {
    type: MaterialType.RAW,
  });
});
```

**AFTER (✅ Correct):**

```typescript
it('should find materials by type', async () => {
  const mockMaterials = [{ id: '1', type: MaterialType.RAW }];
  jest.spyOn(service['secureMaterialRepo'], 'find').mockResolvedValue(mockMaterials);

  const result = await service.findAllMaterials(mockUser, MaterialType.RAW);

  expect(result).toEqual(mockMaterials);
  expect(service['secureMaterialRepo'].find).toHaveBeenCalledWith(mockUser, {
    where: { type: MaterialType.RAW },
  });
});
```

## Complete Before/After Example

### ❌ BEFORE: Broken Test

```typescript
describe('ProductionService', () => {
  let service: ProductionService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockMaterialRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        {
          provide: getRepositoryToken(Material),
          useValue: mockMaterialRepository,
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, baseWhere) => ({
              ...baseWhere,
              tenantId: user.tenantId,
            })),
          },
        },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
  });

  it('should find all materials', async () => {
    const mockMaterials = [{ id: '1', name: 'Material 1' }];
    mockQueryBuilder.getMany.mockResolvedValue(mockMaterials);

    const result = await service.findAllMaterials(mockUser);

    expect(result).toEqual(mockMaterials);
    expect(mockMaterialRepository.createQueryBuilder).toHaveBeenCalled(); // ❌ Fails
  });

  it('should update material', async () => {
    const mockMaterial = { id: '1', name: 'Updated' };
    mockMaterialRepository.update.mockResolvedValue({ affected: 1 });

    await service.updateMaterial('1', { name: 'Updated' }, mockUser);

    expect(mockMaterialRepository.update).toHaveBeenCalled(); // ❌ Fails
  });

  it('should delete material', async () => {
    await service.deleteMaterial('1', mockUser);

    expect(mockMaterialRepository.softDelete).toHaveBeenCalled(); // ❌ Fails
  });
});
```

### ✅ AFTER: Fixed Test

```typescript
describe('ProductionService', () => {
  let service: ProductionService;

  const mockMaterial = {
    id: '1',
    name: 'Material 1',
    type: MaterialType.RAW,
    tenantId: 'tenant-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        {
          provide: getRepositoryToken(Material),
          useValue: {}, // Empty - not used directly
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            getOrSet: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, baseWhere) => ({
              ...baseWhere,
              tenantId: user.tenantId,
            })),
          },
        },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);

    // ✅ Mock SecureRepository methods
    jest
      .spyOn(service['secureMaterialRepo'], 'find')
      .mockImplementation(async () => [mockMaterial]);

    jest
      .spyOn(service['secureMaterialRepo'], 'findOne')
      .mockImplementation(async () => mockMaterial);

    jest.spyOn(service['secureMaterialRepo'], 'save').mockImplementation(async (_user, data) => ({
      ...mockMaterial,
      ...data,
    }));

    jest.spyOn(service['secureMaterialRepo'], 'remove').mockImplementation(async () => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should find all materials', async () => {
    jest.spyOn(service['secureMaterialRepo'], 'find').mockResolvedValue([mockMaterial]);

    const result = await service.findAllMaterials(mockUser);

    expect(result).toEqual([mockMaterial]);
    expect(service['secureMaterialRepo'].find).toHaveBeenCalledWith(mockUser, { where: undefined });
  });

  it('should update material', async () => {
    const updatedMaterial = { ...mockMaterial, name: 'Updated' };

    jest.spyOn(service['secureMaterialRepo'], 'findOne').mockResolvedValue(mockMaterial);
    jest.spyOn(service['secureMaterialRepo'], 'save').mockResolvedValue(updatedMaterial);

    const result = await service.updateMaterial('1', { name: 'Updated' }, mockUser);

    expect(result.name).toBe('Updated');
    expect(service['secureMaterialRepo'].save).toHaveBeenCalledWith(
      mockUser,
      expect.objectContaining({ name: 'Updated' }),
    );
  });

  it('should delete material', async () => {
    jest.spyOn(service['secureMaterialRepo'], 'findOne').mockResolvedValue(mockMaterial);
    jest.spyOn(service['secureMaterialRepo'], 'remove').mockResolvedValue(undefined);

    await service.deleteMaterial('1', mockUser);

    expect(service['secureMaterialRepo'].remove).toHaveBeenCalledWith(mockUser, mockMaterial);
  });
});
```

## Verification Checklist

After fixing your tests, verify:

- [ ] ✅ No mocks for `update()`, `delete()`, `softDelete()`, or `createQueryBuilder()`
- [ ] ✅ All SecureRepository methods are mocked: `find`, `findOne`, `save`, `remove`
- [ ] ✅ Mocks are set up AFTER service creation in `beforeEach`
- [ ] ✅ Test expectations check SecureRepository methods, not raw repository methods
- [ ] ✅ All mocked methods receive `user` as the first parameter
- [ ] ✅ PermissionService is properly mocked with `canRead`, `canWrite`, `canDelete`
- [ ] ✅ Tests pass without "undefined" or "not called" errors
- [ ] ✅ Cache invalidation is tested where applicable

## Quick Reference: SecureRepository Method Mapping

| Raw TypeORM Method       | SecureRepository Method  | Signature                                       |
| ------------------------ | ------------------------ | ----------------------------------------------- |
| `find(options)`          | `find(user, options)`    | `find(user: User, options?: FindManyOptions)`   |
| `findOne(options)`       | `findOne(user, options)` | `findOne(user: User, options?: FindOneOptions)` |
| `save(entity)`           | `save(user, entity)`     | `save(user: User, entity: Partial<T>)`          |
| `update(criteria, data)` | `save(user, entity)`     | `save(user: User, entity: Partial<T>)`          |
| `insert(entity)`         | `save(user, entity)`     | `save(user: User, entity: Partial<T>)`          |
| `remove(entity)`         | `remove(user, entity)`   | `remove(user: User, entity: T)`                 |
| `delete(criteria)`       | `remove(user, entity)`   | `remove(user: User, entity: T)`                 |
| `softDelete(criteria)`   | `remove(user, entity)`   | `remove(user: User, entity: T)`                 |

## Common Pitfalls

### 1. Forgetting to Mock After Service Creation

```typescript
// ❌ WRONG: Mocking before service exists
jest.spyOn(service['secureMaterialRepo'], 'find'); // service is undefined!

const module = await Test.createTestingModule({...}).compile();
service = module.get<ProductionService>(ProductionService);
```

```typescript
// ✅ CORRECT: Mock after service creation
const module = await Test.createTestingModule({...}).compile();
service = module.get<ProductionService>(ProductionService);

jest.spyOn(service['secureMaterialRepo'], 'find')
  .mockImplementation(async () => [mockMaterial]);
```

### 2. Not Clearing Mocks Between Tests

```typescript
afterEach(() => {
  jest.clearAllMocks(); // ✅ Always clear mocks
});
```

### 3. Forgetting User Parameter

```typescript
// ❌ WRONG: Missing user parameter
expect(service['secureMaterialRepo'].save).toHaveBeenCalledWith(mockMaterial);

// ✅ CORRECT: Include user parameter
expect(service['secureMaterialRepo'].save).toHaveBeenCalledWith(mockUser, mockMaterial);
```

### 4. Mocking Cache But Not Handling getOrSet

```typescript
// ✅ CORRECT: Mock getOrSet to call the factory function
mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
  return factory(); // Execute the factory to get the actual data
});
```

## Related Documentation

- [Odoo/ERPNext Architecture Guide](../../../docs/ODOO-ARCHITECTURE-ANALYSIS.md)
- [SecureRepository Implementation](../../../src/backend/common/security/secure-repository.ts)
- [PermissionService Documentation](../../../src/backend/common/security/permission.service.ts)

## Summary

**Key Takeaway:** When a service uses `SecureRepository`, always mock the SecureRepository methods (`find`, `findOne`, `save`, `remove`) instead of raw TypeORM methods (`update`, `delete`, `softDelete`, `createQueryBuilder`).

This ensures:

- ✅ Tests accurately reflect how the service works
- ✅ Security and tenant isolation are properly tested
- ✅ Tests pass reliably without "undefined" errors
- ✅ Code maintains Odoo/ERPNext architectural patterns
