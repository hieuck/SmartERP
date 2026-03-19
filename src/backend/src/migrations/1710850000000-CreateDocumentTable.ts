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
      ALTER TABLE "documents"
      ALTER COLUMN "type" TYPE "documents_type_enum"
      USING "type"::text::"documents_type_enum";
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
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_documents_tenant_parent" ON "documents" ("tenantId", "parentId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_tenant_parent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_uploadedBy"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_parentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_tenantId"`);
  }
}
