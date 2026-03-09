# Security Guidelines for Production Deployment

**Version:** 1.0  
**Last Updated:** 2026-03-09  
**Owner:** DevOps Engineer  
**Reviewers:** Tech Lead, QA Engineer

---

## 🔒 Security Principles

### 1. Defense in Depth

Multiple layers of security controls:

- Network security (firewalls, VPNs)
- Application security (authentication, authorization)
- Data security (encryption, backups)
- Infrastructure security (hardened OS, patching)

### 2. Principle of Least Privilege

- Users have minimum permissions needed
- Services run with minimal privileges
- Database users have limited access
- API keys have scoped permissions

### 3. Security by Default

- Secure defaults in all configurations
- Opt-in for less secure options
- Fail securely (deny by default)
- Validate all inputs

---

## 🔐 Secret Management

### Secret Types

| Secret Type      | Storage           | Rotation   | Access             |
| ---------------- | ----------------- | ---------- | ------------------ |
| JWT Secrets      | Vault/K8s Secrets | 90 days    | DevOps only        |
| DB Passwords     | Vault/K8s Secrets | 90 days    | DevOps only        |
| API Keys         | Vault/K8s Secrets | 180 days   | DevOps + Tech Lead |
| Encryption Keys  | Vault/K8s Secrets | 365 days   | DevOps only        |
| SSL Certificates | Cert Manager      | Auto-renew | DevOps only        |

### Secret Generation

```bash
# JWT secrets (48 characters minimum)
openssl rand -base64 48

# Session secrets (48 characters minimum)
openssl rand -base64 48

# Encryption keys (32 characters exactly)
openssl rand -base64 32

# Database passwords (24 characters minimum)
openssl rand -base64 24 | tr -d "=+/" | cut -c1-24

# API keys (32 characters)
openssl rand -hex 32
```

### Secret Storage

#### Development

```bash
# Store in .env file (gitignored)
JWT_SECRET=dev-secret-key-change-in-production
```

#### Production

**Option 1: Kubernetes Secrets**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: smarterp-secrets
  namespace: production
type: Opaque
stringData:
  jwt-secret: <base64-encoded>
  db-password: <base64-encoded>
  redis-password: <base64-encoded>
```

**Option 2: External Secrets Operator (Recommended)**

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: smarterp-secrets
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: smarterp-secrets
    creationPolicy: Owner
  data:
    - secretKey: jwt-secret
      remoteRef:
        key: smarterp/production/jwt-secret
    - secretKey: db-password
      remoteRef:
        key: smarterp/production/db-password
```

**Option 3: HashiCorp Vault**

```bash
# Store secret
vault kv put secret/smarterp/production \
  jwt_secret="..." \
  db_password="..." \
  redis_password="..."

# Retrieve secret
vault kv get -field=jwt_secret secret/smarterp/production
```

### Secret Rotation

**Rotation Schedule:**

```bash
# Every 90 days
- JWT secrets
- Session secrets
- Database passwords

# Every 180 days
- API keys
- Third-party credentials

# Every 365 days
- Encryption keys
- Root certificates
```

**Rotation Process:**

1. Generate new secret
2. Store in secret manager
3. Update application config
4. Deploy with zero downtime
5. Verify application works
6. Revoke old secret
7. Document rotation in audit log

---

## 🛡️ Application Security

### Authentication

**Requirements:**

- ✅ Strong password policy (min 12 chars, complexity)
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT with short expiration (15 minutes)
- ✅ Refresh tokens with rotation
- ✅ 2FA for admin users
- ✅ Account lockout after failed attempts
- ✅ Session management

**Configuration:**

```typescript
// config/environments/production.ts
security: {
  bcryptRounds: 12,
  jwt: {
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  accountLockout: {
    maxAttempts: 5,
    lockoutDuration: 900, // 15 minutes
  },
}
```

### Authorization

**Requirements:**

- ✅ Role-based access control (RBAC)
- ✅ Permission-based access control
- ✅ Tenant isolation (multi-tenancy)
- ✅ Resource-level permissions
- ✅ Audit logging for all access

**Implementation:**

```typescript
// Use SecureRepository for tenant isolation
const orders = await this.secureRepository.find(Order, {
  where: { status: 'pending' },
  tenantId: req.tenantId,
  userId: req.userId,
});

// Check permissions
const canWrite = await this.permissionService.canWrite(req.userId, 'orders', req.tenantId);

if (!canWrite) {
  throw new ForbiddenException('Insufficient permissions');
}
```

### Input Validation

**Requirements:**

- ✅ Validate all user inputs
- ✅ Sanitize HTML inputs
- ✅ Parameterized queries (prevent SQL injection)
- ✅ Rate limiting
- ✅ Request size limits
- ✅ File upload restrictions

**Configuration:**

```typescript
// Global validation pipe
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: false,
    },
  }),
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  }),
);

// File upload limits
app.use(
  multer({
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
    fileFilter: (req, file, cb) => {
      // Only allow specific file types
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    },
  }),
);
```

### CSRF Protection

**Requirements:**

- ✅ CSRF tokens for state-changing operations
- ✅ SameSite cookie attribute
- ✅ Origin/Referer validation

**Configuration:**

```typescript
// Enable CSRF protection
app.use(
  csrf({
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    },
  }),
);

// Set CSRF token in response
res.cookie('csrf-token', csrfToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});
```

