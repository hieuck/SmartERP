import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployeeTable1710839400000 implements MigrationInterface {
  name = 'CreateEmployeeTable1710839400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employees" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        "last_synced_at" TIMESTAMP,
        "sync_status" character varying NOT NULL DEFAULT 'synced',
        "offline_id" uuid,
        "user_id" uuid,
        "employee_code" character varying NOT NULL,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying,
        "department" character varying,
        "position" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        "employment_type" character varying NOT NULL DEFAULT 'full_time',
        "hire_date" date,
        "termination_date" date,
        "base_salary" numeric(15,2),
        "manager_id" uuid,
        "notes" text,
        "emergency_contact" jsonb,
        "address" jsonb,
        CONSTRAINT "PK_employees" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_employees_tenant_employee_code" UNIQUE ("tenant_id", "employee_code"),
        CONSTRAINT "UQ_employees_tenant_email" UNIQUE ("tenant_id", "email"),
        CONSTRAINT "FK_employees_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_employees_manager_id" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_employees_tenant_id"
      ON "employees" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_employees_tenant_employee_code"
      ON "employees" ("tenant_id", "employee_code")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_employees_tenant_email"
      ON "employees" ("tenant_id", "email")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_employees_status"
      ON "employees" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_employees_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_employees_tenant_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_employees_tenant_employee_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_employees_tenant_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employees"`);
  }
}
