---
name: documentation-standards
description: Documentation standards for code comments, API docs, and technical documentation. Use when writing documentation, API specs, or code comments.
---

# Documentation Standards

## 1. Code Comments

```typescript
/**
 * Creates a new product with tenant isolation and audit trail
 * @param createDto - Product creation data
 * @param user - Current authenticated user
 * @returns Created product with generated ID
 * @throws ConflictException if SKU already exists
 */
async createProduct(createDto: CreateProductDto, user: User): Promise<Product> {
  // Validate SKU uniqueness within tenant
  const existing = await this.findBySku(createDto.sku, user);
  if (existing) {
    throw new ConflictException('SKU already exists');
  }

  // Create with audit trail
  const product = {
    ...createDto,
    tenantId: user.tenantId,
    createdBy: user.id,
  };

  return this.secureRepo.save(user, product);
}
```

## 2. API Documentation (Swagger)

```typescript
@ApiTags('products')
@Controller('products')
export class ProductsController {
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  async create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }
}
```

## 3. README Structure

```markdown
# Project Name

## Overview

Brief description

## Installation

npm install

## Usage

npm run start

## Testing

npm run test

## Architecture

Link to architecture docs

## Contributing

Guidelines for contributors
```

## 4. Inline Comments

```typescript
// ✅ GOOD: Explains WHY
// Use cursor-based pagination for better performance with large datasets
const items = await this.findWithCursor(cursor, limit);

// ❌ BAD: Explains WHAT (obvious from code)
// Loop through items
for (const item of items) {
}
```
