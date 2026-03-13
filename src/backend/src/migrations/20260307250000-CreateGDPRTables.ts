import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGDPRTables20260307250000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "consent_type_enum" AS ENUM ('terms_of_service', 'privacy_policy', 'marketing_emails', 'data_processing', 'cookies');`,
    );
    await queryRunner.query(
      `CREATE TYPE "export_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed', 'expired');`,
    );
    await queryRunner.query(`CREATE TYPE "export_format_enum" AS ENUM ('json', 'csv', 'pdf');`);
    await queryRunner.query(
      `CREATE TYPE "deletion_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed');`,
    );

    await queryRunner.query(`
      CREATE TABLE "consents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "type" "consent_type_enum" NOT NULL,
        "granted" boolean NOT NULL DEFAULT false,
        "version" varchar,
        "ipAddress" varchar,
        "userAgent" varchar,
        "revokedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_consent_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_consent_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_consents_tenant" ON "consents"("tenantId");`);
    await queryRunner.query(`CREATE INDEX "idx_consents_user" ON "consents"("userId");`);
    await queryRunner.query(`CREATE INDEX "idx_consents_type" ON "consents"("type");`);
    await queryRunner.query(
      `CREATE INDEX "idx_consents_tenant_user_type" ON "consents"("tenantId", "userId", "type");`,
    );

    await queryRunner.query(`
      CREATE TABLE "data_export_requests" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "status" "export_status_enum" NOT NULL DEFAULT 'pending',
        "format" "export_format_enum" NOT NULL DEFAULT 'json',
        "fileUrl" varchar,
        "fileSize" bigint,
        "expiresAt" timestamp,
        "errorMessage" text,
        "completedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_export_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_export_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_export_tenant" ON "data_export_requests"("tenantId");`,
    );
    await queryRunner.query(`CREATE INDEX "idx_export_user" ON "data_export_requests"("userId");`);
    await queryRunner.query(
      `CREATE INDEX "idx_export_status" ON "data_export_requests"("status");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_export_tenant_user" ON "data_export_requests"("tenantId", "userId");`,
    );

    await queryRunner.query(`
      CREATE TABLE "data_deletion_requests" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "status" "deletion_status_enum" NOT NULL DEFAULT 'pending',
        "reason" text NOT NULL,
        "approvedBy" uuid,
        "approvedAt" timestamp,
        "rejectionReason" text,
        "errorMessage" text,
        "completedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_deletion_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_deletion_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_deletion_approvedBy" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_deletion_tenant" ON "data_deletion_requests"("tenantId");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_deletion_user" ON "data_deletion_requests"("userId");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_deletion_status" ON "data_deletion_requests"("status");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_deletion_tenant_status" ON "data_deletion_requests"("tenantId", "status");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "data_deletion_requests" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "data_export_requests" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consents" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "deletion_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "export_format_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "export_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "consent_type_enum";`);
  }
}
