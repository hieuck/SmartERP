import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { {{EntityName}}Controller } from './{{entity-name}}.controller';
import { {{EntityName}}Service } from './{{entity-name}}.service';
import { {{EntityName}} } from './entities/{{entity-name}}.entity';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';

/**
 * {{EntityName}}Module - Odoo/ERPNext Style Module
 * 
 * ARCHITECTURE PRINCIPLES:
 * - Module-based structure (Odoo style)
 * - Self-contained with clear dependencies
 * - Always includes SecurityModule for tenant isolation
 * - Always includes CacheModule for performance
 * - Exports service for use by other modules
 * 
 * REQUIRED IMPORTS:
 * ✅ TypeOrmModule.forFeature([Entity]) - Database access
 * ✅ CacheModule - Caching support
 * ✅ SecurityModule - SecureRepository & PermissionService
 * 
 * OPTIONAL IMPORTS (add as needed):
 * - WorkflowModule - For approval workflows
 * - NotificationModule - For notifications
 * - AuditModule - For audit logging
 * - Other domain modules - For cross-module operations
 */
@Module({
  imports: [
    // TypeORM entity registration
    TypeOrmModule.forFeature([{{EntityName}}]),
    
    // REQUIRED: Cache support for performance
    CacheModule,
    
    // REQUIRED: Security (SecureRepository + PermissionService)
    SecurityModule,
    
    // OPTIONAL: Add other modules as needed
    // WorkflowModule,
    // NotificationModule,
    // AuditModule,
  ],
  controllers: [{{EntityName}}Controller],
  providers: [{{EntityName}}Service],
  exports: [{{EntityName}}Service], // Export for use by other modules
})
export class {{EntityName}}Module {}
