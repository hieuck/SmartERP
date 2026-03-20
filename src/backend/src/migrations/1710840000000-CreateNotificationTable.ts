import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTable1710840000000 implements MigrationInterface {
  name = 'CreateNotificationTable1710840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('notifications')) {
      return;
    }

    await queryRunner.query(`
      CREATE TYPE "public"."notifications_type_enum" AS ENUM('info', 'success', 'warning', 'error')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."notifications_status_enum" AS ENUM('unread', 'read', 'archived')
    `);
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'info',
        "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'unread',
        "link" character varying,
        "metadata" jsonb,
        "readAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_tenantId" ON "notifications" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_status" ON "notifications" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_tenant_user" ON "notifications" ("tenantId", "userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_tenant_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_tenantId"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
  }
}
