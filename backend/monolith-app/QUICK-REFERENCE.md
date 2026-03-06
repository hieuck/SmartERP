# 🚀 Quick Reference Guide

**Smart ERP - Developer Quick Reference**

---

## Common Commands

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Run specific test
npm test -- product.service.spec

# Type check
npm run type-check

# Lint code
npm run lint
```

### Database

```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate migration
npm run migration:generate -- -n MigrationName

# Seed test users
npm run seed:test-users
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production
npm run start:prod

# PM2 deployment
pm2 start dist/main.js --name smart-erp
pm2 logs smart-erp
pm2 restart smart-erp
pm2 stop smart-erp
```

---

## Project Structure

```
src/
├── modules/              # Feature modules
│   ├── auth/            # Authentication
│   ├── product/         # Product management
│   ├── order/           # Order processing
│   ├── customer/        # Customer management
│   └── ...              # 26 more modules
├── common/              # Shared utilities
│   ├── decorators/      # Custom decorators
│   ├── guards/          # Auth guards
│   ├── filters/         # Exception filters
│   └── entities/        # Base entities
└── config/              # Configuration
```

---

## Security Implementation

### Authentication

```typescript
// Protect entire controller
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {}

// Protect specific endpoint
@Get()
@UseGuards(JwtAuthGuard)
async findAll() {}
```

### Authorization (RBAC)

```typescript
// Require specific roles
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
@Delete(':id')
async remove(@Param('id') id: string) {}
```

### Tenant Isolation

```typescript
// Enforce tenant isolation
@UseGuards(JwtAuthGuard, TenantGuard)
@Get()
async findAll(@TenantId() tenantId: string) {}
```

### Complete Example

```typescript
@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ProductController {
  
  @Get()
  @Roles('admin', 'manager', 'user', 'viewer')
  async findAll(@TenantId() tenantId: string) {
    return this.productService.findAll(tenantId);
  }
  
  @Post()
  @Roles('admin', 'manager', 'user')
  async create(
    @Body() dto: CreateProductDto,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ) {
    return this.productService.create(dto, tenantId, userId);
  }
  
  @Delete(':id')
  @Roles('admin', 'manager')
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.productService.remove(id, tenantId);
  }
}
```

---

## Database Patterns

### Entity with Multi-Tenant

```typescript
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('products')
@Index(['tenantId', 'sku'], { unique: true })
@Index(['tenantId', 'status'])
export class Product extends BaseEntity {
  // BaseEntity provides: id, tenantId, createdAt, updatedAt, deletedAt
  
  @Column()
  name: string;
  
  @Column()
  sku: string;
  
  @Column({ default: 'active' })
  status: string;
}
```

### Service with Tenant Isolation

```typescript
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
  
  async findAll(tenantId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }
  
  async create(
    dto: CreateProductDto,
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    const product = this.productRepository.create({
      ...dto,
      tenantId,
      createdBy: userId,
    });
    return this.productRepository.save(product);
  }
}
```

---

## Testing Patterns

### Unit Test

```typescript
describe('ProductService', () => {
  let service: ProductService;
  let repository: Repository<Product>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();
    
    service = module.get<ProductService>(ProductService);
    repository = module.get(getRepositoryToken(Product));
  });
  
  it('should find all products for tenant', async () => {
    const tenantId = 'tenant-1';
    mockRepository.find.mockResolvedValue([mockProduct]);
    
    const result = await service.findAll(tenantId);
    
    expect(result).toEqual([mockProduct]);
    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  });
});
```

---

## API Endpoints

### Authentication

```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login
POST   /api/auth/refresh       - Refresh token
POST   /api/auth/logout        - Logout
GET    /api/auth/me            - Get current user
POST   /api/auth/change-password - Change password
```

### Products

```
GET    /api/products           - List products
GET    /api/products/:id       - Get product
POST   /api/products           - Create product
PUT    /api/products/:id       - Update product
DELETE /api/products/:id       - Delete product
GET    /api/products/low-stock - Low stock products
```

### Orders

```
GET    /api/orders             - List orders
GET    /api/orders/:id         - Get order
POST   /api/orders             - Create order
PUT    /api/orders/:id         - Update order
DELETE /api/orders/:id         - Delete order
POST   /api/orders/:id/confirm - Confirm order
POST   /api/orders/:id/cancel  - Cancel order
```

---

## Environment Variables

### Required

```env
NODE_ENV=development|production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=smart_erp
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Optional

```env
REDIS_HOST=localhost
REDIS_PORT=6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@example.com
SMTP_PASSWORD=password
```

---

## Common Issues

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connection
psql -h localhost -U postgres
```

### Migration Failed

```bash
# Revert migration
npm run migration:revert

# Check migration status
psql smart_erp -c "SELECT * FROM migrations;"

# Drop and recreate database
dropdb smart_erp
createdb smart_erp
npm run migration:run
```

### Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests in band (sequential)
npm test -- --runInBand

# Run specific test file
npm test -- product.service.spec
```

---

## Performance Tips

### Database Queries

```typescript
// ✅ Good - Use indexes
await repository.find({
  where: { tenantId, status: 'active' },
});

// ❌ Bad - No tenant filter
await repository.find({
  where: { status: 'active' },
});

// ✅ Good - Select specific fields
await repository.find({
  select: ['id', 'name', 'price'],
  where: { tenantId },
});

// ❌ Bad - Select all fields
await repository.find({ where: { tenantId } });
```

### Pagination

```typescript
// ✅ Good - Use pagination
async findAll(tenantId: string, page = 1, limit = 20) {
  return this.repository.find({
    where: { tenantId },
    skip: (page - 1) * limit,
    take: limit,
  });
}
```

---

## Useful Links

- **Documentation:** `/docs`
- **API Docs:** `/api/docs` (Swagger)
- **Health Check:** `/health`
- **Security Guide:** `src/common/SECURITY.md`
- **Deployment Guide:** `DEPLOYMENT.md`
- **Production Readiness:** `.kiro/memory/PRODUCTION-READINESS-REPORT.md`

---

## Support

- **Technical Issues:** Create GitHub issue
- **Security Issues:** security@smarterp.com
- **Documentation:** See `/docs` folder

---

**Last Updated:** 2026-02-27
