import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductCatalogTable1761000000000 implements MigrationInterface {
  name = 'CreateProductCatalogTable1761000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_catalog_status_enum') THEN
          CREATE TYPE "product_catalog_status_enum" AS ENUM (
            'draft',
            'active',
            'inactive',
            'out_of_stock',
            'discontinued'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_catalog" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sku" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "shortDescription" text,
        "price" numeric(10,2) NOT NULL,
        "compareAtPrice" numeric(10,2),
        "costPrice" numeric(10,2),
        "stockQuantity" integer NOT NULL DEFAULT 0,
        "minStockLevel" integer NOT NULL DEFAULT 0,
        "trackInventory" boolean NOT NULL DEFAULT true,
        "status" "product_catalog_status_enum" NOT NULL DEFAULT 'draft',
        "slug" character varying,
        "metaTitle" character varying,
        "metaDescription" text,
        "metaKeywords" text,
        "featuredImage" character varying,
        "images" text,
        "categoryId" character varying,
        "tags" text,
        "weight" numeric(10,2),
        "length" numeric(10,2),
        "width" numeric(10,2),
        "height" numeric(10,2),
        "requiresShipping" boolean NOT NULL DEFAULT true,
        "variants" jsonb,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isPublished" boolean NOT NULL DEFAULT true,
        "publishedAt" TIMESTAMP,
        "tenantId" uuid NOT NULL,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_catalog" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_catalog_sku"
      ON "product_catalog" ("sku")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_catalog_tenant"
      ON "product_catalog" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_catalog_tenant_status"
      ON "product_catalog" ("tenantId", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_catalog_tenant_category"
      ON "product_catalog" ("tenantId", "categoryId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_catalog_tenant_published"
      ON "product_catalog" ("tenantId", "isPublished")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_catalog_slug"
      ON "product_catalog" ("slug")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_catalog_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_catalog_tenant_published"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_catalog_tenant_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_catalog_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_catalog_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_catalog_sku"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_catalog"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "product_catalog_status_enum"`);
  }
}
