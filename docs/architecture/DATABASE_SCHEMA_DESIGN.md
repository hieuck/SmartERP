# Smart-ERP Authentication Database Schema Design

**Date:** March 2026  
**Version:** 1.0  
**Status:** READY FOR IMPLEMENTATION  
**Database:** PostgreSQL 14+

---

## Overview

This document defines the complete database schema for the smart-erp authentication system. The schema addresses all critical security vulnerabilities identified in the security audit and implements industry best practices for authentication, authorization, and audit logging.

**Key Features:**
- Token revocation and blacklisting
- Login attempt tracking and account lockout
- Session management with timeout
- Email verification with expiry
- Two-factor authentication (OTP + backup codes)
- Comprehensive audit trail
- Tenant isolation verification
- Performance-optimized indexes

---

## Table Structure

### 1. Users Table (Enhanced)

**Purpose:** Core user authentication and profile data  
**Existing:** Yes (needs enhancement)  
**Changes:** Add audit fields, email verification expiry

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar VARCHAR(500),
  role VARCHAR(50) DEFAULT 'user',
  roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires_at TIMESTAMP,
  reset_password_token VARCHAR(255),
  reset_password_expires_at TIMESTAMP,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_tenant_id ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_verified ON users(email_verified) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Fields:**
- `email_verification_expires_at`: Expiry for email verification token (24 hours)
- `reset_password_expires_at`: Expiry for password reset token (1 hour)
- `tenant_id`: Multi-tenancy support with verification
- `created_by`, `updated_by`: Audit trail
- `deleted_at`: Soft delete support

---

### 2. Token Blacklist Table

**Purpose:** Store revoked tokens to prevent reuse  
**Type:** New  
**TTL:** Automatic cleanup based on token expiry

```sql
CREATE TABLE token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('access', 'refresh')),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revocation_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);
CREATE INDEX idx_token_blacklist_token_hash ON token_blacklist(token_hash);

-- Automatic cleanup of expired tokens (PostgreSQL)
-- Run periodically: DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP;
```

**Fields:**
- `token_hash`: SHA-256 hash of token (never store raw tokens)
- `token_type`: 'access' or 'refresh'
- `expires_at`: When token naturally expires
- `revoked_at`: When token was revoked
- `revocation_reason`: Why token was revoked (logout, password change, etc.)

---

### 3. Login Attempts Table

**Purpose:** Track failed login attempts for rate limiting and account lockout  
**Type:** New  
**Retention:** 90 days

```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email VARCHAR(255) NOT NULL,
  tenant_id UUID NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  success BOOLEAN DEFAULT FALSE,
  failure_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_tenant_id ON login_attempts(tenant_id);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);

-- Composite index for rate limiting queries
CREATE INDEX idx_login_attempts_user_time ON login_attempts(user_id, created_at DESC);
CREATE INDEX idx_login_attempts_email_time ON login_attempts(email, created_at DESC);
```

**Fields:**
- `user_id`: NULL if user not found (for enumeration prevention)
- `email`: Email attempted (for tracking)
- `ip_address`: Source IP for geographic tracking
- `user_agent`: Browser/client info
- `success`: TRUE for successful login
- `failure_reason`: 'invalid_password', 'user_not_found', 'account_locked', etc.

---

### 4. Account Lockout Table

**Purpose:** Track account lockouts and unlock times  
**Type:** New  
**Retention:** Until unlock

```sql
CREATE TABLE account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tenant_id UUID NOT NULL,
  locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  locked_until TIMESTAMP NOT NULL,
  reason VARCHAR(255) NOT NULL,
  failed_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX idx_account_lockouts_locked_until ON account_lockouts(locked_until);
CREATE INDEX idx_account_lockouts_tenant_id ON account_lockouts(tenant_id);
```

**Fields:**
- `locked_until`: When account will be automatically unlocked
- `reason`: 'too_many_failed_attempts', 'admin_lockout', etc.
- `failed_attempts`: Count of failed attempts that triggered lockout

---

### 5. Session Table

**Purpose:** Track active user sessions with timeout  
**Type:** New  
**Retention:** Until logout or expiry

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  device_info VARCHAR(255),
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token_hash ON sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_tenant_id ON sessions(tenant_id);
CREATE INDEX idx_sessions_last_activity_at ON sessions(last_activity_at);
```

**Fields:**
- `refresh_token_hash`: Hash of refresh token (never store raw)
- `device_info`: Device fingerprint for security
- `last_activity_at`: Last request timestamp
- `expires_at`: Session expiry time

---

### 6. Email Verification Table

**Purpose:** Track email verification codes with expiry  
**Type:** New  
**Retention:** 24 hours

```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  verification_code VARCHAR(255) NOT NULL UNIQUE,
  verified_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_verification_code ON email_verifications(verification_code);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);
