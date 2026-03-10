import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Email Verification Token Expiry
 *
 * Purpose: Add expiry field for email verification tokens to prevent indefinite validity
 *
 * Fields added:
 * - email_verification_expires: Timestamp when email verification token expires
 *
 * Rationale:
 * - Email verification tokens should have limited validity
 * - Prevents token reuse after expiry
 * - Matches password reset token pattern (already has expiry)
 * - Improves security posture
 *
 * Default behavior:
 * - Tokens expire after 24 hours (configurable in auth service)
 * - Expired tokens are rejected during verification
 *
 * Safety:
 * - Field is nullable (backward compatible)
 * - No data loss
 * - Existing tokens remain valid until manually expired
 */
export class AddEmailVerificationExpiry20260310000002 implements MigrationInterface {
  name = 'AddEmailVerificationExpiry20260310000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "email_verification_expires" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "email_verification_expires"
    `);
  }
}
