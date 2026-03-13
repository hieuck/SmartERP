import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayroll1741428000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "salary_structures" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "base_salary" decimal(15,2) NOT NULL,
        "allowances" decimal(15,2) NOT NULL DEFAULT 0,
        "deductions" decimal(15,2) NOT NULL DEFAULT 0,
        "effective_from" date NOT NULL,
        "effective_to" date,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_salary_structures_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_salary_structures_employee" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_salary_structures_tenant_id" ON "salary_structures" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_salary_structures_tenant_employee" ON "salary_structures" ("tenant_id", "employee_id")
    `);

    await queryRunner.query(`
      CREATE TYPE "payslip_status_enum" AS ENUM ('draft', 'submitted', 'paid', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "payslips" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "salary_structure_id" uuid NOT NULL,
        "month" integer NOT NULL,
        "year" integer NOT NULL,
        "base_salary" decimal(15,2) NOT NULL,
        "allowances" decimal(15,2) NOT NULL DEFAULT 0,
        "deductions" decimal(15,2) NOT NULL DEFAULT 0,
        "tax_amount" decimal(15,2) NOT NULL DEFAULT 0,
        "gross_salary" decimal(15,2) NOT NULL,
        "net_salary" decimal(15,2) NOT NULL,
        "status" "payslip_status_enum" NOT NULL DEFAULT 'draft',
        "payment_date" date,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_payslips_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payslips_employee" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payslips_salary_structure" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payslips_tenant_id" ON "payslips" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_payslips_unique_month" ON "payslips" ("tenant_id", "employee_id", "month", "year")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payslips_employee" ON "payslips" ("tenant_id", "employee_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payslips_month" ON "payslips" ("tenant_id", "month", "year")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_payslips_month"`);
    await queryRunner.query(`DROP INDEX "IDX_payslips_employee"`);
    await queryRunner.query(`DROP INDEX "IDX_payslips_unique_month"`);
    await queryRunner.query(`DROP INDEX "IDX_payslips_tenant_id"`);
    await queryRunner.query(`DROP TABLE "payslips"`);
    await queryRunner.query(`DROP TYPE "payslip_status_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_salary_structures_tenant_employee"`);
    await queryRunner.query(`DROP INDEX "IDX_salary_structures_tenant_id"`);
    await queryRunner.query(`DROP TABLE "salary_structures"`);
  }
}