```

**Fields:**
- `verification_code`: Unique code sent to email
- `verified_at`: When email was verified
- `expires_at`: When code expires (24 hours)
- `attempts`: Failed verification attempts

---

### 7. Two-Factor Auth Table

**Purpose:** Store OTP secrets and backup codes  
**Type:** New  
**Retention:** Until disabled

```sql
CREATE TABLE two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tenant_id UUID NOT NULL,
  otp_secret VARCHAR(255) NOT NULL,
  backup_codes TEXT[] NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  enabled_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX idx_two_factor_auth_enabled ON two_factor_auth(enabled);
```

**Fields:**
- `otp_secret`: Encrypted TOTP secret (base32 encoded)
- `backup_codes`: Array of one-time backup codes (hashed)
- `enabled`: Whether 2FA is active
- `enabled_at`: When 2FA was enabled
- `last_used_at`: Last successful 2FA verification

---

### 8. Auth Audit Log Table

**Purpose:** Comprehensive audit trail for all authentication events  
**Type:** New  
**Retention:** 1 year

```sql
CREATE TABLE auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  tenant_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_action VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failure')),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_auth_audit_logs_user_id ON auth_audit_logs(user_id);
CREATE INDEX idx_auth_audit_logs_tenant_id ON auth_audit_logs(tenant_id);
CREATE INDEX idx_auth_audit_logs_event_type ON auth_audit_logs(event_type);
CREATE INDEX idx_auth_audit_logs_created_at ON auth_audit_logs(created_at);
CREATE INDEX idx_auth_audit_logs_status ON auth_audit_logs(status);

-- Composite index for common queries
CREATE INDEX idx_auth_audit_logs_user_time ON auth_audit_logs(user_id, created_at DESC);
```

**Event Types:**
- `login`: User login attempt
- `logout`: User logout
- `password_reset`: Password reset request/completion
- `email_verification`: Email verification
- `2fa_setup`: 2FA setup
- `2fa_verify`: 2FA verification
- `token_refresh`: Token refresh
- `token_revoke`: Token revocation
- `account_lockout`: Account locked
- `account_unlock`: Account unlocked

---

## Data Relationships

```
users (1) ──────────────────── (N) login_attempts
  │                                    │
  │                                    └─ tracks failed attempts
  │
  ├─ (1) ──────────────────── (N) token_blacklist
  │                                    │
  │                                    └─ revoked tokens
  │
  ├─ (1) ──────────────────── (1) account_lockouts
  │                                    │
  │                                    └─ current lockout status
  │
  ├─ (1) ──────────────────── (N) sessions
  │                                    │
  │                                    └─ active sessions
  │
  ├─ (1) ──────────────────── (N) email_verifications
  │                                    │
  │                                    └─ email verification codes
  │
  ├─ (1) ──────────────────── (1) two_factor_auth
  │                                    │
  │                                    └─ 2FA configuration
  │
  └─ (1) ──────────────────── (N) auth_audit_logs
                                       │
                                       └─ audit trail
```

---

## Constraints & Validations

### Primary Key Constraints
- All tables use UUID primary keys for security and scalability
- UUIDs generated server-side using `gen_random_uuid()`

### Foreign Key Constraints
- All user references cascade on delete
- Tenant references cascade on delete (multi-tenancy)
- Soft deletes supported via `deleted_at` field

### Unique Constraints
- `users.email` - Unique per tenant
- `token_blacklist.token_hash` - Unique globally
- `sessions.refresh_token_hash` - Unique globally
- `email_verifications.verification_code` - Unique globally
- `two_factor_auth.user_id` - One 2FA config per user

### Check Constraints
- `users.status` - Only valid statuses
- `token_blacklist.token_type` - 'access' or 'refresh'
- `auth_audit_logs.status` - 'success' or 'failure'

---

## Performance Optimization

### Indexes Strategy

**1. Lookup Indexes** (Fast single-row lookups)
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_token_blacklist_token_hash ON token_blacklist(token_hash);
CREATE INDEX idx_sessions_refresh_token_hash ON sessions(refresh_token_hash);
```

**2. Filter Indexes** (Fast WHERE clauses)
```sql
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_auth_audit_logs_event_type ON auth_audit_logs(event_type);
```

**3. Time-based Indexes** (Fast date range queries)
```sql
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_auth_audit_logs_created_at ON auth_audit_logs(created_at);
```

**4. Composite Indexes** (Fast multi-column queries)
```sql
CREATE INDEX idx_login_attempts_user_time ON login_attempts(user_id, created_at DESC);
CREATE INDEX idx_auth_audit_logs_user_time ON auth_audit_logs(user_id, created_at DESC);
```

**5. Partial Indexes** (Fast queries on active records)
```sql
CREATE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_active ON sessions(user_id) WHERE expires_at > CURRENT_TIMESTAMP;
```

---

## Migration Strategy

### Phase 1: Create New Tables (Non-blocking)
1. Create `token_blacklist` table
2. Create `login_attempts` table
3. Create `account_lockouts` table
4. Create `sessions` table
5. Create `email_verifications` table
6. Create `two_factor_auth` table
7. Create `auth_audit_logs` table

