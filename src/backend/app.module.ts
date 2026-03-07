import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-redis-yet';

// Middleware
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';

// Guards
import { CustomThrottlerGuard } from './common/guards/throttler.guard';

// Common Modules
import { CommonModule } from './common/common.module';
import { LoggerModule } from './common/logger/logger.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { CacheModule as CustomCacheModule } from './common/cache/cache.module';
import { SecurityModule } from './common/security/security.module';
import { GdprModule } from './common/gdpr/gdpr.module';

// Core Modules
import { AuthModule } from './core/auth/auth.module';
import { UserModule } from './core/user/user.module';
import { PermissionModule } from './core/permission/permission.module';
import { TenantModule } from './core/tenant/tenant.module';
import { SettingsModule } from './core/settings/settings.module';

// Domain Modules - Accounting
import { AccountingDomainModule } from './domains/accounting/accounting.module';

// Domain Modules - Inventory
import { SerialBatchModule } from './domains/inventory/serial-batch/serial-batch.module';
import { ValuationModule } from './domains/inventory/valuation/valuation.module';

// Domain Modules - HR
import { AttendanceModule } from './domains/hr/attendance/attendance.module';
import { LeaveModule } from './domains/hr/leave/leave.module';
import { PayrollModule } from './domains/hr/payroll/payroll.module';

// Domain Modules - Manufacturing
import { BOMModule } from './domains/manufacturing/bom/bom.module';
import { WorkCenterModule } from './domains/manufacturing/work-center/work-center.module';
import { WorkOrderModule } from './domains/manufacturing/work-order/work-order.module';
import { MaterialModule } from './domains/manufacturing/material/material.module';
import { MoldModule } from './domains/manufacturing/mold/mold.module';
import { QualityCheckModule } from './domains/manufacturing/quality-check/quality-check.module';

// Domain Modules - eCommerce
import { ProductCatalogModule } from './domains/ecommerce/product-catalog/product-catalog.module';
import { ShoppingCartModule } from './domains/ecommerce/shopping-cart/shopping-cart.module';
import { OrderModule as EcommerceOrderModule } from './domains/ecommerce/order/order.module';

// Domain Modules - Project Management
import { ProjectModule } from './domains/project/project.module';

// Platform Modules
import { WorkflowModule } from './platform/workflow/workflow.module';
import { DocumentModule } from './platform/document/document.module';
import { NotificationModule } from './platform/notification/notification.module';
import { AuditModule } from './platform/audit/audit.module';
import { DashboardModule } from './platform/dashboard/dashboard.module';
import { ReportModule } from './platform/report/report.module';
import { SearchModule } from './platform/search/search.module';
import { EmailModule } from './platform/email/email.module';

// Integration Modules
import { IntegrationModule } from './integrations/integration/integration.module';
import { PaymentGatewayModule } from './integrations/payment-gateway/payment-gateway.module';
import { ShippingModule } from './integrations/shipping/shipping.module';

// Utility Modules
import { HealthModule } from './utilities/health/health.module';
import { ImportExportModule } from './utilities/import-export/import-export.module';
import { ScheduledJobsModule } from './utilities/scheduled-jobs/scheduled-jobs.module';

// Legacy Modules - REMOVED (migrated to domains/manufacturing/)

// Placeholder imports for modules that don't exist yet
// These will be removed once actual modules are created
const ProductModule = { module: class ProductModule {} };
const InventoryModule = { module: class InventoryModule {} };
const CustomerModule = { module: class CustomerModule {} };
const SupplierModule = { module: class SupplierModule {} };
const PaymentModule = { module: class PaymentModule {} };
const CrmModule = { module: class CrmModule {} };
const HrModule = { module: class HrModule {} };
const CategoryModule = { module: class CategoryModule {} };
const RoleModule = { module: class RoleModule {} };

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'smarterp'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize:
          configService.get('NODE_ENV') === 'test' || configService.get('DB_SYNC') === 'true', // Enable for tests
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Cache (Redis) - Enhanced configuration with retry strategy and connection pooling
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const { getCacheConfig } = await import('./config/cache.config');
        return getCacheConfig(configService);
      },
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute (general)
      },
    ]),

    // Common Modules
    CommonModule,
    LoggerModule,
    MetricsModule,
    CustomCacheModule,
    SecurityModule,
    GdprModule,

    // Core Modules
    AuthModule,
    UserModule,
    PermissionModule,
    TenantModule,
    SettingsModule,

    // Domain Modules
    AccountingDomainModule,
    SerialBatchModule, // Serial/Batch Tracking (Phase 2, Week 13-15)
    ValuationModule, // FIFO Valuation (Phase 2, Week 16)
    AttendanceModule, // Attendance Management (Phase 2, Week 17-19)
    LeaveModule, // Leave Management (Phase 2, Week 17-19)
    PayrollModule, // Payroll Management (Phase 2, Week 20-21)
    BOMModule, // BOM Management (Phase 2, Week 22-24)
    WorkCenterModule, // Work Center Management (Phase 2, Week 22-24)    WorkOrderModule, // Work Order Management (Phase 2, Week 22-24)
    MaterialModule, // Material Management (migrated 2026-03-07)
    MoldModule, // Mold Management (migrated 2026-03-07)
    QualityCheckModule, // Quality Check Management (migrated 2026-03-07)
    ProductCatalogModule, // eCommerce Product Catalog (Phase 3, Week 30-32)
    ShoppingCartModule, // eCommerce Shopping Cart (Phase 3, Week 30-32)
    EcommerceOrderModule, // eCommerce Order & Checkout (Phase 3, Week 33-34)
    ProjectModule, // Project Management (Phase 3, Week 35-37)

    // Platform Modules
    WorkflowModule,
    DocumentModule,
    NotificationModule,
    AuditModule,
    DashboardModule,
    ReportModule,
    SearchModule,
    EmailModule,

    // Integration Modules
    IntegrationModule,
    PaymentGatewayModule,
    ShippingModule,

    // Utility Modules
    HealthModule,
    ImportExportModule,
    ScheduledJobsModule,

    // Legacy Modules - REMOVED (migrated to domains/manufacturing/ on 2026-03-07)

    // Placeholder modules (to be replaced with actual implementations)
    ProductModule.module,
    InventoryModule.module,
    CustomerModule.module,
    SupplierModule.module,
    PaymentModule.module,
    CrmModule.module,
    HrModule.module,
    CategoryModule.module,
    RoleModule.module,
  ],
  providers: [
    // Global Guards - Apply rate limiting to all endpoints
    {
      provide: 'APP_GUARD',
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware, LoggingMiddleware, TenantMiddleware).forRoutes('*');
  }
}
