import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportingController } from './reporting.controller';
import { Account } from '@/domains/accounting/account/entities/account.entity';
import { JournalLine } from '@/domains/accounting/account/entities/journal-line.entity';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Invoice } from '@/domains/accounting/account/entities/invoice.entity';
import { Payment } from '@/domains/accounting/payment/entities/payment.entity';
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, JournalLine, Product, Customer, Invoice, Payment]),
    SecurityModule,
  ],
  controllers: [ReportsController, ReportingController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
