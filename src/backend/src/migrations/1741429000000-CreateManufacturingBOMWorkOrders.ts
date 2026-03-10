import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateManufacturingBOMWorkOrders1741429000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create work_centers table
    await queryRunner.query(`
      CREATE TABLE "work_centers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" varchar NOT NULL,
        "code" varchar NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "time_efficiency" decimal(10,2) NOT NULL DEFAULT 100,
        "capacity_per_cycle" decimal(10,2) NOT NULL DEFAULT 1,
        "cost_per_hour" decimal(15,2) NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_work_centers_tenant_code" UNIQUE ("tenant_id", "code")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_work_centers_tenant_id" ON "work_centers" ("tenant_id")`);

    // Create boms table
    await queryRunner.query(`
      CREATE TABLE "boms" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" varchar NOT NULL,
        "product_id" varchar NOT NULL,
        "reference" varchar NOT NULL UNIQUE,
        "product_qty" decimal(10,2) NOT NULL DEFAULT 1,
        "type" varchar NOT NULL DEFAULT 'manufacture',
        "is_active" boolean NOT NULL DEFAULT true,
        "total_cost" decimal(15,2) NOT NULL DEFAULT 0,
        "unit_cost" decimal(15,2) NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_boms_tenant_id" ON "boms" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_boms_tenant_product" ON "boms" ("tenant_id", "product_id")`);

    // Create bom_lines table
    await queryRunner.query(`
      CREATE TABLE "bom_lines" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" varchar NOT NULL,
        "bom_id" uuid NOT NULL,
        "product_id" varchar NOT NULL,
        "quantity" decimal(10,2) NOT NULL,
        "unit_cost" decimal(15,2) NOT NULL DEFAULT 0,
        "total_cost" decimal(15,2) NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_bom_lines_bom" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_bom_lines_tenant_id" ON "bom_lines" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_bom_lines_tenant_bom" ON "bom_lines" ("tenant_id", "bom_id")`);

    // Create routings table
    await queryRunner.query(`
      CREATE TABLE "routings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" varchar NOT NULL,
        "bom_id" varchar NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_routings_tenant_id" ON "routings" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_routings_tenant_bom" ON "routings" ("tenant_id", "bom_id")`);

    // Create operations table
    await queryRunner.query(`
      CREATE TABLE "operations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" varchar NOT NULL,
        "routing_id" uuid NOT NULL,
        "work_center_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "sequence" integer NOT NULL,
        "duration_expected" decimal(10,2) NOT NULL,
        "cost_per_hour" decimal(15,2) NOT NULL DEFAULT 0,
        "total_cost" decimal(15,2) NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_operations_routing" FOREIGN KEY ("routing_id") REFERENCES "routings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_operations_work_center" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_operations_tenant_id" ON "operations" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_operations_tenant_routing" ON "operations" ("tenant_id", "routing_id")`);

    // Create work_orders table
    await queryRunner.query(`
      CREATE TYPE "work_order_status_enum" AS ENUM ('draft', 'confirmed', 'in_progress', 'done', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "work_orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" varchar NOT NULL,
        "reference" varchar NOT NULL UNIQUE,
        "product_id" varchar NOT NULL,
        "bom_id" varchar,
        "qty_to_produce" decimal(10,2) NOT NULL,
        "qty_produced" decimal(10,2) NOT NULL DEFAULT 0,
        "status" "work_order_status_enum" NOT NULL DEFAULT 'draft',
        "date_planned_start" timestamp,
        "date_planned_finished" timestamp,
        "date_start" timestamp,
        "date_finished" timestamp,
        "responsible_id" varchar,
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_work_orders_tenant_id" ON "work_orders" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_work_orders_tenant_product" ON "work_orders" ("tenant_id", "product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_work_orders_tenant_status" ON "work_orders" ("tenant_id", "status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "work_orders"`);
    await queryRunner.query(`DROP TYPE "work_order_status_enum"`);
    await queryRunner.query(`DROP TABLE "operations"`);
    await queryRunner.query(`DROP TABLE "routings"`);
    await queryRunner.query(`DROP TABLE "bom_lines"`);
    await queryRunner.query(`DROP TABLE "boms"`);
    await queryRunner.query(`DROP TABLE "work_centers"`);
  }
}
