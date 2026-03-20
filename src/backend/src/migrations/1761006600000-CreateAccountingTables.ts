import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountingTables1761006600000 implements MigrationInterface {
  name = 'CreateAccountingTables1761006600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'accounts_type_enum'
        ) THEN
          CREATE TYPE "accounts_type_enum" AS ENUM (
            'asset',
            'liability',
            'equity',
            'income',
            'expense'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'journal_entries_status_enum'
        ) THEN
          CREATE TYPE "journal_entries_status_enum" AS ENUM (
            'draft',
            'posted',
            'cancelled'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "accounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        "last_synced_at" TIMESTAMP,
        "sync_status" character varying NOT NULL DEFAULT 'synced',
        "offline_id" uuid,
        "code" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "type" "accounts_type_enum" NOT NULL,
        "parent_id" uuid,
        "isGroup" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "balance" decimal(15,2) NOT NULL DEFAULT 0,
        "currency" character varying(10) NOT NULL DEFAULT 'VND',
        "description" text,
        "status" character varying(50) NOT NULL DEFAULT 'active',
        CONSTRAINT "UQ_accounts_tenant_code" UNIQUE ("tenant_id", "code")
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD CONSTRAINT "FK_accounts_parent"
      FOREIGN KEY ("parent_id") REFERENCES "accounts"("id")
      ON DELETE SET NULL
    `).catch(() => undefined);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_accounts_tenant_type"
      ON "accounts" ("tenant_id", "type")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_accounts_tenant_parent"
      ON "accounts" ("tenant_id", "parent_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_accounts_sync_status"
      ON "accounts" ("sync_status")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "journal_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        "last_synced_at" TIMESTAMP,
        "sync_status" character varying NOT NULL DEFAULT 'synced',
        "offline_id" uuid,
        "number" character varying(50) NOT NULL,
        "date" date NOT NULL,
        "reference" character varying(255),
        "memo" text,
        "status" "journal_entries_status_enum" NOT NULL DEFAULT 'draft',
        "totalDebit" decimal(15,2) NOT NULL DEFAULT 0,
        "totalCredit" decimal(15,2) NOT NULL DEFAULT 0,
        "postedBy" uuid,
        "postedAt" TIMESTAMP,
        CONSTRAINT "UQ_journal_entries_tenant_number" UNIQUE ("tenant_id", "number")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_journal_entries_tenant_date"
      ON "journal_entries" ("tenant_id", "date")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_journal_entries_tenant_status"
      ON "journal_entries" ("tenant_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_journal_entries_sync_status"
      ON "journal_entries" ("sync_status")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "journal_lines" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        "last_synced_at" TIMESTAMP,
        "sync_status" character varying NOT NULL DEFAULT 'synced',
        "offline_id" uuid,
        "entry_id" uuid NOT NULL,
        "account_id" uuid NOT NULL,
        "debit" decimal(15,2) NOT NULL DEFAULT 0,
        "credit" decimal(15,2) NOT NULL DEFAULT 0,
        "description" text
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "journal_lines"
      ADD CONSTRAINT "FK_journal_lines_entry"
      FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("id")
      ON DELETE CASCADE
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "journal_lines"
      ADD CONSTRAINT "FK_journal_lines_account"
      FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
      ON DELETE RESTRICT
    `).catch(() => undefined);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_journal_lines_tenant_entry"
      ON "journal_lines" ("tenant_id", "entry_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_journal_lines_tenant_account"
      ON "journal_lines" ("tenant_id", "account_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_journal_lines_tenant_account"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_journal_lines_tenant_entry"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_lines"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_journal_entries_sync_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_journal_entries_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_journal_entries_tenant_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_entries"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_accounts_sync_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_accounts_tenant_parent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_accounts_tenant_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'journal_entries_status_enum'
        ) THEN
          DROP TYPE "journal_entries_status_enum";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'accounts_type_enum'
        ) THEN
          DROP TYPE "accounts_type_enum";
        END IF;
      END
      $$;
    `);
  }
}
