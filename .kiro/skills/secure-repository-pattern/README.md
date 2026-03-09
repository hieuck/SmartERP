# SecureRepository Pattern - Quick Reference

**Multi-tenant security and audit trail pattern for any SaaS/B2B/Enterprise application**

---

## 🚀 Quick Start (TL;DR)

### 1. Constructor Setup

```typescript
@Injectable()
export class ProjectService {
  private readonly secureProjectRepo: SecureRepository<Project>;

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureProjectRepo = new SecureRepository(projectRepository, permissionService, 'Project');
  }
}
```

### 2. CRUD Operations

```typescript
// Find all
async findAll(user: User): Promise<Project[]> {
  return this.secureProjectRepo.find(user, {});
}

// Find one
async findById(user: User, id: string): Promise<Project> {
  return this.secureProjectRepo.findOne(user, { where: { id } });
}

// Create
async create(user: User, data: CreateProjectDto): Promise<Project> {
  const project = this.projectRepository.create({
    ...data,
    tenantId: user.tenantId,
    createdBy: user.id,
    updatedBy: user.id,
  });
  return this.secureProjectRepo.save(user, project);
}

// Update
async update(user: User, id: string, data: UpdateProjectDto): Promise<Project> {
  const project = await this.findById(user, id);
  Object.assign(project, { ...data, updatedBy: user.id });
  return this.secureProjectRepo.save(user, project);
}

// Delete (soft)
async delete(user: User, id: string): Promise<void> {
  const project = await this.findById(user, id);
  project.deletedAt = new Date();
  project.deletedBy = user.id;
  await this.secureProjectRepo.save(user, project);
}
```

### 3. Testing

```typescript
beforeEach(async () => {
  // ... setup module ...
  service = module.get<ProjectService>(ProjectService);

  // Mock SecureRepository methods
  jest.spyOn(service['secureProjectRepo'], 'find').mockResolvedValue([mockProject]);
  jest
    .spyOn(service['secureProjectRepo'], 'save')
    .mockImplementation(async (_user, data) => ({ ...mockProject, ...data }));
});
```

---

## ✅ Key Benefits

- ✅ **Automatic tenant isolation** - No manual tenantId filters
- ✅ **Permission checks** - Enforced before operations
- ✅ **Audit trail** - Automatic tracking of who/when
- ✅ **Type safety** - Full TypeScript support
- ✅ **Testable** - Easy to mock in tests

---

## 🚨 Common Mistakes

### ❌ DON'T

```typescript
// Direct repository query
this.projectRepository.find({ where: { tenantId } });

// Missing audit trail
const project = this.projectRepository.create(data);

// Mock raw TypeORM in tests
jest.spyOn(service['projectRepository'], 'find');
```

### ✅ DO

```typescript
// Use SecureRepository
this.secureProjectRepo.find(user, {});

// Include audit trail
const project = this.projectRepository.create({
  ...data,
  tenantId: user.tenantId,
  createdBy: user.id,
  updatedBy: user.id,
});

// Mock SecureRepository in tests
jest.spyOn(service['secureProjectRepo'], 'find');
```

---

## 📖 Full Documentation

See [SKILL.md](./SKILL.md) for:

- Complete implementation guide
- Advanced usage (query builder, caching, transactions)
- Testing strategies
- Troubleshooting
- Best practices

---

## 🔗 Related

- [Backend Testing Patterns](../backend-testing-patterns/SKILL.md)
- [Fixing Test Mocking Issues](../fixing-test-mocking-issues/SKILL.md)
- [Migration Guide](../../steering/migration-guide.md)

---

**Quick Tip**: Always pass `User` object (not `tenantId` string) to SecureRepository methods!