### Phase 2: Enhance Existing Tables
1. Add `email_verification_expires_at` to `users`
2. Add `reset_password_expires_at` to `users`
3. Add indexes to `users` table
4. Add audit fields (`created_by`, `updated_by`)

### Phase 3: Data Migration
1. Migrate existing email verification tokens
2. Migrate existing password reset tokens
3. Populate audit logs for historical events

### Phase 4: Cleanup
1. Remove old token fields (if applicable)
2. Archive old audit data
3. Optimize indexes

---

## Backup & Recovery

### Backup Strategy
```bash
# Full backup
pg_dump smart_erp > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables
pg_dump -t users -t token_blacklist smart_erp > auth_backup.sql

# Backup with compression
pg_dump smart_erp | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Recovery Strategy
```bash
# Restore full backup
psql smart_erp < backup_20260310.sql

# Restore specific tables
psql smart_erp < auth_backup.sql

# Restore from compressed backup
gunzip -c backup_20260310.sql.gz | psql smart_erp
```

---

## Monitoring & Maintenance

### Regular Maintenance Tasks

**1. Cleanup Expired Tokens** (Daily)
```sql
DELETE FROM token_blacklist 
WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
```

**2. Cleanup Expired Sessions** (Daily)
```sql
DELETE FROM sessions 
WHERE expires_at < CURRENT_TIMESTAMP;
```

**3. Cleanup Old Audit Logs** (Monthly)
```sql
DELETE FROM auth_audit_logs 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
```

**4. Analyze Table Statistics** (Weekly)
```sql
ANALYZE users;
ANALYZE token_blacklist;
ANALYZE login_attempts;
ANALYZE sessions;
ANALYZE auth_audit_logs;
```

### Monitoring Queries

**1. Active Sessions Count**
```sql
SELECT COUNT(*) as active_sessions
FROM sessions
WHERE expires_at > CURRENT_TIMESTAMP;
```

**2. Failed Login Attempts (Last Hour)**
```sql
SELECT COUNT(*) as failed_attempts
FROM login_attempts
WHERE success = FALSE
  AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour';
```

**3. Locked Accounts**
```sql
SELECT COUNT(*) as locked_accounts
FROM account_lockouts
WHERE locked_until > CURRENT_TIMESTAMP;
```

**4. Revoked Tokens Count**
```sql
SELECT COUNT(*) as revoked_tokens
FROM token_blacklist
WHERE expires_at > CURRENT_TIMESTAMP;
```

---

## Security Considerations

### 1. Token Storage
- Never store raw tokens in database
- Always hash tokens using SHA-256
- Compare hashes using constant-time comparison

### 2. Password Storage
- Hash passwords using bcrypt (12 rounds minimum)
- Never store plain text passwords
- Never log passwords

### 3. Sensitive Data
- Encrypt OTP secrets at rest
- Hash backup codes
- Don't log sensitive details in audit logs

### 4. Tenant Isolation
- Always verify tenant_id in queries
- Use row-level security (RLS) if available
- Audit cross-tenant access attempts

### 5. Rate Limiting
- Track failed attempts per email/IP
- Lock accounts after 5 failed attempts
- Implement exponential backoff

### 6. Audit Trail
- Log all authentication events
- Include IP address and user agent
- Store in immutable format (JSONB)

---

## Scalability Considerations

### Horizontal Scaling
- Use UUID for distributed primary keys
- Partition large tables by tenant_id or date
- Use read replicas for audit log queries

### Vertical Scaling
- Add indexes for common queries
- Archive old audit logs
- Use connection pooling

### Caching Strategy
- Cache user permissions in Redis
- Cache session data in Redis
- Cache token blacklist in Redis (TTL-based)

---

## Compliance & Regulations

### GDPR Compliance
- Soft delete support (`deleted_at`)
- Audit trail for data access
- Right to be forgotten (cascade delete)
- Data retention policies (1 year for audit logs)

### SOC 2 Compliance
- Comprehensive audit logging
- Access control (tenant isolation)
- Encryption at rest and in transit
- Regular backups and recovery testing

### PCI DSS Compliance
- No plain text password storage
- Secure token handling
- Audit trail for all access
- Regular security assessments

---

## Implementation Checklist

- [ ] Create all 7 new tables
- [ ] Add indexes for performance
- [ ] Enhance users table
- [ ] Create migration files
- [ ] Test migrations (up and down)
- [ ] Implement token blacklist service
- [ ] Implement login attempt tracking
- [ ] Implement account lockout logic
- [ ] Implement session management
- [ ] Implement email verification
- [ ] Implement 2FA support
- [ ] Implement audit logging
- [ ] Add monitoring queries
- [ ] Document backup/recovery procedures
- [ ] Test disaster recovery
- [ ] Deploy to staging
- [ ] Performance testing
- [ ] Security review
- [ ] Deploy to production

---

**Document Status:** READY FOR IMPLEMENTATION  
**Last Updated:** March 2026  
**Next Review:** After implementation and testing
