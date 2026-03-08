# Fixing Test Mocking Issues with SecureRepository

**Quick Fix Guide for Common Test Failures**

## 🎯 Use This When

Your tests are failing with errors like:

- "Cannot read property 'createQueryBuilder' of undefined"
- "Expected update/delete/softDelete to be called but it wasn't"
- Tests mock TypeORM methods but service uses SecureRepository

## 🚀 Quick Fix (TL;DR)

**Instead of mocking raw TypeORM:**

```typescript
// ❌ WRONG
const mockRepo = {
  update: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn(),
};
```

**Mock SecureRepository methods after service creation:**

```typescript
// ✅ CORRECT
beforeEach(async () => {
  // ... create service ...
  service = module.get<ProductionService>(ProductionService);

  jest.spyOn(service['secureMaterialRepo'], 'find').mockImplementation(async () => [mockData]);
  jest
    .spyOn(service['secureMaterialRepo'], 'save')
    .mockImplementation(async (_user, data) => ({ ...mockData, ...data }));
  jest.spyOn(service['secureMaterialRepo'], 'remove').mockImplementation(async () => undefined);
});
```

## 📖 Full Documentation

See [SKILL.md](./SKILL.md) for:

- Complete step-by-step guide
- Before/after examples
- Common pitfalls
- Verification checklist
- Method mapping reference

## 🔍 How to Identify the Problem

Check if your service file has:

```typescript
private secureMaterialRepo: SecureRepository<Material>;

constructor(...) {
  this.secureMaterialRepo = new SecureRepository(...);
}
```

If yes, you MUST mock SecureRepository methods, not raw TypeORM!

## ✅ Quick Checklist

- [ ] Remove mocks for `update()`, `delete()`, `softDelete()`, `createQueryBuilder()`
- [ ] Mock SecureRepository methods: `find`, `findOne`, `save`, `remove`
- [ ] Set up mocks AFTER service creation
- [ ] Include `user` parameter in all expectations
- [ ] Mock PermissionService properly

## 📚 Related

- Architecture: [odoo-erpnext-architecture.md](../../../odoo-erpnext-architecture.md)
- SecureRepository: `src/backend/common/security/secure-repository.ts`
