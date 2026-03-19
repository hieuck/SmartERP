import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportTables1710838200000 implements MigrationInterface {
  name = 'CreateReportTables1710838200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reference" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "type" character varying NOT NULL DEFAULT 'table',
        "chartType" character varying,
        "sourceEntity" character varying NOT NULL,
        "query" jsonb,
        "filters" jsonb,
        "groupBy" jsonb,
        "orderBy" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "isPublic" boolean NOT NULL DEFAULT false,
        "isScheduled" boolean NOT NULL DEFAULT false,
        "tenantId" uuid NOT NULL,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reports" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reports_reference" UNIQUE ("reference")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reports_tenant_created"
      ON "reports" ("tenantId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reports_tenant_active"
      ON "reports" ("tenantId", "isActive")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "report_columns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reportId" uuid NOT NULL,
        "fieldName" character varying NOT NULL,
        "label" character varying NOT NULL,
        "type" character varying NOT NULL DEFAULT 'text',
        "aggregation" character varying NOT NULL DEFAULT 'none',
        "width" integer,
        "sequence" integer NOT NULL DEFAULT 0,
        "isVisible" boolean NOT NULL DEFAULT true,
        "isSortable" boolean NOT NULL DEFAULT true,
        "format" character varying,
        "tenantId" uuid NOT NULL,
        CONSTRAINT "PK_report_columns" PRIMARY KEY ("id"),
        CONSTRAINT "FK_report_columns_report"
          FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_report_columns_report_sequence"
      ON "report_columns" ("reportId", "sequence")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "report_executions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reportId" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "parameters" jsonb,
        "result" jsonb,
        "rowCount" integer NOT NULL DEFAULT 0,
        "executionTime" integer,
        "errorMessage" text,
        "tenantId" uuid NOT NULL,
        "executedBy" uuid NOT NULL,
        "executedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report_executions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_report_executions_report"
          FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_report_executions_report_executedAt"
      ON "report_executions" ("reportId", "executedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_executions_report_executedAt"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "report_executions"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_columns_report_sequence"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "report_columns"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reports_tenant_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reports_tenant_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
  }
}
