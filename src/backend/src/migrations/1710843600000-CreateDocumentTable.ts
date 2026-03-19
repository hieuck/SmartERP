import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentTable1710843600000 implements MigrationInterface {
  name = 'CreateDocumentTable1710843600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'documents_accesslevel_enum'
        ) AND NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'documents_access_level_enum'
        ) THEN
          ALTER TYPE "public"."documents_accesslevel_enum"
          RENAME TO "documents_access_level_enum";
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'documents_type_enum'
        ) THEN
          CREATE TYPE "public"."documents_type_enum" AS ENUM('file', 'folder');
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'documents_access_level_enum'
        ) THEN
          CREATE TYPE "public"."documents_access_level_enum" AS ENUM('private', 'team', 'public');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" "public"."documents_type_enum" NOT NULL DEFAULT 'file',
        "filePath" character varying,
        "mimeType" character varying,
        "size" bigint,
        "parentId" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "accessLevel" "public"."documents_access_level_enum" NOT NULL DEFAULT 'private',
        "uploadedBy" uuid NOT NULL,
        "description" text,
        "tags" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_documents_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "tenantId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "name" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "type" "public"."documents_type_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "type" SET DEFAULT 'file'
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "filePath" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "mimeType" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "size" bigint
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "parentId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "version" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "version" SET DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "accessLevel" "public"."documents_access_level_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "accessLevel" SET DEFAULT 'private'
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "uploadedBy" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "description" text
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "tags" text
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documents_tenantId" ON "documents" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documents_parentId" ON "documents" ("parentId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documents_uploadedBy" ON "documents" ("uploadedBy")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documents_tenant_parent" ON "documents" ("tenantId", "parentId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_documents_tenant_parent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_documents_uploadedBy"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_documents_parentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_documents_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."documents_access_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."documents_accesslevel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."documents_type_enum"`);
  }
}
