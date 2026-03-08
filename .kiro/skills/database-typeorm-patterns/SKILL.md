---
name: database-typeorm-patterns
description: Database design and TypeORM patterns including migrations, query optimization, indexing, and relationships. Use when designing entities, writing migrations, or optimizing database queries.
---

# Database & TypeORM Patterns

## 1. Entity Design

### ✅ Base Entity Pattern

```typescript
@Entity()
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date; // Soft delete
}
```

### ✅ Entity with Relationships

```typescript
@Entity('products')
@Index(['tenantId', 'sku'], { unique: true })
export class Product extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  sku: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: OrderItem[];
}
```

## 2. Migrations

### ✅ Create Migration

```bash
npm run migration:generate -- src/migrations/CreateProductTable
```

### ✅ Migration File

```typescript
export class CreateProductTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCTS_TENANT',
        columnNames: ['tenantId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products');
  }
}
```

## 3. Query Optimization

### ✅ Eager Loading (Avoid N+1)

```typescript
// ❌ BAD - N+1 queries
const products = await this.productRepo.find();
for (const product of products) {
  product.category = await this.categoryRepo.findOne(product.categoryId);
}

// ✅ GOOD - Single query with join
const products = await this.productRepo.find({
  relations: ['category'],
});

// ✅ BETTER - Query builder with select
const products = await this.productRepo
  .createQueryBuilder('product')
  .leftJoinAndSelect('product.category', 'category')
  .select(['product', 'category.name'])
  .getMany();
```

### ✅ Pagination

```typescript
async findAll(page: number, limit: number) {
  const [data, total] = await this.productRepo.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

### ✅ Selective Fields

```typescript
// ❌ BAD - Loads all fields
const products = await this.productRepo.find();

// ✅ GOOD - Only needed fields
const products = await this.productRepo
  .createQueryBuilder('product')
  .select(['product.id', 'product.name', 'product.price'])
  .getMany();
```

## 4. Indexing Strategy

### ✅ Index Types

```typescript
@Entity()
export class Product {
  // Single column index
  @Index()
  @Column()
  sku: string;

  // Composite index
  @Index(['tenantId', 'status'])
  @Column()
  tenantId: string;

  @Column()
  status: string;

  // Unique index
  @Index({ unique: true })
  @Column()
  email: string;

  // Full-text search (PostgreSQL)
  @Index('IDX_PRODUCT_NAME_FULLTEXT', { fulltext: true })
  @Column()
  name: string;
}
```

### ✅ When to Index

- ✅ Foreign keys (tenantId, categoryId)
- ✅ Frequently queried columns (status, email)
- ✅ Columns in WHERE clauses
- ✅ Columns in ORDER BY
- ❌ Small tables (< 1000 rows)
- ❌ Columns with low cardinality (boolean)
- ❌ Frequently updated columns

## 5. Transactions

### ✅ Transaction Pattern

```typescript
async createOrderWithItems(orderData, items, user) {
  return this.dataSource.transaction(async (manager) => {
    // 1. Create order
    const order = manager.create(Order, {
      ...orderData,
      tenantId: user.tenantId,
      createdBy: user.id,
    });
    await manager.save(order);

    // 2. Create order items
    for (const item of items) {
      const orderItem = manager.create(OrderItem, {
        ...item,
        orderId: order.id,
        tenantId: user.tenantId,
      });
      await manager.save(orderItem);

      // 3. Update inventory
      await manager.decrement(
        Inventory,
        { productId: item.productId },
        'quantity',
        item.quantity
      );
    }

    return order;
  });
}
```

## 6. Query Performance

### ✅ Use Query Builder for Complex Queries

```typescript
const products = await this.productRepo
  .createQueryBuilder('product')
  .leftJoinAndSelect('product.category', 'category')
  .where('product.tenantId = :tenantId', { tenantId })
  .andWhere('product.price BETWEEN :min AND :max', { min, max })
  .orderBy('product.createdAt', 'DESC')
  .take(10)
  .getMany();
```

### ✅ Raw Queries for Complex Logic

```typescript
const result = await this.dataSource.query(
  `
  SELECT 
    p.id,
    p.name,
    COUNT(oi.id) as order_count,
    SUM(oi.quantity * oi.price) as total_revenue
  FROM products p
  LEFT JOIN order_items oi ON p.id = oi.product_id
  WHERE p.tenant_id = $1
  GROUP BY p.id, p.name
  HAVING COUNT(oi.id) > 0
  ORDER BY total_revenue DESC
  LIMIT 10
  `,
  [tenantId],
);
```

## 7. Soft Delete

### ✅ Soft Delete Pattern

```typescript
@Entity()
export class Product {
  @DeleteDateColumn()
  deletedAt: Date;
}

// Soft delete
await this.productRepo.softDelete(id);

// Restore
await this.productRepo.restore(id);

// Find including deleted
await this.productRepo.find({ withDeleted: true });

// Find only deleted
await this.productRepo.find({
  where: { deletedAt: Not(IsNull()) },
  withDeleted: true,
});
```

## 8. Database Best Practices

### ✅ Connection Pooling

```typescript
// typeorm.config.ts
export default {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  extra: {
    max: 20, // Max connections
    min: 5, // Min connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};
```

### ✅ Query Logging

```typescript
// Enable in development
logging: process.env.NODE_ENV === 'development',
logger: 'advanced-console',
maxQueryExecutionTime: 1000, // Warn if query > 1s
```

## Database Checklist

- [ ] ✅ All entities extend BaseEntity
- [ ] ✅ Tenant isolation on all entities
- [ ] ✅ Soft delete enabled (deletedAt)
- [ ] ✅ Audit trail (createdBy, updatedBy)
- [ ] ✅ Indexes on foreign keys
- [ ] ✅ Indexes on frequently queried columns
- [ ] ✅ Migrations for schema changes
- [ ] ✅ Transactions for multi-step operations
- [ ] ✅ Eager loading to avoid N+1
- [ ] ✅ Pagination for large datasets
- [ ] ✅ Connection pooling configured
- [ ] ✅ Query logging in development
