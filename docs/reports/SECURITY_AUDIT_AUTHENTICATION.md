# Security Audit Report: Authentication System
**Date:** March 2026  
**Status:** CRITICAL FINDINGS IDENTIFIED  
**Scope:** Backend Auth Service, Frontend Auth Pages, API Endpoints

---

## Executive Summary

The authentication system has **12 security vulnerabilities** ranging from critical to medium severity. Key issues include:
- Hardcoded demo credentials exposed in production code
- Missing HTTPS/TLS enforcement
- Insufficient input validation on subdomain
- Weak password requirements on login
- Missing security headers
- No CSRF protection
- Inadequate rate limiting configuration
- Missing email verification enforcement

**Recommendation:** Address all CRITICAL and HIGH severity issues before production deployment.

---

## 🔴 CRITICAL VULNERABILITIES

### 1. Hardcoded Demo Credentials in Production Code
**Severity:** CRITICAL  
**Location:** `smart-erp/src/frontend/src/pages/auth/LoginPage.tsx` (Lines 115-120)

**Issue:**
```typescript
<Card style={{ marginTop: 24, borderRadius: 16, background: '#f6f8fa' }}>
  <Title level={5} style={{ marginBottom: 16 }}>Tài khoản demo:</Title>
  <Space direction="vertical" size="small">
    <Text>📧 Email: admin@test.com</Text>
    <Text>🔑 Password: admin123</Text>
  </Space>
</Card>
```

**Risk:** Demo credentials are visible to all users, allowing unauthorized access to admin account.

**Fix:**
- Remove hardcoded credentials from UI
- Use environment-based demo account management
- Implement demo account with limited permissions
- Rotate credentials regularly

**Code:**
```typescript
// ✅ CORRECT - Environment-based demo
const SHOW_DEMO_CREDENTIALS = process.env.REACT_APP_SHOW_DEMO === 'true';

{SHOW_DEMO_CREDENTIALS && (
  <Card style={{ marginTop: 24, borderRadius: 16, background: '#f6f8fa' }}>
    <Title level={5} style={{ marginBottom: 16 }}>Tài khoản demo:</Title>
    <Alert
      message="Demo credentials are for testing only"
      type="warning"
      showIcon
    />
  </Card>
)}
```

---

### 2. Missing HTTPS/TLS Enforcement
**Severity:** CRITICAL  
**Location:** Backend configuration (not found in provided files)

**Issue:** No evidence of HTTPS enforcement or TLS configuration in auth endpoints.

**Risk:** Credentials transmitted over HTTP can be intercepted (man-in-the-middle attack).

**Fix:**
```typescript
// In main.ts or app.module.ts
import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ Enable HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    // Enforce HTTPS redirect
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }
  
  await app.listen(3000);
}
```

---

### 3. Insufficient Subdomain Validation
**Severity:** CRITICAL  
**Location:** `smart-erp/src/frontend/src/pages/public/RegisterPage.tsx` (Lines 35-42)

**Issue:**
```typescript
const slug = companyName
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
```

**Risk:** 
- No length validation (could create extremely long subdomains)
- No reserved word checking (could register 'admin', 'api', 'www')
- No uniqueness check before submission

**Fix:**
```typescript
// ✅ CORRECT - Comprehensive subdomain validation
const RESERVED_SUBDOMAINS = [
  'admin', 'api', 'www', 'mail', 'ftp', 'smtp', 'pop', 'imap',
  'test', 'staging', 'dev', 'production', 'backup', 'cdn',
  'dashboard', 'app', 'auth', 'login', 'register', 'help'
];

const validateSubdomain = (subdomain: string): string | null => {
  // Length validation
  if (subdomain.length < 3 || subdomain.length > 63) {
    return 'Subdomain must be 3-63 characters';
  }
  
  // Reserved words check
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return `Subdomain "${subdomain}" is reserved`;
  }
  
  // Pattern validation
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
    return 'Invalid subdomain format';
  }
  
  return null;
};

// In form validation
<Form.Item
  name="slug"
  label="Tên miền (subdomain)"
  rules={[
    { required: true, message: 'Vui lòng nhập tên miền' },
    {
      validator: (_, value) => {
        const error = validateSubdomain(value);
        return error ? Promise.reject(error) : Promise.resolve();
      }
    }
  ]}
>
  <Input
    prefix={<GlobalOutlined />}
    addonAfter=".smarterp.vn"
    placeholder="cong-ty-abc"
    size="large"
  />
</Form.Item>
```

---

### 4. Weak Password Requirements on Login
**Severity:** CRITICAL  
**Location:** `smart-erp/src/frontend/src/pages/auth/LoginPage.tsx` (Lines 85-92)

