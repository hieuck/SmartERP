import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

import { CustomThrottlerGuard } from './common/guards/throttler.guard';

import { CacheModule as CustomCacheModule } from './common/cache/cache.module';
import { CommonModule } from './common/common.module';
import { GdprModule } from './common/gdpr/gdpr.module';
import { LoggerModule } from './common/logger/logger.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { SecurityModule } from './common/security/security.module';

import { AuthModule } from './core/auth/auth.module';
import { PermissionModule } from './core/permission/permission.module';
import { SettingsModule } from './core/settings/settings.module';
import { TenantModule } from './core/tenant/tenant.module';
import { UserModule } from './core/user/user.module';

import { AccountingDomainModule } from './domains/accounting/accounting.module';

import { PurchaseOrderModule } from './domains/purchasing/purchase-order/purchase-order.module';
import { SerialBatchModule } from './domains/inventory/serial-batch/serial-batch.module';
import { ValuationModule } from './domains/inventory/valuation/valuation.module';

import { AttendanceModule } from './domains/hr/attendance/attendance.module';
import { EmployeeModule } from './domains/hr/employee/employee.module';
import { LeaveModule } from './domains/hr/leave/leave.module';
import { PayrollModule } from './domains/hr/payroll/payroll.module';
import { RoleModule } from './domains/hr/role/role.module';

import { BOMModule } from './domains/manufacturing/bom/bom.module';
import { WorkCenterModule } from './domains/manufacturing/work-center/work-center.module';
import { WorkOrderModule } from './domains/manufacturing/work-order/work-order.module';

import { OrderModule as EcommerceOrderModule } from './domains/ecommerce/order/order.module';
import { ProductCatalogModule } from './domains/ecommerce/product-catalog/product-catalog.module';
import { ShoppingCartModule } from './domains/ecommerce/shopping-cart/shopping-cart.module';

import { ProjectModule } from './domains/project/project.module';

import { AuditModule } from './platform/audit/audit.module';
import { DashboardModule } from './platform/dashboard/dashboard.module';
import { DocumentModule } from './platform/document/document.module';
import { EmailModule } from './platform/email/email.module';
import { IssueTrackingModule } from './platform/issue-tracking/issue-tracking.module';
import { NotificationModule } from './platform/notification/notification.module';
import { ReportModule } from './platform/report/report.module';
import { SearchModule } from './platform/search/search.module';
import { SupportModule } from './platform/support/support.module';
import { SystemAdminModule } from './platform/system-admin/system-admin.module';
import { WorkflowModule } from './platform/workflow/workflow.module';

import { IntegrationModule } from './integrations/integration/integration.module';
import { PaymentGatewayModule } from './integrations/payment-gateway/payment-gateway.module';
import { ShippingModule } from './integrations/shipping/shipping.module';

import { getCacheConfig } from './config/cache.config';
import { getTypeOrmLogging } from './config/database.config';
import { HealthModule } from './utilities/health/health.module';
import { ImportExportModule } from './utilities/import-export/import-export.module';
import { ScheduledJobsModule } from './utilities/scheduled-jobs/scheduled-jobs.module';
import { SeedModule } from './utilities/seed/seed.module';

import { ProductModule } from './domains/inventory/product/product.module';
import { InventoryModule } from './domains/inventory/inventory.module';
import { CustomerModule } from './domains/sales/customer/customer.module';
import { SupplierModule } from './domains/purchasing/supplier/supplier.module';
import { CrmModule } from './domains/sales/crm/crm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5432),
          username: configService.get('DB_USER', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_NAME', 'erp_production'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          autoLoadEntities: true,
          synchronize: false, // Always false - use migrations instead
          logging: getTypeOrmLogging(
            configService.get<string>('NODE_ENV'),
            configService.get<string>('DB_LOGGING'),
          ),
          migrations: isProduction
            ? [__dirname + '/dist/migrations/*.js']
            : [__dirname + '/../migrations/*.ts'],
          migrationsRun: isProduction,
        };
      },
      inject: [ConfigService],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: getCacheConfig,
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    CommonModule,
    LoggerModule,
    MetricsModule,
    CustomCacheModule,
    SecurityModule,
    GdprModule,

    AuthModule,
    UserModule,
    PermissionModule,
    TenantModule,
    SettingsModule,

    AccountingDomainModule,
    SerialBatchModule,
    ValuationModule,
    AttendanceModule,
    EmployeeModule,
    LeaveModule,
    PayrollModule,
    RoleModule,
    BOMModule,
    WorkCenterModule,
    WorkOrderModule,
    PurchaseOrderModule,
    ProductCatalogModule,
    ShoppingCartModule,
    EcommerceOrderModule,
    ProjectModule,

    WorkflowModule,
    DocumentModule,
    NotificationModule,
    AuditModule,
    DashboardModule,
    ReportModule,
    SearchModule,
    EmailModule,
    IssueTrackingModule,
    SupportModule,
    SystemAdminModule,

    IntegrationModule,
    PaymentGatewayModule,
    ShippingModule,

    HealthModule,
    ImportExportModule,
    ScheduledJobsModule,
    SeedModule,

    ProductModule,
    InventoryModule,
    CustomerModule,
    SupplierModule,
    CrmModule,
  ],
  providers: [
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
