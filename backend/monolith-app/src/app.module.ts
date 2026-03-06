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

// Common Modules
import { CommonModule } from './common/common.module';
import { LoggerModule } from './common/logger/logger.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { CacheModule as CustomCacheModule } from './common/cache/cache.module';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderModule } from './modules/order/order.module';
import { CustomerModule } from './modules/customer/customer.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { PaymentModule } from './modules/payment/payment.module';
import { HealthModule } from './modules/health/health.module';
import { ProductionModule } from './modules/production/production.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ReportModule } from './modules/report/report.module';
import { CrmModule } from './modules/crm/crm.module';
import { HrModule } from './modules/hr/hr.module';
import { DocumentModule } from './modules/document/document.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { EmailModule } from './modules/email/email.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditModule } from './modules/audit/audit.module';
import { SearchModule } from './modules/search/search.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { ScheduledJobsModule } from './modules/scheduled-jobs/scheduled-jobs.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PaymentGatewayModule } from './modules/payment-gateway/payment-gateway.module';
import { CategoryModule } from './modules/category/category.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import { TenantModule } from './modules/tenant/tenant.module';

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
        database: configService.get('DB_NAME', 'plaster_erp'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize:
          configService.get('NODE_ENV') === 'test' || configService.get('DB_SYNC') === 'true', // Enable for tests
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Cache (Redis)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL', 'redis://localhost:6379');
        return {
          store: await redisStore({
            url: redisUrl,
            ttl: 300000, // 5 minutes default
          }),
        };
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

    // Feature Modules
    HealthModule,
    AuthModule,
    UserModule,
    ProductModule,
    InventoryModule,
    OrderModule,
    CustomerModule,
    SupplierModule,
    PaymentModule,
    ProductionModule,
    AccountingModule,
    ReportModule,
    CrmModule,
    HrModule,
    DocumentModule,
    WorkflowModule,
    EmailModule,
    NotificationModule,
    AuditModule,
    SearchModule,
    ImportExportModule,
    IntegrationModule,
    ShippingModule,
    ScheduledJobsModule,
    PayrollModule,
    PaymentGatewayModule,
    CategoryModule,
    PermissionModule,
    RoleModule,
    TenantModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware, LoggingMiddleware, TenantMiddleware).forRoutes('*');
  }
}