### Security Headers

**Requirements:**

- ✅ Helmet.js for security headers
- ✅ Content Security Policy (CSP)
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options

**Configuration:**

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
  }),
);
```

---

## 🔐 Data Security

### Encryption at Rest

**Requirements:**

- ✅ Database encryption (TDE)
- ✅ File storage encryption
- ✅ Backup encryption
- ✅ Sensitive field encryption

**Implementation:**

```typescript
// Encrypt sensitive fields
@Column({
  type: 'text',
  transformer: {
    to: (value: string) => encrypt(value, ENCRYPTION_KEY),
    from: (value: string) => decrypt(value, ENCRYPTION_KEY),
  },
})
creditCardNumber: string;

// Database encryption
database: {
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-cert.pem'),
  },
  extra: {
    ssl: true,
  },
}
```

### Encryption in Transit

**Requirements:**

- ✅ TLS 1.3 for all connections
- ✅ Strong cipher suites
- ✅ Certificate validation
- ✅ HSTS enabled

**Configuration:**

```yaml
# Kubernetes Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: smarterp-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-protocols: 'TLSv1.3'
    nginx.ingress.kubernetes.io/ssl-ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384'
spec:
  tls:
    - hosts:
        - erp.yourdomain.com
      secretName: smarterp-tls
```

### Data Masking

**Requirements:**

- ✅ Mask sensitive data in logs
- ✅ Mask sensitive data in error messages
- ✅ Mask sensitive data in API responses

**Implementation:**

```typescript
// Mask sensitive fields in logs
logger.log({
  message: 'User login',
  userId: user.id,
  email: maskEmail(user.email), // j***@example.com
  ip: maskIP(req.ip), // 192.168.***.***
});

// Mask sensitive fields in API responses
@Exclude()
password: string;

@Exclude()
creditCardNumber: string;

@Transform(({ value }) => maskEmail(value))
email: string;
```

---

## 🌐 Network Security

### Firewall Rules

**Requirements:**

- ✅ Deny all by default
- ✅ Allow only necessary ports
- ✅ Restrict source IPs
- ✅ Log all denied connections

**Configuration:**

```yaml
# Kubernetes NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: smarterp-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: smarterp-backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: smarterp-frontend
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
```

### DDoS Protection

**Requirements:**

- ✅ Rate limiting
- ✅ Connection limits
- ✅ Request size limits
- ✅ CDN/WAF protection

**Configuration:**

```typescript
// Rate limiting
@UseGuards(ThrottlerGuard)
@Throttle(100, 60) // 100 requests per minute
@Controller('api')
export class ApiController {}

// Connection limits
server.maxConnections = 1000;

// Request size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
```

---

## 📊 Monitoring & Alerting

### Security Monitoring

**Requirements:**

- ✅ Failed login attempts
- ✅ Unauthorized access attempts
- ✅ Suspicious activity patterns
- ✅ Security vulnerability scans
- ✅ Dependency vulnerability scans

**Alerts:**

```yaml
# Prometheus alert rules
groups:
  - name: security
    rules:
      - alert: HighFailedLoginRate
        expr: rate(failed_login_attempts[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High failed login rate detected

      - alert: UnauthorizedAccessAttempt
        expr: rate(unauthorized_access_attempts[5m]) > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: Unauthorized access attempts detected

      - alert: SuspiciousActivity
        expr: rate(suspicious_activity[5m]) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Suspicious activity detected
```

### Audit Logging

**Requirements:**

- ✅ Log all authentication events
- ✅ Log all authorization failures
- ✅ Log all data modifications
- ✅ Log all admin actions
- ✅ Tamper-proof logs

**Implementation:**

```typescript
// Audit log entry
await this.auditLogService.log({
  userId: req.userId,
  tenantId: req.tenantId,
  action: 'UPDATE',
  resource: 'Order',
  resourceId: order.id,
  changes: {
    before: oldOrder,
    after: newOrder,
  },
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date(),
});
```

---

## 🔍 Security Testing

### Vulnerability Scanning

**Tools:**

- ✅ Snyk (dependency scanning)
- ✅ OWASP ZAP (web app scanning)
- ✅ SonarQube (code quality & security)
- ✅ Trivy (container scanning)

**Schedule:**

- Daily: Dependency scanning
- Weekly: Web app scanning
- Monthly: Penetration testing
- Quarterly: Security audit

### Security Checklist

**Before Production Deployment:**

- [ ] All dependencies up to date
- [ ] No known vulnerabilities (critical/high)
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Secrets rotated
- [ ] Access controls tested
- [ ] Audit logging enabled
- [ ] Monitoring configured
- [ ] Incident response plan ready
- [ ] Security training completed

---

## 📚 Related Documents

- **Config Management:** `docs/deployment/config-management.md`
- **Deployment Checklist:** `docs/deployment/deployment-checklist.md`
- **Infrastructure Requirements:** `DEVOPS-INFRASTRUCTURE-REQUIREMENTS-2026-03-09.md`
- **Security Decision:** `TECH-LEAD-FINAL-DECISION-2026-03-09-SECURITY-FIRST.md`

---

**Created:** 2026-03-09  
**Created By:** DevOps Engineer  
**Reviewed By:** Tech Lead, QA Engineer  
**Status:** ✅ Active  
**Next Review:** 2026-04-09

**SECURITY FIRST! 🔒**
