import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentTable1710850000000 implements MigrationInterface {
  name = 'CreateDocumentTable1710850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'documents_type_enum') THEN
          CREATE TYPE "documents_type_enum" AS ENUM ('file', 'folder');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'documents_access_level_enum') THEN
          CREATE TYPE "documents_access_level_enum" AS ENUM ('private', 'team', 'public');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" "documents_type_enum" NOT NULL DEFAULT 'file',
        "filePath" character varying,
        "mimeType" character varying,
        "size" bigint,
        "parentId" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "accessLevel" "documents_access_level_enum" NOT NULL DEFAULT 'private',
        "uploadedBy" uuid NOT NULL,
        "description" text,
        "tags" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_documents_tenantId" ON "documents" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_documents_parentId" ON "documents" ("parentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_documents_uploadedBy" ON "documents" ("uploadedBy")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_documents_name" ON "documents" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_uploadedBy"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_parentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "documents_access_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "documents_type_enum"`);
  }
}