**Issue:**
```typescript
<Form.Item
  name="password"
  label="Mật khẩu"
  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
>
  <Input.Password
    prefix={<LockOutlined />}
    placeholder="••••••••"
    size="large"
  />
</Form.Item>
```

**Risk:** No password strength validation on login form. While backend has requirements, frontend should provide immediate feedback.

**Fix:**
```typescript
// ✅ CORRECT - Add password strength indicator
import { Progress } from 'antd';

const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/\d/.test(password)) strength += 25;
  return strength;
};

<Form.Item
  name="password"
  label="Mật khẩu"
  rules={[
    { required: true, message: 'Vui lòng nhập mật khẩu!' },
    { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' }
  ]}
>
  <Input.Password
    prefix={<LockOutlined />}
    placeholder="••••••••"
    size="large"
  />
</Form.Item>
```

---

## 🟠 HIGH SEVERITY VULNERABILITIES

### 5. Missing CSRF Protection
**Severity:** HIGH  
**Location:** Backend auth controller

**Issue:** No CSRF token validation on state-changing operations (login, register, password reset).

**Fix:**
```typescript
// In auth.module.ts
import { CsrfMiddleware } from '@nestjs/csrf';

@Module({
  imports: [
    // ... other imports
  ],
})
export class AuthModule {}

// In main.ts
import { CsrfMiddleware } from '@nestjs/csrf';

app.use(new CsrfMiddleware());

// In auth.controller.ts
@Post('login')
@UseGuards(CsrfGuard)
async login(@Request() req) {
  return this.authService.login(req.user);
}
```

---

### 6. Insufficient Rate Limiting Configuration
**Severity:** HIGH  
**Location:** `smart-erp/src/backend/src/core/auth/auth.controller.ts` (Lines 26-28)

**Issue:**
```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
```

**Risk:** 
- 5 attempts per minute is too lenient for brute force attacks
- No progressive backoff
- No account lockout mechanism

**Fix:**
```typescript
// ✅ CORRECT - Stricter rate limiting with progressive backoff
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
@Post('login')
async login(@Request() req) {
  // Track failed attempts
  const attempts = await this.authService.getFailedAttempts(req.ip);
  
  if (attempts >= 5) {
    // Lock account for 15 minutes
    await this.authService.lockAccount(req.body.email, 15 * 60 * 1000);
    throw new TooManyRequestsException('Account locked. Try again later.');
  }
  
  return this.authService.login(req.user);
}
```

---

### 7. Missing Security Headers
**Severity:** HIGH  
**Location:** Backend configuration

**Issue:** No security headers configured (CSP, X-Frame-Options, X-Content-Type-Options, etc.)

**Fix:**
```typescript
// In main.ts
import * as helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));
```

---

### 8. No Email Verification Enforcement
**Severity:** HIGH  
**Location:** `smart-erp/src/backend/src/core/auth/auth.service.ts` (Line 240)

**Issue:**
```typescript
emailVerified: false,
emailVerificationToken,
```

**Risk:** Users can access system without verifying email. No enforcement of email verification.

**Fix:**
```typescript
// ✅ CORRECT - Enforce email verification
@Injectable()
export class AuthService {
  async login(user: Omit<UserEntity, 'password'>) {
    // Check if email is verified
    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in. Check your inbox for verification link.'
      );
    }
    
    // ... rest of login logic
  }
  
  async registerTenant(registerTenantDto: RegisterTenantDto) {
    // ... create user ...
    
    // Send verification email
    await this.emailService.sendVerificationEmail(
      savedUser.email,
      emailVerificationToken
    );
    
    return {
      user: savedUser,
      token: accessToken,
      refreshToken,
      message: 'Registration successful. Please verify your email to activate your account.'
    };
  }
}
```

---

## 🟡 MEDIUM SEVERITY VULNERABILITIES

### 9. Sensitive Data in Error Messages
**Severity:** MEDIUM  
**Location:** `smart-erp/src/frontend/src/pages/auth/LoginPage.tsx` (Lines 45-48)

**Issue:**
```typescript
onError: (error: any) => {
  const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại!';
  message.error(errorMsg);
},
```

**Risk:** Backend error messages might expose sensitive information (user existence, system details).

**Fix:**
```typescript
// ✅ CORRECT - Generic error messages
onError: (error: any) => {
  // Log detailed error for debugging (server-side only)
  console.error('Login error:', error);
  
  // Show generic message to user
  const errorMsg = error.response?.status === 401
    ? 'Email hoặc mật khẩu không chính xác'
    : 'Đăng nhập thất bại. Vui lòng thử lại sau.';
  
  message.error(errorMsg);
},
```

