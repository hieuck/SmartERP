import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateEcommerceProductCatalogCart20260307215647
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create product_catalog table
    await queryRunner.createTable(
      new Table({
        name: 'product_catalog',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sku',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'shortDescription',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'compareAtPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'costPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'stockQuantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'minStockLevel',
            type: 'int',
            default: 0,
          },
          {
            name: 'trackInventory',
            type: 'boolean',
            default: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'active', 'inactive', 'out_of_stock'],
            default: "'draft'",
          },
          {
            name: 'slug',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metaTitle',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metaDescription',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metaKeywords',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'featuredImage',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'images',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'categoryId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'weight',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'length',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'width',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'height',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'requiresShipping',
            type: 'boolean',
            default: true,
          },
          {
            name: 'variants',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'displayOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'isPublished',
            type: 'boolean',
            default: true,
          },
          {
            name: 'publishedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'createdBy',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for product_catalog
    await queryRunner.query(
      `CREATE INDEX "IDX_product_catalog_tenantId" ON "product_catalog" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_catalog_sku" ON "product_catalog" ("sku")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_catalog_slug" ON "product_catalog" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_catalog_status" ON "product_catalog" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_catalog_categoryId" ON "product_catalog" ("categoryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_catalog_isPublished" ON "product_catalog" ("isPublished")`,
    );

    // Create foreign key for createdBy
    await queryRunner.createForeignKey(
      'product_catalog',
      new TableForeignKey({
        columnNames: ['createdBy'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create shopping_carts table
    await queryRunner.createTable(
      new Table({
        name: 'shopping_carts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sessionId',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'abandoned', 'converted', 'expired'],
            default: "'active'",
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'tax',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'shipping',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'discount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'couponCode',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shippingAddress',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'billingAddress',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'convertedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'orderId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for shopping_carts
    await queryRunner.query(
      `CREATE INDEX "IDX_shopping_carts_tenantId" ON "shopping_carts" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shopping_carts_sessionId" ON "shopping_carts" ("sessionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shopping_carts_userId" ON "shopping_carts" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shopping_carts_status" ON "shopping_carts" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shopping_carts_expiresAt" ON "shopping_carts" ("expiresAt")`,
    );

    // Create foreign key for userId
    await queryRunner.createForeignKey(
      'shopping_carts',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create cart_items table
    await queryRunner.createTable(
      new Table({
        name: 'cart_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cartId',
            type: 'uuid',
          },
          {
            name: 'productId',
            type: 'uuid',
          },
          {
            name: 'productName',
            type: 'varchar',
          },
          {
            name: 'productSku',
            type: 'varchar',
          },
          {
            name: 'productImage',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'quantity',
            type: 'int',
            default: 1,
          },
          {
            name: 'selectedVariant',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
        ],
      }),
      true,
    );

    // Create indexes for cart_items
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_items_cartId" ON "cart_items" ("cartId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_items_productId" ON "cart_items" ("productId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_items_tenantId" ON "cart_items" ("tenantId")`,
    );

    // Create foreign keys for cart_items
    await queryRunner.createForeignKey(
      'cart_items',
      new TableForeignKey({
        columnNames: ['cartId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shopping_carts',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cart_items',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'product_catalog',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('cart_items', true);
    await queryRunner.dropTable('shopping_carts', true);
    await queryRunner.dropTable('product_catalog', true);
  }
}
