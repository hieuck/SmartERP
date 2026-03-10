import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHRAttendanceLeave1741427000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create attendances table
    await queryRunner.query(`
      CREATE TABLE "attendances" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "employee_id" uuid NOT NULL,
        "date" date NOT NULL,
        "check_in" time NOT NULL,
        "check_out" time,
        "hours_worked" decimal(5,2) DEFAULT 0,
        "notes" text,
        "tenant_id" varchar NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "FK_attendance_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_attendance_tenant_employee_date" ON "attendances" ("tenant_id", "employee_id", "date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_attendance_tenant_date" ON "attendances" ("tenant_id", "date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_attendance_employee" ON "attendances" ("employee_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_attendance_tenant" ON "attendances" ("tenant_id")
    `);

    // Create leaves table
    await queryRunner.query(`
      CREATE TYPE "leave_type_enum" AS ENUM ('annual', 'sick', 'unpaid', 'maternity', 'paternity', 'compassionate')
    `);
    await queryRunner.query(`
      CREATE TYPE "leave_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "leaves" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "employee_id" uuid NOT NULL,
        "leave_type" leave_type_enum NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "days" decimal(5,2) NOT NULL,
        "status" leave_status_enum DEFAULT 'pending',
        "reason" text,
        "rejection_reason" text,
        "approved_by" varchar,
        "approved_at" timestamp,
        "tenant_id" varchar NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "FK_leave_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leave_tenant_employee_status" ON "leaves" ("tenant_id", "employee_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_leave_tenant_dates" ON "leaves" ("tenant_id", "start_date", "end_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_leave_employee" ON "leaves" ("employee_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_leave_tenant" ON "leaves" ("tenant_id")
    `);

    // Create leave_balances table
    await queryRunner.query(`
      CREATE TABLE "leave_balances" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "employee_id" uuid NOT NULL,
        "leave_type" leave_type_enum NOT NULL,
        "year" int NOT NULL,
        "allocated" decimal(5,2) DEFAULT 0,
        "used" decimal(5,2) DEFAULT 0,
        "remaining" decimal(5,2) DEFAULT 0,
        "tenant_id" varchar NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "FK_leave_balance_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_leave_balance_unique" ON "leave_balances" ("tenant_id", "employee_id", "leave_type", "year")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_leave_balance_employee" ON "leave_balances" ("employee_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_leave_balance_tenant" ON "leave_balances" ("tenant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "leave_balances"`);
    await queryRunner.query(`DROP TABLE "leaves"`);
    await queryRunner.query(`DROP TYPE "leave_status_enum"`);
    await queryRunner.query(`DROP TYPE "leave_type_enum"`);
    await queryRunner.query(`DROP TABLE "attendances"`);
  }
}
