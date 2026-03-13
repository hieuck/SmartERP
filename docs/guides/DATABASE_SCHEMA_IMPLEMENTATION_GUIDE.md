# Database Schema Implementation Guide

**Date:** March 2026  
**Version:** 1.0  
**Status:** READY FOR IMPLEMENTATION  
**Target:** Smart-ERP Authentication System

---

## Overview

This guide provides step-by-step instructions for implementing the authentication database schema. The implementation includes 7 new tables and enhancements to the existing users table.

---

## Migration Files Created

### 1. Token Blacklist Migration
**File:** `20260310000003-CreateTokenBlacklist.ts`  
**Purpose:** Store revoked tokens  
**Tables:** `token_blacklist`  
**Indexes:** 3 (user_id, expires_at, token_hash)

### 2. Login Attempts Migration
**File:** `20260310000004-CreateLoginAttempts.ts`  
**Purpose:** Track failed login attempts  
**Tables:** `login_attempts`  
**Indexes:** 7 (user_id, email, tenant_id, created_at, ip_address, user_time, email_time)

### 3. Account Lockouts Migration
**File:** `20260310000005-CreateAccountLockouts.ts`  
**Purpose:** Track account lockouts  
**Tables:** `account_lockouts`  
**Indexes:** 3 (user_id, locked_until, tenant_id)

### 4. Sessions Migration
**File:** `20260310000006-CreateSessions.ts`  
**Purpose:** Manage user sessions  
**Tables:** `sessions`  
**Indexes:** 5 (user_id, refresh_token_hash, expires_at, tenant_id, last_activity_at)

### 5. Email Verifications Migration
**File:** `20260310000007-CreateEmailVerifications.ts`  
**Purpose:** Track email verification codes  
**Tables:** `email_verifications`  
**Indexes:** 4 (user_id, email, verification_code, expires_at)

### 6. Two-Factor Auth Migration
**File:** `20260310000008-CreateTwoFactorAuth.ts`  
**Purpose:** Store 2FA configuration  
**Tables:** `two_factor_auth`  
**Indexes:** 2 (user_id, enabled)

### 7. Auth Audit Logs Migration
**File:** `20260310000009-CreateAuthAuditLogs.ts`  
**Purpose:** Comprehensive audit trail  
**Tables:** `auth_audit_logs`  
**Indexes:** 6 (user_id, tenant_id, event_type, created_at, status, user_time)

### 8. Users Table Enhancement
**File:** `20260310000010-EnhanceUsersTable.ts`  
**Purpose:** Add audit fields and expiry timestamps  
**Changes:** 4 new columns, 2 foreign keys, 2 indexes

---

## Implementation Steps

### Step 1: Backup Current Database

```bash
# Full backup before migration
pg_dump smart_erp > backup_pre_auth_schema_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_pre_auth_schema_*.sql
```

### Step 2: Run Migrations

```bash
# Navigate to backend directory
cd smart-erp/src/backend

# Run all pending migrations
npm run typeorm migration:run

# Or run specific migration
npm run typeorm migration:run -- --transaction=all
```

### Step 3: Verify Migration Success

```bash
# Check if all tables were created
psql smart_erp -c "\dt"

# Verify token_blacklist table
psql smart_erp -c "\d token_blacklist"

# Verify indexes
psql smart_erp -c "\di" | grep idx_

# Count tables
psql smart_erp -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

### Step 4: Verify Data Integrity

```bash
# Check for any migration errors
psql smart_erp -c "SELECT * FROM typeorm_metadata WHERE type = 'migration';"

# Verify foreign key constraints
psql smart_erp -c "SELECT constraint_name, table_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';"

# Verify check constraints
psql smart_erp -c "SELECT constraint_name, table_name FROM information_schema.table_constraints WHERE constraint_type = 'CHECK';"
```

### Step 5: Test Rollback (Optional)

```bash
# Revert last migration
npm run typeorm migration:revert

# Verify rollback
psql smart_erp -c "\dt" | grep token_blacklist

