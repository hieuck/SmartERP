# Quick Start Guide - SmartERP Templates

Hướng dẫn nhanh để sử dụng templates tạo CRUD modules.

---

## 🚀 Tạo Module Mới trong 5 Phút

### Bước 1: Chạy Generator Script

```powershell
.\scripts\generate-crud-module.ps1 -EntityName "Product" -Domain "inventory"
```

**Output:**

```
SmartERP CRUD Module Generator
===============================

Entity Information:
  PascalCase: Product
  kebab-case: product
  camelCase:  product
  Domain:     inventory

Output Path: src/backend/domains/inventory/product

Creating directory structure...
Generating files...
  - Generating module...
    Created: src/backend/domains/inventory/product/product.module.ts
  - Generating test...
    Created: src/backend/domains/inventory/product/product.service.spec.ts
  - Generating service...
    Created: src/backend/domains/inventory/product/product.service.ts
  - Generating controller...
    Created: src/backend/domains/inventory/product/product.controller.ts

Generating DTO placeholders...
  Created: src/backend/domains/inventory/product/dto/create-product.dto.ts
  Created: src/backend/domains/inventory/product/dto/update-product.dto.ts

Generating Entity placeholder...
  Created: src/backend/domains/inventory/product/entities/product.entity.ts

CRUD Module Generated Successfully!
```

### Bước 2: Update Entity

```typescript
// src/backend/domains/inventory/product/entities/product.entity.ts
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

@Entity('products')
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'status'])
export class Product extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: 'active' })
  status: string;
}
```

### Bước 3: Update DTOs

```typescript
// src/backend/domains/inventory/product/dto/create-product.dto.ts
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Product code', example: 'PROD-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Product name', example: 'Laptop' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Price', example: 1500.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Stock', example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;
}
```

### Bước 4: Import Module

```typescript
// src/backend/domains/inventory/inventory.module.ts
import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';

@Module({
  imports: [ProductModule],
  exports: [ProductModule],
})
export class InventoryModule {}
```

### Bước 5: Test

```bash
# Run tests
npm test -- product.service.spec.ts

# Start server
npm run start:dev

# Test API
curl http://localhost:3000/api/products
```

---

## ✅ Checklist Sau Khi Generate

### Security

- [ ] SecureRepository được sử dụng
- [ ] Tenant isolation hoạt động
- [ ] Permission checks đầy đủ
- [ ] User context được truyền

### Entity

- [ ] Indexes được thêm
- [ ] Relations được định nghĩa
- [ ] Constraints được set
- [ ] Soft delete enabled

### DTOs

- [ ] Validation rules đầy đủ
- [ ] Swagger documentation
- [ ] Required/Optional fields đúng
- [ ] Type validation

### Service

- [ ] Business logic được thêm
- [ ] Cache invalidation
- [ ] Error handling
- [ ] Custom methods

### Controller

- [ ] Custom endpoints
- [ ] Query parameters
- [ ] Response format
- [ ] Error responses

### Tests

- [ ] CRUD operations
- [ ] Business logic
- [ ] Security tests
- [ ] Edge cases

---

## 📝 Common Patterns

### 1. Add Custom Business Method

```typescript
// In service
async findByCode(user: User, code: string): Promise<Product | null> {
  return this.secureProductRepo.findOne(user, {
    where: { code },
  });
}

// In controller
@Get('code/:code')
@ApiOperation({ summary: 'Get product by code' })
findByCode(@CurrentUser() user: User, @Param('code') code: string) {
  return this.productService.findByCode(user, code);
}
```

### 2. Add Status Workflow

```typescript
// In service
async activate(user: User, id: string): Promise<Product> {
  const product = await this.findOne(user, id);

  if (product.status === 'active') {
    throw new BadRequestException('Product is already active');
  }

  product.status = 'active';
  return this.secureProductRepo.save(user, product);
}

// In controller
@Patch(':id/activate')
@ApiOperation({ summary: 'Activate product' })
activate(@CurrentUser() user: User, @Param('id') id: string) {
  return this.productService.activate(user, id);
}
```

### 3. Add Relations

```typescript
// In entity
@ManyToOne(() => Category)
@JoinColumn({ name: 'category_id' })
category: Category;

// In service - load with relations
async findOne(user: User, id: string): Promise<Product> {
  const cacheKey = generateCacheKey('product', user.tenantId, id);

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      const product = await this.secureProductRepo.findOne(user, {
        where: { id },
        relations: ['category'], // Add relations here
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return product;
    },
    CacheTTL.MEDIUM,
  );
}
```

---

## 🎯 Best Practices

### 1. Always Use SecureRepository

```typescript
// ❌ WRONG
const products = await this.productRepository.find({ where: { status: 'active' } });

// ✅ CORRECT
const products = await this.secureProductRepo.find(user, { where: { status: 'active' } });
```

### 2. Cache Invalidation

```typescript
// Always invalidate cache after update/delete
async update(user: User, id: string, dto: UpdateProductDto): Promise<Product> {
  const product = await this.findOne(user, id);
  Object.assign(product, dto);
  const updated = await this.secureProductRepo.save(user, product);

  // Invalidate cache
  const cacheKey = generateCacheKey('product', user.tenantId, id);
  await this.cacheService.del(cacheKey);

  return updated;
}
```

### 3. Business Validation

```typescript
async create(user: User, dto: CreateProductDto): Promise<Product> {
  // Check uniqueness
  const existing = await this.findByCode(user, dto.code);
  if (existing) {
    throw new ConflictException(`Product with code ${dto.code} already exists`);
  }

  // Validate business rules
  if (dto.price < 0) {
    throw new BadRequestException('Price cannot be negative');
  }

  return this.secureProductRepo.save(user, dto);
}
```

---

## 🐛 Troubleshooting

### Issue: "Template not found"

**Solution:** Đảm bảo bạn đang chạy script từ root directory của project.

```powershell
# Check current directory
pwd

# Should be: E:\GitHub\QuanLyKhoTuongThachCao\smart-erp
# If not, cd to project root
cd E:\GitHub\QuanLyKhoTuongThachCao\smart-erp
```

### Issue: "Directory already exists"

**Solution:** Script sẽ hỏi có muốn overwrite không. Chọn 'y' để overwrite hoặc 'n' để cancel.

```powershell
Warning: Directory already exists: src/backend/domains/inventory/product
Do you want to overwrite? (y/N): y
```

### Issue: "Cannot find module"

**Solution:** Import module vào parent module.

```typescript
// src/backend/app.module.ts
import { ProductModule } from './domains/inventory/product/product.module';

@Module({
  imports: [
    // ... other modules
    ProductModule,
  ],
})
export class AppModule {}
```

---

## 📚 More Examples

Xem thêm examples chi tiết tại: [templates/EXAMPLES.md](./EXAMPLES.md)

---

## 🎓 Full Documentation

Đọc full documentation tại: [templates/README.md](./README.md)

---

**Last Updated:** 2026-03-09  
**Version:** 1.0.0
