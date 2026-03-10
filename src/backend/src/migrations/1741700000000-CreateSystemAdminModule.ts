import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemAdminModule1741700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "setting_category_enum" AS ENUM (
        'general', 'email', 'notification', 'security', 'backup', 'integration', 'performance'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "setting_type_enum" AS ENUM ('string', 'number', 'boolean', 'json')
    `);

    await queryRunner.query(`
      CREATE TYPE "job_status_enum" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TYPE "job_priority_enum" AS ENUM ('low', 'normal', 'high', 'critical')
    `);

    await queryRunner.query(`
      CREATE TYPE "error_severity_enum" AS ENUM ('low', 'medium', 'high', 'critical')
    `);

    // Create system_settings table
    await queryRunner.query(`
      CREATE TABLE "system_settings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" varchar NOT NULL,
        "key" varchar NOT NULL,
        "value" text NOT NULL,
        "type" "setting_type_enum" NOT NULL DEFAULT 'string',
        "category" "setting_category_enum" NOT NULL DEFAULT 'general',
        "description" text,
        "isSecret" boolean NOT NULL DEFAULT false,
        "isEditable" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "updatedBy" varchar
      )
    `);

    // Create indexes for system_settings
    await queryRunner.query(`
      CREATE INDEX "IDX_system_settings_tenantId" ON "system_settings" ("tenantId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_system_settings_tenantId_key" ON "system_settings" ("tenantId", "key")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_settings_tenantId_category" ON "system_settings" ("tenantId", "category")
    `);

    // Create background_jobs table
    await queryRunner.query(`
      CREATE TABLE "background_jobs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" varchar NOT NULL,
        "jobType" varchar NOT NULL,
        "description" text,
        "status" "job_status_enum" NOT NULL DEFAULT 'pending',
        "priority" "job_priority_enum" NOT NULL DEFAULT 'normal',
        "payload" jsonb,
        "result" jsonb,
        "errorMessage" text,
        "stackTrace" text,
        "attempts" int NOT NULL DEFAULT 0,
        "maxAttempts" int NOT NULL DEFAULT 3,
        "scheduledAt" timestamp,
        "startedAt" timestamp,
        "completedAt" timestamp,
        "durationMs" int,
        "createdBy" varchar,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes for background_jobs
    await queryRunner.query(`
      CREATE INDEX "IDX_background_jobs_tenantId" ON "background_jobs" ("tenantId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_background_jobs_tenantId_status" ON "background_jobs" ("tenantId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_background_jobs_tenantId_jobType" ON "background_jobs" ("tenantId", "jobType")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_background_jobs_scheduledAt" ON "background_jobs" ("scheduledAt")
    `);

    // Create error_logs table
    await queryRunner.query(`
      CREATE TABLE "error_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" varchar NOT NULL,
        "errorType" varchar NOT NULL,
        "message" text NOT NULL,
        "stackTrace" text,
        "severity" "error_severity_enum" NOT NULL DEFAULT 'medium',
        "context" jsonb,
        "userId" varchar,
        "endpoint" varchar,
        "method" varchar,
        "ipAddress" varchar,
        "userAgent" varchar,
        "resolved" boolean NOT NULL DEFAULT false,
        "resolvedBy" varchar,
        "resolvedAt" timestamp,
        "resolution" text,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes for error_logs
    await queryRunner.query(`
      CREATE INDEX "IDX_error_logs_tenantId" ON "error_logs" ("tenantId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_error_logs_tenantId_severity" ON "error_logs" ("tenantId", "severity")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_error_logs_tenantId_errorType" ON "error_logs" ("tenantId", "errorType")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_error_logs_createdAt" ON "error_logs" ("createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_error_logs_resolved" ON "error_logs" ("resolved")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE "error_logs"`);
    await queryRunner.query(`DROP TABLE "background_jobs"`);
    await queryRunner.query(`DROP TABLE "system_settings"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "error_severity_enum"`);
    await queryRunner.query(`DROP TYPE "job_priority_enum"`);
    await queryRunner.query(`DROP TYPE "job_status_enum"`);
    await queryRunner.query(`DROP TYPE "setting_type_enum"`);
    await queryRunner.query(`DROP TYPE "setting_category_enum"`);
  }
}