---

### 10. No Account Lockout Mechanism
**Severity:** MEDIUM  
**Location:** `smart-erp/src/backend/src/core/auth/auth.service.ts`

**Issue:** No account lockout after failed login attempts.

**Fix:**
```typescript
// ✅ CORRECT - Implement account lockout
@Injectable()
export class AuthService {
  constructor(
    private readonly cacheService: CacheService,
    // ... other dependencies
  ) {}
  
  async validateUser(email: string, password: string) {
    // Check if account is locked
    const lockKey = `account-lock:${email}`;
    const isLocked = await this.cacheService.get(lockKey);
    
    if (isLocked) {
      throw new TooManyRequestsException(
        'Account temporarily locked. Try again in 15 minutes.'
      );
    }
    
    const user = await this.userRepository.findOne({
      where: { email, status: 'active' },
    });
    
    if (!user) {
      // Track failed attempt
      await this.trackFailedAttempt(email);
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Track failed attempt
      await this.trackFailedAttempt(email);
      return null;
    }
    
    // Clear failed attempts on successful login
    await this.cacheService.del(`failed-attempts:${email}`);
    
    const { password: _, ...result } = user;
    return result;
  }
  
  private async trackFailedAttempt(email: string): Promise<void> {
    const key = `failed-attempts:${email}`;
    const attempts = (await this.cacheService.get(key)) || 0;
    const newAttempts = attempts + 1;
    
    if (newAttempts >= 5) {
      // Lock account for 15 minutes
      await this.cacheService.set(`account-lock:${email}`, true, 15 * 60);
    }
    
    // Store failed attempts for 1 hour
    await this.cacheService.set(key, newAttempts, 60 * 60);
  }
}
```

---

### 11. Missing Secure Cookie Configuration
**Severity:** MEDIUM  
**Location:** Backend session/cookie configuration

**Issue:** No evidence of secure cookie flags (HttpOnly, Secure, SameSite).

**Fix:**
```typescript
// In main.ts
import * as cookieParser from 'cookie-parser';

app.use(cookieParser(process.env.COOKIE_SECRET));

// In auth.controller.ts
@Post('login')
async login(@Request() req, @Response() res) {
  const result = await this.authService.login(req.user);
  
  // ✅ CORRECT - Secure cookie configuration
  res.cookie('accessToken', result.token, {
    httpOnly: true,      // Prevent XSS access
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });
  
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/auth/refresh',
  });
  
  return res.json(result);
}
```

---

### 12. No Audit Logging for Authentication Events
**Severity:** MEDIUM  
**Location:** `smart-erp/src/backend/src/core/auth/auth.service.ts`

**Issue:** No logging of authentication events (login, registration, password reset, failed attempts).

**Fix:**
```typescript
// ✅ CORRECT - Add audit logging
@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    private readonly auditService: AuditService,
    // ... other dependencies
  ) {}
  
  async login(user: Omit<UserEntity, 'password'>) {
    // Log successful login
    await this.auditService.log({
      action: 'LOGIN_SUCCESS',
      userId: user.id,
      email: user.email,
      ipAddress: this.getClientIp(),
      timestamp: new Date(),
    });
    
    return this.generateTokens(user);
  }
  
  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email, status: 'active' },
    });
    
    if (!user) {
      // Log failed login attempt
      await this.auditService.log({
        action: 'LOGIN_FAILED_USER_NOT_FOUND',
        email,
        ipAddress: this.getClientIp(),
        timestamp: new Date(),
      });
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Log failed login attempt
      await this.auditService.log({
        action: 'LOGIN_FAILED_INVALID_PASSWORD',
        userId: user.id,
        email,
        ipAddress: this.getClientIp(),
        timestamp: new Date(),
      });
      return null;
    }
    
    const { password: _, ...result } = user;
    return result;
  }
  
  async registerTenant(registerTenantDto: RegisterTenantDto) {
    // ... registration logic ...
    
    // Log registration
    await this.auditService.log({
      action: 'TENANT_REGISTRATION',
      tenantId: savedTenant.id,
      userId: savedUser.id,
      email: savedUser.email,
      ipAddress: this.getClientIp(),
      timestamp: new Date(),
    });
    
    return result;
  }
  
  private getClientIp(): string {
    // Extract client IP from request
    return process.env.CLIENT_IP || 'unknown';
  }
}
```

---

## ✅ POSITIVE FINDINGS

### 1. Strong Password Hashing
✅ **GOOD:** Using bcrypt with 12 salt rounds (exceeds minimum of 10)
```typescript
const SALT_ROUNDS = 12; // Minimum 10, recommended 12 for production
```

