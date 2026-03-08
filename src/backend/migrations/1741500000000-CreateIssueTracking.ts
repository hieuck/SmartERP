import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIssueTracking1741500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "issue_status_enum" AS ENUM ('new', 'in_progress', 'resolved', 'closed');
      CREATE TYPE "issue_priority_enum" AS ENUM ('low', 'medium', 'high', 'critical');
      CREATE TYPE "issue_type_enum" AS ENUM ('bug', 'feature_request', 'task', 'question');
    `);

    // Create issues table
    await queryRunner.query(`
      CREATE TABLE "issues" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" varchar NOT NULL,
        "reference" varchar UNIQUE NOT NULL,
        "title" varchar NOT NULL,
        "description" text NOT NULL,
        "status" "issue_status_enum" NOT NULL DEFAULT 'new',
        "priority" "issue_priority_enum" NOT NULL DEFAULT 'medium',
        "type" "issue_type_enum" NOT NULL DEFAULT 'task',
        "reporter_id" varchar NOT NULL,
        "assignee_id" varchar,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "resolved_at" timestamp,
        "closed_at" timestamp
      );
    `);

    // Create indexes for issues
    await queryRunner.query(`
      CREATE INDEX "IDX_issues_tenant_id" ON "issues" ("tenant_id");
      CREATE INDEX "IDX_issues_tenant_status" ON "issues" ("tenant_id", "status");
      CREATE INDEX "IDX_issues_tenant_assignee" ON "issues" ("tenant_id", "assignee_id");
      CREATE INDEX "IDX_issues_tenant_reporter" ON "issues" ("tenant_id", "reporter_id");
    `);

    // Create issue_comments table
    await queryRunner.query(`
      CREATE TABLE "issue_comments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" varchar NOT NULL,
        "issue_id" uuid NOT NULL,
        "author_id" varchar NOT NULL,
        "content" text NOT NULL,
        "is_internal" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_issue_comments_issue" FOREIGN KEY ("issue_id") 
          REFERENCES "issues"("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for issue_comments
    await queryRunner.query(`
      CREATE INDEX "IDX_issue_comments_tenant_id" ON "issue_comments" ("tenant_id");
      CREATE INDEX "IDX_issue_comments_tenant_issue" ON "issue_comments" ("tenant_id", "issue_id");
    `);

    // Create issue_attachments table
    await queryRunner.query(`
      CREATE TABLE "issue_attachments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" varchar NOT NULL,
        "issue_id" uuid NOT NULL,
        "uploaded_by" varchar NOT NULL,
        "file_name" varchar NOT NULL,
        "file_path" varchar NOT NULL,
        "file_size" integer NOT NULL,
        "mime_type" varchar NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_issue_attachments_issue" FOREIGN KEY ("issue_id") 
          REFERENCES "issues"("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for issue_attachments
    await queryRunner.query(`
      CREATE INDEX "IDX_issue_attachments_tenant_id" ON "issue_attachments" ("tenant_id");
      CREATE INDEX "IDX_issue_attachments_tenant_issue" ON "issue_attachments" ("tenant_id", "issue_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE "issue_attachments"`);
    await queryRunner.query(`DROP TABLE "issue_comments"`);
    await queryRunner.query(`DROP TABLE "issues"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "issue_type_enum"`);
    await queryRunner.query(`DROP TYPE "issue_priority_enum"`);
    await queryRunner.query(`DROP TYPE "issue_status_enum"`);
  }
}
