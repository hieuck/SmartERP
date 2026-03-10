import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportModule1741600000000 implements MigrationInterface {
  name = 'CreateSupportModule1741600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "ticket_channel_enum" AS ENUM (
        'email',
        'phone',
        'chat',
        'portal',
        'social_media'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "ticket_satisfaction_rating_enum" AS ENUM (
        '1',
        '2',
        '3',
        '4',
        '5'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "assignment_strategy_enum" AS ENUM (
        'round_robin',
        'least_active',
        'skill_based',
        'random'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "article_status_enum" AS ENUM (
        'draft',
        'published',
        'archived'
      )
    `);

    // Create SLA table
    await queryRunner.query(`
      CREATE TABLE "slas" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "priority" "issue_priority_enum" NOT NULL,
        "response_time_hours" integer NOT NULL,
        "resolution_time_hours" integer NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_slas_tenant_id" ON "slas" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_slas_tenant_id_is_active" ON "slas" ("tenant_id", "is_active")
    `);

    // Create Tickets table (extends Issues)
    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "title" varchar NOT NULL,
        "description" text NOT NULL,
        "status" "issue_status_enum" NOT NULL DEFAULT 'new',
        "priority" "issue_priority_enum" NOT NULL DEFAULT 'medium',
        "type" "issue_type_enum" NOT NULL DEFAULT 'task',
        "reporter_id" uuid NOT NULL,
        "assignee_id" uuid,
        "customer_id" uuid NOT NULL,
        "channel" "ticket_channel_enum" NOT NULL DEFAULT 'portal',
        "sla_id" uuid,
        "response_due_at" timestamp,
        "resolution_due_at" timestamp,
        "first_response_at" timestamp,
        "satisfaction_rating" "ticket_satisfaction_rating_enum",
        "satisfaction_comment" text,
        "is_escalated" boolean NOT NULL DEFAULT false,
        "escalated_at" timestamp,
        "escalated_to_id" uuid,
        "resolved_at" timestamp,
        "closed_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_tickets_reporter" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tickets_assignee" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_tickets_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tickets_escalated_to" FOREIGN KEY ("escalated_to_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_tenant_id" ON "tickets" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_tenant_id_customer_id" ON "tickets" ("tenant_id", "customer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_tenant_id_channel" ON "tickets" ("tenant_id", "channel")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_tenant_id_sla_id" ON "tickets" ("tenant_id", "sla_id")
    `);

    // Create Assignment Rules table
    await queryRunner.query(`
      CREATE TABLE "assignment_rules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "strategy" "assignment_strategy_enum" NOT NULL DEFAULT 'round_robin',
        "priority" "issue_priority_enum",
        "type" "issue_type_enum",
        "channel" "ticket_channel_enum",
        "assignee_ids" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "priority_order" integer NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_assignment_rules_tenant_id" ON "assignment_rules" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_assignment_rules_tenant_id_is_active" ON "assignment_rules" ("tenant_id", "is_active")
    `);

    // Create Knowledge Base Articles table
    await queryRunner.query(`
      CREATE TABLE "knowledge_base_articles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "title" varchar NOT NULL,
        "content" text NOT NULL,
        "category_id" uuid,
        "tags" text,
        "status" "article_status_enum" NOT NULL DEFAULT 'draft',
        "author_id" uuid NOT NULL,
        "view_count" integer NOT NULL DEFAULT 0,
        "helpful_count" integer NOT NULL DEFAULT 0,
        "not_helpful_count" integer NOT NULL DEFAULT 0,
        "is_public" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "published_at" timestamp,
        CONSTRAINT "FK_articles_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_articles_tenant_id" ON "knowledge_base_articles" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_articles_tenant_id_status" ON "knowledge_base_articles" ("tenant_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_articles_tenant_id_category_id" ON "knowledge_base_articles" ("tenant_id", "category_id")
    `);

    // Create Canned Responses table
    await queryRunner.query(`
      CREATE TABLE "canned_responses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "title" varchar NOT NULL,
        "content" text NOT NULL,
        "shortcut" varchar,
        "tags" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_public" boolean NOT NULL DEFAULT false,
        "created_by_id" uuid NOT NULL,
        "usage_count" integer NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_canned_responses_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_canned_responses_tenant_id" ON "canned_responses" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_canned_responses_tenant_id_is_active" ON "canned_responses" ("tenant_id", "is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE "canned_responses"`);
    await queryRunner.query(`DROP TABLE "knowledge_base_articles"`);
    await queryRunner.query(`DROP TABLE "assignment_rules"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TABLE "slas"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "article_status_enum"`);
    await queryRunner.query(`DROP TYPE "assignment_strategy_enum"`);
    await queryRunner.query(`DROP TYPE "ticket_satisfaction_rating_enum"`);
    await queryRunner.query(`DROP TYPE "ticket_channel_enum"`);
  }
}