### 2. JWT Token Implementation
✅ **GOOD:** Proper JWT token generation with expiration times
```typescript
accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
refreshToken: this.jwtService.sign({ sub: savedUser.id }, { expiresIn: '7d' }),
```

### 3. Password Strength Requirements
✅ **GOOD:** Backend enforces strong password requirements
```typescript
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
  message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
})
```

### 4. Input Validation
✅ **GOOD:** Using class-validator for DTOs
```typescript
@IsEmail({}, { message: 'Invalid email format' })
@MinLength(8, { message: 'Password must be at least 8 characters long' })
```

### 5. Transaction Management
✅ **GOOD:** Using database transactions for tenant registration
```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction();
// ... operations ...
await queryRunner.commitTransaction();
```

### 6. Cache Invalidation
✅ **GOOD:** Invalidating cache after user operations
```typescript
const cacheKey = generateCacheKey('user-email', 'global', data.email);
await this.cacheService.del(cacheKey);
```

---

## 📋 REMEDIATION CHECKLIST

### Immediate (Before Production)
- [ ] Remove hardcoded demo credentials from LoginPage
- [ ] Implement HTTPS/TLS enforcement
- [ ] Add comprehensive subdomain validation
- [ ] Implement CSRF protection
- [ ] Add security headers (helmet)
- [ ] Enforce email verification before login

### Short-term (Within 1 Sprint)
- [ ] Implement account lockout mechanism
- [ ] Add audit logging for auth events
- [ ] Configure secure cookies
- [ ] Improve error message handling
- [ ] Implement progressive rate limiting

### Medium-term (Within 2 Sprints)
- [ ] Add 2FA/MFA support
- [ ] Implement password history
- [ ] Add session management
- [ ] Implement API key authentication
- [ ] Add security monitoring/alerting

### Long-term (Ongoing)
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Dependency vulnerability scanning
- [ ] Security training for team
- [ ] Incident response procedures

---

## 🔐 COMPLIANCE CHECKLIST

### OWASP Top 10
- [ ] A01:2021 – Broken Access Control
- [ ] A02:2021 – Cryptographic Failures
- [ ] A03:2021 – Injection
- [ ] A04:2021 – Insecure Design
- [ ] A05:2021 – Security Misconfiguration
- [ ] A06:2021 – Vulnerable and Outdated Components
- [ ] A07:2021 – Identification and Authentication Failures
- [ ] A08:2021 – Software and Data Integrity Failures
- [ ] A09:2021 – Logging and Monitoring Failures
- [ ] A10:2021 – Server-Side Request Forgery (SSRF)

### GDPR Compliance
- [ ] Data encryption at rest
- [ ] Data encryption in transit
- [ ] User consent management
- [ ] Right to be forgotten implementation
- [ ] Data breach notification procedures

### PCI DSS (if handling payments)
- [ ] Secure password storage
- [ ] Encrypted transmission
- [ ] Access control
- [ ] Regular security testing
- [ ] Audit logging

---

## 📞 RECOMMENDATIONS

### 1. Implement Multi-Factor Authentication (MFA)
Add TOTP or SMS-based MFA for enhanced security.

### 2. Add OAuth2/OpenID Connect
Support third-party authentication (Google, Microsoft, etc.)

### 3. Implement Session Management
Add session timeout, concurrent session limits, and device management.

### 4. Add Security Monitoring
Implement real-time alerts for suspicious activities:
- Multiple failed login attempts
- Unusual login locations
- Rapid API calls
- Privilege escalation attempts

### 5. Regular Security Updates
- Update dependencies monthly
- Monitor security advisories
- Implement automated dependency scanning

### 6. Security Training
- Train developers on secure coding
- Conduct regular security reviews
- Implement code review checklist

### 7. Incident Response Plan
- Document incident response procedures
- Establish security contact
- Create incident response team

---

## 📊 RISK SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 4 | Requires immediate action |
| 🟠 HIGH | 4 | Must fix before production |
| 🟡 MEDIUM | 4 | Should fix soon |
| 🟢 LOW | 0 | Monitor |
| ✅ POSITIVE | 6 | Maintain |

**Overall Risk Level:** 🔴 **HIGH** - Address critical issues before production deployment

---

## 📝 AUDIT NOTES

- Audit conducted on authentication system components
- Focused on OWASP Top 10 vulnerabilities
- Reviewed backend auth service, frontend auth pages, and API endpoints
- Positive findings indicate good foundational security practices
- Recommendations prioritized by severity and impact

---

**Audit Completed By:** Security Engineer  
**Date:** March 2026  
**Next Review:** After critical fixes implemented  
**Status:** PENDING REMEDIATION
