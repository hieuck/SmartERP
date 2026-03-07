# Security Implementation Guide

## Overview

This document describes the security features implemented in the Smart ERP system.

## Authentication

### JWT Authentication

All API endpoints (except auth endpoints) require JWT authentication.

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  // All methods require authentication
}
```

## Authorization

### Role-Based Access Control (RBAC)

Use the `@Roles()` decorator with `RolesGuard` to restrict access by role.

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Get('users')
  @Roles('admin', 'manager')
  async getUsers() {
    // Only admin and manager can access
  }
  
  @Delete('users/:id')
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    // Only admin can access
  }
}
```

**Available Roles:**
- `admin` - Full system access
- `manager` - Management operations
- `user` - Standard user operations
- `viewer` - Read-only access

## Multi-Tenant Isolation

### TenantGuard

Ensures tenant isolation by validating user's tenantId.

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards';

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductController {
  // All methods enforce tenant isolation
}
```

### TenantId Decorator

Extract tenantId from authenticated user.

```typescript
import { TenantId } from '../common/decorators';

@Get()
async findAll(@TenantId() tenantId: string) {
  return this.productService.findAll(tenantId);
}
```

### UserId Decorator

Extract userId from authenticated user.

```typescript
import { UserId } from '../common/decorators';

@Post()
async create(
  @Body() createDto: CreateProductDto,
  @TenantId() tenantId: string,
  @UserId() userId: string,
) {
  return this.productService.create(createDto, tenantId, userId);
}
```

## Complete Example

```typescript
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, TenantGuard, Roles } from '../common/guards';
import { TenantId, UserId } from '../common/decorators';

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Roles('admin', 'manager', 'user', 'viewer')
  async findAll(@TenantId() tenantId: string) {
    return this.productService.findAll(tenantId);
  }

  @Post()
  @Roles('admin', 'manager', 'user')
  async create(
    @Body() createDto: CreateProductDto,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ) {
    return this.productService.create(createDto, tenantId, userId);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.productService.remove(id, tenantId);
  }
}
```

## Security Best Practices

### 1. Always Use Guards

```typescript
// ✅ Good
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductController {}

// ❌ Bad - No authentication
export class ProductController {}
```

### 2. Apply Tenant Isolation

```typescript
// ✅ Good - Tenant isolation enforced
async findAll(@TenantId() tenantId: string) {
  return this.repository.find({ where: { tenantId } });
}

// ❌ Bad - No tenant filtering
async findAll() {
  return this.repository.find();
}
```

### 3. Use Role-Based Access

```typescript
// ✅ Good - Role-based access
@Roles('admin', 'manager')
@Delete(':id')
async remove(@Param('id') id: string) {}

// ❌ Bad - No role restriction
@Delete(':id')
async remove(@Param('id') id: string) {}
```

### 4. Validate Input

```typescript
// ✅ Good - DTO validation
@Post()
async create(@Body() createDto: CreateProductDto) {}

// ❌ Bad - No validation
@Post()
async create(@Body() data: any) {}
```

### 5. Sanitize Output

```typescript
// ✅ Good - Remove sensitive data
async login(user: User) {
  const { password, ...result } = user;
  return result;
}

// ❌ Bad - Expose password
async login(user: User) {
  return user;
}
```

## Password Security

- Passwords are hashed using bcrypt with 10 rounds
- Never store plain text passwords
- Never return passwords in API responses
- Enforce strong password requirements

## JWT Token Security

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens include: userId, email, tenantId, role
- Tokens are signed with secret key
- Use HTTPS in production

## Rate Limiting

Implement rate limiting on authentication endpoints:

```typescript
@UseGuards(ThrottlerGuard)
@Post('login')
async login(@Body() loginDto: LoginDto) {}
```

## Audit Trail

All sensitive operations are logged in the audit table:

- User actions (CREATE, UPDATE, DELETE)
- Authentication events (LOGIN, LOGOUT)
- Data exports (EXPORT)
- Data imports (IMPORT)

## Security Checklist

- [ ] All endpoints use JwtAuthGuard
- [ ] Sensitive endpoints use RolesGuard
- [ ] All queries filter by tenantId
- [ ] Input validation with DTOs
- [ ] Output sanitization (no passwords)
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging enabled
- [ ] HTTPS in production
- [ ] Environment variables secured
- [ ] Database credentials encrypted

## Reporting Security Issues

If you discover a security vulnerability, please email: security@smarterp.com

Do not create public GitHub issues for security vulnerabilities.
