import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add User Audit Fields
 *
 * Purpose: Add createdBy and updatedBy fields to User entity for complete audit trail
 *
 * Fields added:
 * - created_by: User ID who created this user
 * - updated_by: User ID who last updated this user
 *
 * Rationale:
 * - Tenant entity already has these fields
 * - User entity should have them for consistency
 * - Enables complete audit trail for compliance
 * - Helps track who created/modified user accounts
 *
 * Safety:
 * - Both fields are nullable (backward compatible)
 * - No data loss
 * - Can be populated retroactively
 */
export class AddUserAuditFields20260310000001 implements MigrationInterface {
  name = 'AddUserAuditFields20260310000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "created_by" character varying,
      ADD COLUMN "updated_by" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "created_by",
      DROP COLUMN "updated_by"
    `);
  }
}
