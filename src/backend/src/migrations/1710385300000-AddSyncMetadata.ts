import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSyncMetadata1710385300000 implements MigrationInterface {
  name = 'AddSyncMetadata1710385300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add sync metadata columns to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "version" integer NOT NULL DEFAULT 1,
      ADD COLUMN "last_synced_at" TIMESTAMP,
      ADD COLUMN "sync_status" character varying NOT NULL DEFAULT 'synced',
      ADD COLUMN "offline_id" uuid
    `);

    // Add comment to columns
    await queryRunner.query(`
      COMMENT ON COLUMN "users"."version" IS 'Version for optimistic locking'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "users"."last_synced_at" IS 'Last sync timestamp for offline-first'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "users"."sync_status" IS 'Sync status for offline-first'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "users"."offline_id" IS 'Temporary ID for offline-created records'
    `);

    // Create index on sync_status for faster queries
    await queryRunner.query(`
      CREATE INDEX "IDX_users_sync_status" ON "users" ("sync_status")
    `);

    // Create index on last_synced_at for sync queries
    await queryRunner.query(`
      CREATE INDEX "IDX_users_last_synced_at" ON "users" ("last_synced_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_users_last_synced_at"`);
    await queryRunner.query(`DROP INDEX "IDX_users_sync_status"`);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "offline_id",
      DROP COLUMN "sync_status",
      DROP COLUMN "last_synced_at",
      DROP COLUMN "version"
    `);
  }
}
