import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710385200000 implements MigrationInterface {
  name = 'InitialSchema1710385200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create tenants table
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "domain" character varying,
        "logo" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        "timezone" character varying NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        "currency" character varying NOT NULL DEFAULT 'VND',
        "language" character varying NOT NULL DEFAULT 'vi',
        "date_format" character varying NOT NULL DEFAULT 'DD/MM/YYYY',
        "number_format" character varying NOT NULL DEFAULT '#,##0.00',
        "tax_rate" numeric(5,2) NOT NULL DEFAULT '10',
        "company_name" character varying,
        "company_address" character varying,
        "company_phone" character varying,
        "company_email" character varying,
        "company_tax_code" character varying,
        "company_website" character varying,
        "subscription_plan" character varying NOT NULL DEFAULT 'free',
        "subscription_start_date" TIMESTAMP,
        "subscription_end_date" TIMESTAMP,
        "max_users" integer NOT NULL DEFAULT '5',
        "max_storage" bigint NOT NULL DEFAULT '1073741824',
        "current_storage" bigint NOT NULL DEFAULT '0',
        "features" text,
        "billing_cycle" character varying NOT NULL DEFAULT 'monthly',
        "subscription_amount" numeric(10,2) NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" character varying,
        "updated_by" character varying,
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenants_code" UNIQUE ("code")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "first_name" character varying,
        "last_name" character varying,
        "role" character varying NOT NULL DEFAULT 'user',
        "roles" text NOT NULL DEFAULT '',
        "status" character varying NOT NULL DEFAULT 'active',
        "email_verified" boolean NOT NULL DEFAULT false,
        "email_verification_token" character varying,
        "reset_password_token" character varying,
        "reset_password_expires" TIMESTAMP,
        "phone" character varying,
        "avatar" character varying,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_tenant_email" UNIQUE ("tenant_id", "email")
      )
    `);

    // Create index on users
    await queryRunner.query(`
      CREATE INDEX "IDX_users_tenant_email" ON "users" ("tenant_id", "email")
    `);

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_tenant"`);
    await queryRunner.query(`DROP INDEX "IDX_users_tenant_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
