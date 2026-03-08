---
name: security-authentication-patterns
description: Security and authentication patterns for SmartERP including JWT, RBAC, OWASP best practices, and multi-tenant security. Use when implementing authentication, authorization, or security features.
---

# Security & Authentication Patterns

## 1. JWT Authentication

### ✅ Token Structure

```typescript
interface JwtPayload {
  sub: string; // User ID
  email: string;
  tenantId: string; // Multi-tenant isolation
  roles: string[]; // RBAC roles
  permissions: string[];
  iat: number; // Issued at
  exp: number; // Expiration
}
```

### ✅ Login Flow

```typescript
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // 1. Validate credentials
  const user = await this.authService.validateUser(
    loginDto.email,
    loginDto.password
  );

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // 2. Generate tokens
  const accessToken = this.jwtService.sign({
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    roles: user.roles,
  }, { expiresIn: '15m' });

  const refreshToken = this.jwtService.sign({
    sub: user.id,
    type: 'refresh',
  }, { expiresIn: '7d' });

  // 3. Store refresh token
  await this.authService.storeRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken };
}
```

## 2. RBAC (Role-Based Access Control)

### ✅ Role Hierarchy

```typescript
enum Role {
  SUPER_ADMIN = 'super_admin', // All permissions
  ADMIN = 'admin', // Tenant admin
  MANAGER = 'manager', // Department manager
  USER = 'user', // Regular user
  GUEST = 'guest', // Read-only
}

const roleHierarchy = {
  super_admin: ['admin', 'manager', 'user', 'guest'],
  admin: ['manager', 'user', 'guest'],
  manager: ['user', 'guest'],
  user: ['guest'],
  guest: [],
};
```

### ✅ Permission Guard

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler()
    );

    if (!requiredPermission) return true;

    return this.permissionService.hasPermission(
      user,
      requiredPermission
    );
  }
}

// Usage
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission('products:delete')
@Delete(':id')
async delete(@Param('id') id: string) {
  // Only users with 'products:delete' permission can access
}
```

## 3. Multi-Tenant Security

### ✅ Tenant Isolation Middleware

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user;

    if (!user?.tenantId) {
      throw new UnauthorizedException('Tenant not found');
    }

    // Inject tenantId into request
    req['tenantId'] = user.tenantId;
    next();
  }
}
```

### ✅ Tenant Validation

```typescript
async findById(id: string, user: User) {
  const entity = await this.secureRepo.findOne(user, {
    where: { id },
  });

  if (!entity) {
    throw new NotFoundException('Entity not found');
  }

  // Double-check tenant isolation
  if (entity.tenantId !== user.tenantId) {
    throw new ForbiddenException('Access denied');
  }

  return entity;
}
```

## 4. OWASP Top 10 Protection

### ✅ SQL Injection Prevention

```typescript
// ❌ NEVER do this
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Always use parameterized queries
const user = await this.userRepository.findOne({
  where: { email }, // TypeORM handles escaping
});

// ✅ Or use query builder
const users = await this.userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email }) // Parameterized
  .getMany();
```

### ✅ XSS Prevention

```typescript
import { sanitize } from 'class-sanitizer';

export class CreatePostDto {
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => sanitize(value)) // Sanitize HTML
  content: string;
}
```

### ✅ CSRF Protection

```typescript
// Enable CSRF in main.ts
app.use(csurf({ cookie: true }));

// Frontend must send CSRF token
headers: {
  'X-CSRF-Token': csrfToken,
}
```

### ✅ Rate Limiting

```typescript
@UseGuards(ThrottlerGuard)
@Throttle(10, 60) // 10 requests per 60 seconds
@Post('login')
async login() {
  // Protected endpoint
}
```

## 5. Password Security

### ✅ Hashing with bcrypt

```typescript
import * as bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12); // Cost factor 12
  return bcrypt.hash(password, salt);
}

async comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
```

### ✅ Password Policy

```typescript
export class PasswordValidator {
  static validate(password: string): boolean {
    return (
      password.length >= 12 &&
      /[A-Z]/.test(password) && // Uppercase
      /[a-z]/.test(password) && // Lowercase
      /[0-9]/.test(password) && // Number
      /[^A-Za-z0-9]/.test(password) // Special char
    );
  }
}
```

## 6. API Security Headers

```typescript
// main.ts
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }),
);
```

## 7. Audit Logging

### ✅ Security Event Logging

```typescript
@Injectable()
export class SecurityLogger {
  logLoginAttempt(email: string, success: boolean, ip: string) {
    this.logger.log({
      event: 'LOGIN_ATTEMPT',
      email,
      success,
      ip,
      timestamp: new Date(),
    });
  }

  logPermissionDenied(userId: string, resource: string, action: string) {
    this.logger.warn({
      event: 'PERMISSION_DENIED',
      userId,
      resource,
      action,
      timestamp: new Date(),
    });
  }
}
```

## Security Checklist

- [ ] ✅ JWT tokens with short expiration (15min access, 7d refresh)
- [ ] ✅ RBAC with role hierarchy
- [ ] ✅ Permission guards on sensitive endpoints
- [ ] ✅ Tenant isolation in all queries
- [ ] ✅ SQL injection prevention (parameterized queries)
- [ ] ✅ XSS prevention (input sanitization)
- [ ] ✅ CSRF protection enabled
- [ ] ✅ Rate limiting on auth endpoints
- [ ] ✅ Password hashing with bcrypt (cost 12+)
- [ ] ✅ Strong password policy enforced
- [ ] ✅ Security headers (Helmet)
- [ ] ✅ Audit logging for security events
- [ ] ✅ HTTPS only in production
- [ ] ✅ Secrets in environment variables (not code)