# Re-run migration
npm run typeorm migration:run
```

---

## Database Schema Summary

### New Tables (7)

| Table | Rows | Purpose | Retention |
|-------|------|---------|-----------|
| token_blacklist | ~1000s | Revoked tokens | 7 days |
| login_attempts | ~10000s | Failed attempts | 90 days |
| account_lockouts | ~10s | Locked accounts | Until unlock |
| sessions | ~1000s | Active sessions | Until expiry |
| email_verifications | ~100s | Email codes | 24 hours |
| two_factor_auth | ~100s | 2FA config | Until disabled |
| auth_audit_logs | ~100000s | Audit trail | 1 year |

### Enhanced Tables (1)

| Table | Changes | Impact |
|-------|---------|--------|
| users | +4 columns, +2 FK, +2 indexes | Non-breaking |

### Total Indexes Created

- **New tables:** 28 indexes
- **Enhanced users:** 2 indexes
- **Total:** 30 new indexes

---

## Performance Considerations

### Index Strategy

**Lookup Indexes** (Fast single-row lookups)
- `idx_token_blacklist_token_hash` - O(1) token lookup
- `idx_sessions_refresh_token_hash` - O(1) session lookup
- `idx_email_verifications_verification_code` - O(1) code lookup

**Filter Indexes** (Fast WHERE clauses)
- `idx_login_attempts_email` - O(log n) email filtering
- `idx_auth_audit_logs_event_type` - O(log n) event filtering

**Time-based Indexes** (Fast date range queries)
- `idx_token_blacklist_expires_at` - O(log n) expiry queries
- `idx_sessions_expires_at` - O(log n) session cleanup

**Composite Indexes** (Fast multi-column queries)
- `idx_login_attempts_user_time` - O(log n) rate limiting
- `idx_auth_audit_logs_user_time` - O(log n) audit queries

---

## Maintenance Tasks

### Daily Tasks

**1. Cleanup Expired Tokens** (2 AM)
```sql
DELETE FROM token_blacklist 
WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
```

**2. Cleanup Expired Sessions** (2 AM)
```sql
DELETE FROM sessions 
WHERE expires_at < CURRENT_TIMESTAMP;
```

**3. Unlock Expired Lockouts** (2 AM)
```sql
DELETE FROM account_lockouts 
WHERE locked_until < CURRENT_TIMESTAMP;
```

### Weekly Tasks

**1. Analyze Table Statistics** (Sunday 3 AM)
```sql
ANALYZE token_blacklist;
ANALYZE login_attempts;
ANALYZE sessions;
ANALYZE email_verifications;
ANALYZE auth_audit_logs;
```

### Monthly Tasks

**1. Cleanup Old Audit Logs** (1st of month, 3 AM)
```sql
DELETE FROM auth_audit_logs 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
```

---

## Monitoring Queries

### Active Sessions
```sql
SELECT COUNT(*) as active_sessions
FROM sessions
WHERE expires_at > CURRENT_TIMESTAMP;
```

### Failed Login Attempts (Last Hour)
```sql
SELECT COUNT(*) as failed_attempts
FROM login_attempts
WHERE success = FALSE
  AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour';
```

### Locked Accounts
```sql
SELECT COUNT(*) as locked_accounts
FROM account_lockouts
WHERE locked_until > CURRENT_TIMESTAMP;
```

### Revoked Tokens
```sql
SELECT COUNT(*) as revoked_tokens
FROM token_blacklist
WHERE expires_at > CURRENT_TIMESTAMP;
```

---

## Verification Checklist

After migration, verify:

- [ ] All 7 new tables created
- [ ] Users table enhanced with 4 new columns
- [ ] All 30 indexes created successfully
- [ ] Foreign key constraints in place
- [ ] Check constraints working
- [ ] No migration errors in logs
- [ ] Database size reasonable
- [ ] Query performance acceptable
- [ ] Backup created before migration
- [ ] Rollback procedure tested
- [ ] Monitoring queries working
- [ ] Maintenance tasks scheduled
- [ ] Documentation updated
- [ ] Team notified of changes
- [ ] Staging environment tested
- [ ] Production deployment scheduled

---

## Next Steps

### Phase 1: Implement Services (Week 1)
1. Create TokenBlacklistService
2. Create LoginAttemptService
3. Create AccountLockoutService
4. Create SessionService
5. Create EmailVerificationService
6. Create TwoFactorAuthService
7. Create AuthAuditLogService

### Phase 2: Update Auth Logic (Week 2)
1. Implement token revocation on logout
2. Implement login attempt tracking
3. Implement account lockout logic
4. Implement session management
5. Implement email verification expiry
6. Implement 2FA support
7. Implement audit logging

### Phase 3: Testing (Week 3)
1. Unit tests for all services
2. Integration tests for auth flow
3. Performance tests
4. Security tests
5. Load tests

### Phase 4: Deployment (Week 4)
1. Deploy to staging
2. Run smoke tests
3. Performance validation
4. Security review
5. Deploy to production
6. Monitor for issues

---

**Document Status:** READY FOR IMPLEMENTATION  
**Last Updated:** March 2026  
**Next Review:** After implementation and testing
