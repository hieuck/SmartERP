import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { AccountType } from './entities/account.entity';
import { InvoiceType } from './entities/invoice.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // Chart of Accounts
  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiQuery({ name: 'type', required: false, enum: AccountType })
  findAllAccounts(@TenantId() tenantId: string, @Query('type') type?: AccountType) {
    return this.accountingService.findAllAccounts(tenantId, type);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account by ID' })
  findAccountById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.accountingService.findAccountById(id, tenantId);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create account' })
  createAccount(@Body() data: CreateAccountDto, @TenantId() tenantId: string) {
    return this.accountingService.createAccount(data, tenantId);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Update account' })
  updateAccount(
    @Param('id') id: string,
    @Body() data: UpdateAccountDto,
    @TenantId() tenantId: string,
  ) {
    return this.accountingService.updateAccount(id, data, tenantId);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete account' })
  deleteAccount(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.accountingService.deleteAccount(id, tenantId);
  }

  // Journal Entries
  @Get('journal-entries')
  @ApiOperation({ summary: 'Get all journal entries' })
  findAllJournalEntries(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.accountingService.findAllJournalEntries(tenantId, start, end);
  }

  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  findJournalEntryById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.accountingService.findJournalEntryById(id, tenantId);
  }

  @Post('journal-entries')
  @ApiOperation({ summary: 'Create journal entry' })
  createJournalEntry(@Body() data: CreateJournalEntryDto, @TenantId() tenantId: string) {
    return this.accountingService.createJournalEntry(
      data as unknown as Partial<JournalEntry>,
      tenantId,
    );
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Post journal entry' })
  postJournalEntry(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.accountingService.postJournalEntry(id, tenantId);
  }

  // Invoices
  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'type', required: false, enum: InvoiceType })
  findAllInvoices(@TenantId() tenantId: string, @Query('type') type?: InvoiceType) {
    return this.accountingService.findAllInvoices(tenantId, type);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findInvoiceById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.accountingService.findInvoiceById(id, tenantId);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Create invoice' })
  createInvoice(@Body() data: Record<string, unknown>, @TenantId() tenantId: string) {
    return this.accountingService.createInvoice(data, tenantId);
  }

  @Put('invoices/:id')
  @ApiOperation({ summary: 'Update invoice' })
  updateInvoice(
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
    @TenantId() tenantId: string,
  ) {
    return this.accountingService.updateInvoice(id, data, tenantId);
  }

  @Delete('invoices/:id')
  @ApiOperation({ summary: 'Delete invoice' })
  deleteInvoice(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.accountingService.deleteInvoice(id, tenantId);
  }

  // Financial Reports
  @Get('reports/balance-sheet')
  @ApiOperation({ summary: 'Get balance sheet' })
  getBalanceSheet(@TenantId() tenantId: string, @Query('asOfDate') asOfDate: string) {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    return this.accountingService.getBalanceSheet(tenantId, date);
  }

  @Get('reports/profit-loss')
  @ApiOperation({ summary: 'Get profit and loss statement' })
  getProfitAndLoss(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.accountingService.getProfitAndLoss(tenantId, start, end);
  }
}
