import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentTable1710843600000 implements MigrationInterface {
  name = 'CreateDocumentTable1710843600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."documents_type_enum" AS ENUM('file', 'folder')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."documents_accesslevel_enum" AS ENUM('private', 'team', 'public')
    `);
    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" "public"."documents_type_enum" NOT NULL DEFAULT 'file',
        "filePath" character varying,
        "mimeType" character varying,
        "size" bigint,
        "parentId" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "accessLevel" "public"."documents_accesslevel_enum" NOT NULL DEFAULT 'private',
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
      CREATE INDEX "IDX_documents_tenantId" ON "documents" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_parentId" ON "documents" ("parentId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_uploadedBy" ON "documents" ("uploadedBy")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_tenant_parent" ON "documents" ("tenantId", "parentId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_documents_tenant_parent"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_documents_uploadedBy"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_documents_parentId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_documents_tenantId"`);
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TYPE "public"."documents_accesslevel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."documents_type_enum"`);
  }
}
