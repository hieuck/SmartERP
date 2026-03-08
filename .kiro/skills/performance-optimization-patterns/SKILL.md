---
name: performance-optimization-patterns
description: Performance optimization patterns including N+1 query detection, caching strategies, profiling, and monitoring. Use when optimizing slow endpoints, reducing database load, or improving response times.
---

# Performance Optimization Patterns

## 1. N+1 Query Detection

### ❌ Problem

```typescript
// Loads 1 + N queries
const orders = await this.orderRepo.find();
for (const order of orders) {
  order.customer = await this.customerRepo.findOne(order.customerId);
}
```

### ✅ Solution

```typescript
// Single query with join
const orders = await this.orderRepo.find({
  relations: ['customer'],
});
```

## 2. Caching Strategy

### ✅ Cache Frequently Accessed Data

```typescript
async findById(id: string) {
  const cacheKey = `product:${id}`;

  return this.cacheService.getOrSet(
    cacheKey,
    async () => this.productRepo.findOne({ where: { id } }),
    CacheTTL.MEDIUM // 5 minutes
  );
}
```

### ✅ Cache Invalidation

```typescript
async update(id: string, data: UpdateProductDto) {
  const product = await this.productRepo.save({ id, ...data });

  // Invalidate cache
  await this.cacheService.del(`product:${id}`);
  await this.cacheService.del('products:list');

  return product;
}
```

## 3. Database Indexing

```typescript
@Entity()
@Index(['tenantId', 'status']) // Composite index
export class Order {
  @Index() // Single index
  @Column()
  customerId: string;
}
```

## 4. Query Optimization

### ✅ Select Only Needed Fields

```typescript
const products = await this.productRepo
  .createQueryBuilder('product')
  .select(['product.id', 'product.name', 'product.price'])
  .getMany();
```

### ✅ Use Pagination

```typescript
const products = await this.productRepo.find({
  take: 20,
  skip: (page - 1) * 20,
});
```

## 5. Profiling

```typescript
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (duration > 1000) {
          this.logger.warn(`Slow request: ${duration}ms`);
        }
      }),
    );
  }
}
```

## Performance Checklist

- [ ] ✅ No N+1 queries
- [ ] ✅ Caching implemented
- [ ] ✅ Database indexes
- [ ] ✅ Query optimization
- [ ] ✅ Pagination
- [ ] ✅ Performance monitoring
