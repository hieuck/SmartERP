---
name: api-design-patterns
description: RESTful API design patterns including pagination, filtering, error handling, and versioning. Use when designing API endpoints, implementing controllers, or standardizing API responses.
---

# API Design Patterns

## 1. RESTful Conventions

### ✅ Resource Naming

```
GET    /api/products           # List all
GET    /api/products/:id       # Get one
POST   /api/products           # Create
PUT    /api/products/:id       # Update (full)
PATCH  /api/products/:id       # Update (partial)
DELETE /api/products/:id       # Delete
```

### ✅ Nested Resources

```
GET    /api/orders/:id/items           # Order items
POST   /api/orders/:id/items           # Add item
DELETE /api/orders/:id/items/:itemId   # Remove item
```

## 2. Pagination

### ✅ Cursor-Based (Recommended)

```typescript
@Get()
async findAll(
  @Query('cursor') cursor?: string,
  @Query('limit') limit: number = 20,
) {
  const items = await this.service.findAll(cursor, limit);

  return {
    data: items,
    pagination: {
      nextCursor: items[items.length - 1]?.id,
      hasMore: items.length === limit,
    },
  };
}
```

### ✅ Offset-Based (Simple)

```typescript
@Get()
async findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20,
) {
  const [data, total] = await this.service.findAndCount(page, limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

## 3. Filtering & Sorting

```typescript
@Get()
async findAll(
  @Query('status') status?: string,
  @Query('minPrice') minPrice?: number,
  @Query('sort') sort: string = 'createdAt',
  @Query('order') order: 'ASC' | 'DESC' = 'DESC',
) {
  return this.service.findAll({
    where: { status, price: MoreThanOrEqual(minPrice) },
    order: { [sort]: order },
  });
}
```

## 4. Response Format

### ✅ Success Response

```typescript
{
  "success": true,
  "data": { "id": "1", "name": "Product" },
  "message": "Product created successfully"
}
```

### ✅ Error Response

```typescript
{
  "success": false,
  "error": "Product not found",
  "statusCode": 404,
  "timestamp": "2026-03-08T21:00:00Z",
  "path": "/api/products/123"
}
```

## 5. Error Handling

```typescript
@Post()
async create(@Body() dto: CreateProductDto) {
  try {
    const product = await this.service.create(dto);
    return { success: true, data: product };
  } catch (error) {
    if (error instanceof ConflictException) {
      throw new HttpException({
        success: false,
        error: 'Product already exists',
        statusCode: 409,
      }, 409);
    }
    throw error;
  }
}
```

## 6. Versioning

```typescript
// URL versioning
@Controller({ path: 'products', version: '1' })
export class ProductsV1Controller {}

@Controller({ path: 'products', version: '2' })
export class ProductsV2Controller {}

// Usage: /api/v1/products, /api/v2/products
```

## API Checklist

- [ ] ✅ RESTful naming conventions
- [ ] ✅ Pagination implemented
- [ ] ✅ Filtering and sorting
- [ ] ✅ Consistent response format
- [ ] ✅ Proper error handling
- [ ] ✅ API versioning strategy
- [ ] ✅ Rate limiting
- [ ] ✅ API documentation (Swagger)
